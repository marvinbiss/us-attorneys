/**
 * Estimation API - US Attorneys
 * Chat streaming with Claude to estimate attorney fees
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
  if (!tarifs.length) return 'No fee schedule available for this practice area.'

  const header = '| Service | Min Price | Max Price | Unit |\n|---|---|---|---|'
  const rows = tarifs
    .map((t) => `| ${t.prestation} | $${t.prix_min} | $${t.prix_max} | ${t.unite} |`)
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
  const attorneyLine = attorneyName
    ? `\n• Attorney: ${attorneyName}\nThe visitor is viewing the profile of ${attorneyName}, a ${metierName.toLowerCase()} attorney in ${ville}.`
    : ''

  const ctaLine = attorneyName
    ? `"Would you like to send your inquiry to ${attorneyName}?"`
    : `"Would you like to connect with a verified ${metierName.toLowerCase()} attorney in ${ville}?"`

  return `You are the fee estimation assistant for us-attorneys.com.
CONTEXT:
• Practice Area: ${metierName}
• City: ${ville} (${departement})
• Geographic coefficient: ${coefficient} (REQUIRED: ALWAYS multiply the fee schedule prices by this coefficient)${attorneyLine}

FEE SCHEDULE — ${metierName.toUpperCase()}:
${formattedGrid}

STRICT RULES:
1. Ask ONE question per response. NEVER two questions. NEVER "and also...?". ONE question, period.
2. Maximum 2-3 questions before giving the estimate. Do not ask more than 3 questions total.
3. If the visitor answers "yes", "no", or a short/vague response, DO NOT rephrase and re-ask the same question. Interpret their answer as best you can and move toward the estimate. If you lack info, give a wider range rather than re-asking.
4. Be concise: 3-4 lines max per response.
5. REQUIRED CALCULATION: fee_min from the schedule × ${coefficient} and fee_max from the schedule × ${coefficient}. Round to the nearest ten.
6. ALWAYS present the range in bold: **$min — $max**
7. Specify that this is an indicative estimate.
8. REQUIRED after each estimate: end with ${ctaLine}
9. If urgency is mentioned, offer an immediate callback.
10. NEVER give dangerous technical advice.
11. Always use formal, professional language. 1-2 emojis max per response.`
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
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
      )
    }

    // 1. Parse & validate body
    const body = await request.json()
    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validation.error.flatten() },
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
        { error: 'Conversation too long (max 20 messages)' },
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
          logger.error('Error fetching fee schedule', error, { action: 'estimation' })
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
          logger.warn('Geographic coefficient not found, using 1.0', { action: 'estimation', departement })
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
            controller.enqueue(encoder.encode('\n\nSorry, the service is temporarily overloaded. Please try again.'))
            controller.close()
          } else {
            logger.error('Anthropic streaming error', streamError, { action: 'estimation' })
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
      { error: 'Server error', debug: process.env.NODE_ENV === 'development' ? errMsg : undefined },
      { status: 500 },
    )
  }
}
