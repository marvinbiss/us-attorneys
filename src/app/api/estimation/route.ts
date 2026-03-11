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

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
  context: z.object({
    metier: z.string().min(1),
    ville: z.string().min(1),
    departement: z.string().min(1).max(3),
    artisan: z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      publicId: z.string().min(1),
    }).optional(),
  }),
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
    .map((t) => `| ${t.prestation} | ${t.prix_min}\u20AC | ${t.prix_max}\u20AC | ${t.unite} |`)
    .join('\n')
  return `${header}\n${rows}`
}

function buildSystemPrompt(
  metierName: string,
  ville: string,
  departement: string,
  coefficient: number,
  formattedGrid: string,
  artisanName?: string,
): string {
  const artisanLine = artisanName
    ? `\n\u2022 Artisan : ${artisanName}\nLe visiteur consulte la fiche de ${artisanName}, un ${metierName.toLowerCase()} \u00E0 ${ville}.`
    : ''

  const ctaLine = artisanName
    ? `"Souhaitez-vous envoyer votre demande \u00E0 ${artisanName} ?"`
    : `"Souhaitez-vous \u00EAtre mis en relation avec un ${metierName.toLowerCase()} v\u00E9rifi\u00E9 \u00E0 ${ville} ?"`

  return `Tu es l'assistant estimation de ServicesArtisans.fr.
CONTEXTE :
\u2022 M\u00E9tier : ${metierName}
\u2022 Ville : ${ville} (${departement})
\u2022 Coefficient g\u00E9ographique : ${coefficient}${artisanLine}

GRILLE TARIFAIRE \u2014 ${metierName.toUpperCase()} :
${formattedGrid}

R\u00C8GLES :
1. Pose UNE seule question \u00E0 la fois, maximum 3 avant l'estimation
2. Sois concis : 3-4 lignes max par r\u00E9ponse
3. Pour calculer : prends min/max de la grille \u00D7 coefficient g\u00E9ographique
4. Donne TOUJOURS une fourchette en gras : **min\u20AC \u2014 max\u20AC**
5. Pr\u00E9cise que c'est une estimation indicative
6. Apr\u00E8s l'estimation, propose la mise en relation :
   ${ctaLine}
7. Si urgence mentionn\u00E9e, propose le rappel imm\u00E9diat
8. Ne donne JAMAIS de conseil technique dangereux
9. Vouvoie toujours
10. 1-2 emojis max par r\u00E9ponse`
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Donn\u00E9es invalides', details: validation.error.flatten() },
        { status: 400 },
      )
    }

    const { messages, context } = validation.data
    const { metier, ville, departement } = context

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
      `tarifs:${metier}`,
      async () => {
        const { data, error } = await supabase
          .from('prestations_tarifs')
          .select('prestation, prix_min, prix_max, unite')
          .eq('metier', metier)

        if (error) {
          logger.error('Erreur r\u00E9cup\u00E9ration tarifs', error, { action: 'estimation' })
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
          logger.warn('Coefficient g\u00E9o non trouv\u00E9, utilisation de 1.0', { action: 'estimation', departement })
          return null
        }
        return data as CoefficientGeo
      },
      604800, // 7 days
    )

    const coefficient = coeffData?.coefficient ?? 1.0

    // 4. Build system prompt
    const formattedGrid = formatGrid(tarifs)
    const systemPrompt = buildSystemPrompt(metier, ville, departement, coefficient, formattedGrid, context.artisan?.name)

    // 5. Call Anthropic with streaming
    const anthropic = new Anthropic()

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })

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
          controller.close()
        } catch (streamError) {
          logger.error('Erreur streaming Anthropic', streamError, { action: 'estimation' })
          controller.error(streamError)
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
    logger.error('Estimation API error', error, { action: 'estimation' })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    )
  }
}
