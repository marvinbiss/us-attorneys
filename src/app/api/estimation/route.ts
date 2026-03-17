/**
 * Estimation API - US Attorneys
 * Chat streaming with Claude to estimate attorney fees
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
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
  metier: z.string().min(1),               // legacy field name — matches EstimationContext interface
  metierSlug: z.string().optional(),        // legacy field name
  ville: z.string().min(1),                 // legacy field name
  departement: z.string().max(3).optional().default(''),  // legacy field name
  pageUrl: z.string().optional(),
  artisan: z.object({                       // legacy field name — do not rename without migration
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

// DB-bound: column names from prestations_tarifs table (legacy French names, do not rename without migration)
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
  practiceAreaName: string,
  cityName: string,
  stateCode: string,
  coefficient: number,
  formattedGrid: string,
  attorneyName?: string,
): string {
  const attorneyLine = attorneyName
    ? `\n• Attorney: ${attorneyName}\nThe visitor is viewing the profile of ${attorneyName}, a ${practiceAreaName.toLowerCase()} attorney in ${cityName}.`
    : ''

  const ctaLine = attorneyName
    ? `"Would you like to send your inquiry to ${attorneyName}?"`
    : `"Would you like to connect with a verified ${practiceAreaName.toLowerCase()} attorney in ${cityName}?"`

  return `You are the fee estimation assistant for us-attorneys.com.
CONTEXT:
• Practice Area: ${practiceAreaName}
• City: ${cityName} (${stateCode})
• Geographic coefficient: ${coefficient} (REQUIRED: ALWAYS multiply the fee schedule prices by this coefficient)${attorneyLine}

FEE SCHEDULE — ${practiceAreaName.toUpperCase()}:
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

export const POST = createApiHandler(async ({ request }) => {
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
    const { metier: practiceArea, ville: city, departement: stateCode } = context

    // Normalize practice area to lowercase for DB lookup
    const practiceAreaLower = practiceArea.toLowerCase()

    // Guard: max 20 messages
    if (messages.length > 20) {
      return NextResponse.json(
        { error: 'Conversation too long (max 20 messages)' },
        { status: 400 },
      )
    }

    // 2. Fetch fee schedule grid (cached 24h)
    const supabase = createAdminClient()

    const tarifs = await getCachedData<Tarif[]>(
      `tarifs:${practiceAreaLower}`,
      async () => {
        const { data, error } = await supabase
          .from('prestations_tarifs')
          .select('prestation, prix_min, prix_max, unite')
          .eq('metier', practiceAreaLower)

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
      `coeff:${stateCode}`,
      async () => {
        const { data, error } = await supabase
          .from('coefficients_geo')
          .select('coefficient')
          .eq('departement', stateCode)
          .single()

        if (error) {
          logger.warn('Geographic coefficient not found, using 1.0', { action: 'estimation', state: stateCode })
          return null
        }
        return data as CoefficientGeo
      },
      604800, // 7 days
    )

    const coefficient = coeffData?.coefficient ?? 1.0

    // 4. Build system prompt (sanitize context fields to prevent prompt injection)
    const safePracticeArea = sanitizeForPrompt(practiceArea)
    const safeCity = sanitizeForPrompt(city)
    const safeState = sanitizeForPrompt(stateCode)
    const safeAttorneyName = context.artisan?.name ? sanitizeForPrompt(context.artisan.name) : undefined

    const formattedGrid = formatGrid(tarifs)
    const systemPrompt = buildSystemPrompt(safePracticeArea, safeCity, safeState, coefficient, formattedGrid, safeAttorneyName)

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

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
}, {})
