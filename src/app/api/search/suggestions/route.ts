/**
 * GET /api/search/suggestions?q=...
 * Returns search suggestions (attorneys, specialties, locations) + recent searches.
 *
 * POST /api/search/suggestions
 * Saves a search query to history (fire-and-forget from client).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const querySchema = z.string().min(2).max(100)

const postSchema = z.object({
  query: z.string().min(2).max(200),
  filters: z.record(z.string(), z.unknown()).optional(),
})

// GET - Return suggestions for autocomplete
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.search)
    if (!rateLimitResult.success) {
      return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429 })
    }

    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim()

    const parsed = querySchema.safeParse(q)
    if (!parsed.success) {
      return NextResponse.json(
        { success: true, data: { suggestions: [], recentSearches: [] } },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
      )
    }

    const safeQ = parsed.data.replace(/[^a-zA-Z0-9\s'-]/g, '')
    if (!safeQ || safeQ.length < 2) {
      return NextResponse.json(
        { success: true, data: { suggestions: [], recentSearches: [] } }
      )
    }

    // adminClient justified: public endpoint, no user session — RLS would block anonymous reads
    const supabase = createAdminClient()

    // Run queries in parallel
    const [attorneyResult, specialtyResult, locationResult] = await Promise.allSettled([
      supabase
        .from('attorneys')
        .select('name, slug, address_city, address_state')
        .ilike('name', `${safeQ}%`)
        .eq('is_active', true)
        .is('canonical_attorney_id', null)
        .order('review_count', { ascending: false, nullsFirst: false })
        .limit(3),

      supabase
        .from('specialties')
        .select('name, slug')
        .ilike('name', `%${safeQ}%`)
        .eq('is_active', true)
        .limit(3),

      supabase
        .from('locations_us')
        .select('name, slug, state:states!state_id(abbreviation)')
        .ilike('name', `${safeQ}%`)
        .order('population', { ascending: false })
        .limit(3),
    ])

    const suggestions: Array<{ type: string; text: string; id?: string }> = []

    // Attorneys
    if (attorneyResult.status === 'fulfilled' && attorneyResult.value.data) {
      for (const a of attorneyResult.value.data) {
        const rec = a as Record<string, unknown>
        suggestions.push({
          type: 'attorney',
          text: rec.name as string,
          id: rec.slug as string,
        })
      }
    }

    // Specialties
    if (specialtyResult.status === 'fulfilled' && specialtyResult.value.data) {
      for (const s of specialtyResult.value.data) {
        const rec = s as Record<string, unknown>
        suggestions.push({
          type: 'specialty',
          text: rec.name as string,
        })
      }
    }

    // Locations
    if (locationResult.status === 'fulfilled' && locationResult.value.data) {
      for (const l of locationResult.value.data) {
        const rec = l as Record<string, unknown>
        const state = rec.state as { abbreviation: string } | { abbreviation: string }[] | null
        const abbr = Array.isArray(state) ? state[0]?.abbreviation : state?.abbreviation
        const text = abbr ? `${rec.name}, ${abbr}` : (rec.name as string)
        suggestions.push({
          type: 'location',
          text,
        })
      }
    }

    return NextResponse.json(
      { suggestions, recentSearches: [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-RateLimit-Limit': '60',
        },
      }
    )
  } catch (error) {
    logger.error('[api/search/suggestions] GET failed', {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json(
      { suggestions: [], recentSearches: [] },
      { status: 200 } // Graceful degradation
    )
  }
}

// POST - Save search to history (fire-and-forget)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = postSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } },
        { status: 400 }
      )
    }

    // For now, just acknowledge. A future implementation could store
    // search queries in a search_history table for analytics.
    // We intentionally do NOT store PII without user consent.

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[api/search/suggestions] POST failed', {
      error: error instanceof Error ? error.message : error,
    })
    return NextResponse.json({ success: true }) // Fire-and-forget, always 200
  }
}
