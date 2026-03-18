/**
 * Autocomplete API for SearchBar
 * GET /api/search/autocomplete?q=...
 *
 * Returns grouped results:
 * - attorneys: name prefix match (ILIKE) on attorneys table
 * - locations: city name prefix match on locations_us table
 * - specialties: name prefix match on specialties table
 *
 * Limit: 5 results per category.
 * Cache: 1h via Cache-Control headers.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'

const querySchema = z.string().min(2).max(100)

interface AutocompleteResult {
  attorneys: Array<{
    type: 'attorney'
    name: string
    slug: string
    stable_id: string | null
    city: string | null
    state: string | null
    specialty: string | null
  }>
  locations: Array<{
    type: 'location'
    name: string
    slug: string
    state_name: string | null
    state_abbr: string | null
    population: number | null
  }>
  specialties: Array<{
    type: 'specialty'
    name: string
    slug: string
    category: string | null
  }>
}

export const GET = createApiHandler(async ({ request }) => {
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.search)
  if (!rateLimitResult.success) {
    return NextResponse.json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim()

  const parsed = querySchema.safeParse(q)
  if (!parsed.success) {
    return NextResponse.json({ attorneys: [], locations: [], specialties: [] })
  }

  const query = parsed.data
  // Sanitize: only allow alphanumeric, spaces, hyphens, apostrophes
  const safeQ = query.replace(/[^a-zA-Z0-9\s'-]/g, '')
  if (!safeQ || safeQ.length < 2) {
    return NextResponse.json({ attorneys: [], locations: [], specialties: [] })
  }

  // adminClient justified: public endpoint, no user session — RLS would block anonymous reads
  const supabase = createAdminClient()

  try {
    // Run all 3 queries in parallel for speed
    const [attorneyResult, locationResult, specialtyResult] = await Promise.allSettled([
      // 1. Attorneys by name prefix (ILIKE)
      supabase
        .from('attorneys')
        .select('name, slug, stable_id, address_city, address_state, specialty:specialties!primary_specialty_id(name)')
        .ilike('name', `${safeQ}%`)
        .eq('is_active', true)
        .is('canonical_attorney_id', null)
        .order('is_verified', { ascending: false })
        .order('review_count', { ascending: false, nullsFirst: false })
        .limit(5),

      // 2. Locations by city name prefix
      supabase
        .from('locations_us')
        .select('name, slug, population, state:states!state_id(name, abbreviation)')
        .ilike('name', `${safeQ}%`)
        .order('population', { ascending: false })
        .limit(5),

      // 3. Specialties by name prefix
      supabase
        .from('specialties')
        .select('name, slug, category')
        .ilike('name', `${safeQ}%`)
        .eq('is_active', true)
        .order('name')
        .limit(5),
    ])

    const result: AutocompleteResult = {
      attorneys: [],
      locations: [],
      specialties: [],
    }

    // Process attorney results
    if (attorneyResult.status === 'fulfilled' && attorneyResult.value.data) {
      result.attorneys = attorneyResult.value.data.map((a: Record<string, unknown>) => {
        const spec = a.specialty as { name: string } | { name: string }[] | null
        const specName = Array.isArray(spec) ? spec[0]?.name : spec?.name
        return {
          type: 'attorney' as const,
          name: a.name as string,
          slug: a.slug as string,
          stable_id: a.stable_id as string | null,
          city: a.address_city as string | null,
          state: a.address_state as string | null,
          specialty: specName || null,
        }
      })
    }

    // Process location results
    if (locationResult.status === 'fulfilled' && locationResult.value.data) {
      result.locations = locationResult.value.data.map((l: Record<string, unknown>) => {
        const state = l.state as { name: string; abbreviation: string } | { name: string; abbreviation: string }[] | null
        const stateObj = Array.isArray(state) ? state[0] : state
        return {
          type: 'location' as const,
          name: l.name as string,
          slug: l.slug as string,
          state_name: stateObj?.name || null,
          state_abbr: stateObj?.abbreviation || null,
          population: l.population as number | null,
        }
      })
    }

    // Process specialty results
    if (specialtyResult.status === 'fulfilled' && specialtyResult.value.data) {
      result.specialties = specialtyResult.value.data.map((s: Record<string, unknown>) => ({
        type: 'specialty' as const,
        name: s.name as string,
        slug: s.slug as string,
        category: s.category as string | null,
      }))
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    logger.error('[api/search/autocomplete] Autocomplete failed', {
      error: error instanceof Error ? error.message : error,
      query: safeQ,
    })

    return NextResponse.json(
      { attorneys: [], locations: [], specialties: [] },
      { status: 200 }, // Graceful degradation: return empty results, not 500
    )
  }
}, {})
