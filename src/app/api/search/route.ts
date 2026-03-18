/**
 * Unified Search API
 * GET /api/search?q=...&specialty=...&state=...&city=...&rating_min=...&lat=...&lng=...&radius=...&sort=...&page=...&limit=...
 *
 * Combines full-text search (tsvector), geo-radius (PostGIS), and filters.
 * Results are cached for 1h via getCachedData.
 *
 * Uses centralized error handling via withErrorHandler + validateQuery.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { searchAttorneys, type SearchFilters } from '@/lib/supabase'
import { withErrorHandler, ValidationError, ApiError } from '@/lib/api/errors'
import { validateQuery } from '@/lib/api/validation'

const searchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  specialty: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  city: z.string().max(100).optional(),
  rating_min: z.coerce.number().min(0).max(5).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(500).optional(),
  sort: z.enum(['relevance', 'distance', 'rating']).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const params = validateQuery(request, searchParamsSchema)

  // Require at least one search criterion
  if (!params.q && !params.specialty && !params.state && !params.city && !params.lat) {
    throw new ValidationError(
      'At least one search parameter is required (q, specialty, state, city, or lat/lng)',
    )
  }

  // Geo search requires both lat and lng
  if ((params.lat && !params.lng) || (!params.lat && params.lng)) {
    throw new ValidationError('Both lat and lng are required for geo search')
  }

  const filters: SearchFilters = {
    q: params.q,
    specialty: params.specialty,
    state: params.state,
    city: params.city,
    rating_min: params.rating_min,
    lat: params.lat,
    lng: params.lng,
    radius_miles: params.radius,
    sort: params.sort || 'relevance',
    page: params.page || 1,
    limit: params.limit || 20,
  }

  try {
    const result = await searchAttorneys(filters)

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    logger.error('[api/search] Search failed', {
      error: error instanceof Error ? error.message : error,
      filters,
    })

    throw new ApiError(503, 'EXTERNAL_SERVICE_ERROR', 'Search temporarily unavailable')
  }
})
