/**
 * Estimation API - ServicesArtisans
 * Chat streaming avec Claude pour estimer le coût d'une prestation artisan
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCachedData } from '@/lib/cache'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
})

const contextSchema = z.object({
  metier: z.string().min(1),
  metierSlug: z.string().optional(),
  ville: z.string().min(1),
  departement: z.string().max(3).optional().default(''),
  pageUrl: z.string().optional(),
  artisan: z.object({
    name: z.string().min(1),
    slug: z.string().optional().default(''),
    publicId: z.string().optional().default(''),
  }).optional(),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  context: contextSchema,
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tarif {
  prestation: string
  prix_min: number
  prix_max: number
  unite: string
}

interface CoefficientGeo {
  coefficient: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGrid(tarifs: Tarif[]): string {
  if (!tarifs.length) return 'Aucune grille tarifaire disponible pour ce métier.'

  const header = '| Prestation | Prix min | Prix max | Unité |\n|---|---|---|---|'
  const rows = tarifs
    .map((t) => `| ${t.prestation} | ${t.prix_min}€ | ${t.prix_max}€ | ${t.unite} |`)
    .join('\n')
  return `${header}\n${rows}`
}

function buildSystemPrompt(
  metierName: string,
  ville: string,
  departement: string,
  coefficient: number,
  formattedGrid: string,
  attorneyName?: string,
): string {
  const artisanLine = attorneyName
    ? `\n• Artisan : ${attorneyName}\nLe visiteur consulte la fiche de ${attorneyName}, un ${metierName.toLowerCase()} à ${ville}.`
    : ''

  const ctaLine = attorneyName
    ? `"Souhaitez-vous envoyer votre demande à ${attorneyName} ?"`
    : `"Souhaitez-vous être mis en relation avec un ${metierName.toLowerCase()} vérifié à ${ville} ?"`

  return `Tu es l'assistant estimation de ServicesArtisans.fr.
CONTEXTE :
• Métier : ${metierName}
• City : ${ville} (${departement})
• Coefficient géographique : ${coefficient} (OBLIGATOIRE : multiplie TOUJOURS les prix de la grille par ce coefficient)${artisanLine}

GRILLE TARIFAIRE — ${metierName.toUpperCase()} :
${formattedGrid}

RÈGLES STRICTES :
1. Pose UNE SEULE question par réponse. JAMAIS deux questions. JAMAIS "et aussi...?". UNE question, point final.
2. Maximum 2-3 questions avant de donner l'estimation. Ne pose pas plus de 3 questions au total.
3. Si le visiteur répond "oui", "non", ou une réponse courte/vague, NE REPOSE PAS la même question reformulée. Interprète sa réponse au mieux et avance vers l'estimation. Si tu manques d'infos, donne une fourchette plus large plutôt que de reposer.
4. Sois concis : 3-4 lignes max par réponse.
5. CALCUL OBLIGATOIRE : prix_min de la grille × ${coefficient} et prix_max de la grille × ${coefficient}. Arrondis à la dizaine.
6. Donne TOUJOURS la fourchette en gras : **min€ — max€**
7. Précise que c'est une estimation indicative.
8. OBLIGATOIRE après chaque estimation : termine par ${ctaLine}
9. Si urgence mentionnée, propose le rappel immédiat.
10. Ne donne JAMAIS de conseil technique dangereux.
11. Vouvoie toujours. 1-2 emojis max par réponse.`
}

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a string before injecting into the LLM system prompt.
 * Strips newlines, control characters, limits length, allows only safe chars.
 */
function sanitizeForPrompt(str: string): string {
  return str
    .replace(/[\n\r]/g, '')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .slice(0, 100)
    .replace(/[^a-zA-ZÀ-ÿ0-9 \-']/g, '')
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 0. Rate limiting (10 requests per minute per IP)
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown'
    const rateLimitResult = rateLimit(ip, 10, 60_000)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    // 1. Parse & validate body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { messages, context } = validation.data
    const { metier, ville, departement } = context

    // Normalize metier to lowercase for DB lookup (widget sends display name like "Plombier")
    const metierLower = metier.toLowerCase()

    // Guard: max 20 messages
    if (messages.length > 20) {
      return NextResponse.json(
        { error: 'Conversation trop longue (max 20 messages)' },
        { status: 400 },
      )
    }

    // 2. Fetch tariff grid (cached 24h)
    const supabase = createAdminClient()

    const tarifs = await getCachedData<Tarif[]>(
      `tarifs:${metierLower}`,
      async () => {
        const { data, error } = await supabase
          .from('prestations_tarifs')
          .select('prestation, prix_min, prix_max, unite')
          .eq('metier', metierLower)

        if (error) {
          logger.error('Erreur récupération tarifs', error, { action: 'estimation' })
          return []
        }
        return (data as Tarif[]) ?? []
      },
      86400, // 24h
      { skipNull: true },
    )

    // 3. Fetch geographic coefficient (cached 7d)
    const coeffData = await getCachedData<CoefficientGeo | null>(
      `coeff:${departement}`,
      async () => {
        const { data, error } = await supabase
          .from('coefficients_geo')
          .select('coefficient')
          .eq('departement', departement)
          .single()

        if (error) {
          logger.warn('Coefficient géo non trouvé, utilisation de 1.0', { action: 'estimation', departement })
          return null
        }
        return data as CoefficientGeo
      },
      604800, // 7 days
    )

    const coefficient = coeffData?.coefficient ?? 1.0

    // 4. Build system prompt (sanitize context fields to prevent prompt injection)
    const safeMetier = sanitizeForPrompt(metier)
    const safeVille = sanitizeForPrompt(ville)
    const safeDepartement = sanitizeForPrompt(departement)
    const safeArtisanName = context.artisan?.name ? sanitizeForPrompt(context.artisan.name) : undefined

    const formattedGrid = formatGrid(tarifs)
    const systemPrompt = buildSystemPrompt(safeMetier, safeVille, safeDepartement, coefficient, formattedGrid, safeArtisanName)

    // 5. Call Anthropic with streaming + timeout
    const anthropic = new Anthropic()

    const abortController = new AbortController()
    const timeout = setTimeout(() => abortController.abort(), 15_000)

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }, { signal: abortController.signal })

    // 6. Return a ReadableStream
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          clearTimeout(timeout)
          controller.close()
        } catch (streamError) {
          clearTimeout(timeout)
          if (abortController.signal.aborted) {
            logger.error('Anthropic stream timed out after 15s', streamError, { action: 'estimation' })
            controller.enqueue(encoder.encode('\n\nDésolé, le service est temporairement surchargé. Veuillez réessayer.'))
            controller.close()
          } else {
            logger.error('Erreur streaming Anthropic', streamError, { action: 'estimation' })
            controller.error(streamError)
          }
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    logger.error('Estimation API error', error, { action: 'estimation', message: errMsg })
    return NextResponse.json(
      { error: 'Erreur serveur', debug: process.env.NODE_ENV === 'development' ? errMsg : undefined },
      { status: 500 },
    )
  }
}
