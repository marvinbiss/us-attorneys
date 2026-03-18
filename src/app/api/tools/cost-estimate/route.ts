/**
 * GET /api/tools/cost-estimate — Legal cost estimator API
 *
 * Query params:
 *  - practiceArea (required): slug e.g. "personal-injury"
 *  - state (required): 2-letter code e.g. "CA"
 *  - complexity (optional): "simple" | "moderate" | "complex" (default: "moderate")
 *
 * Cache: 24h CDN + stale-while-revalidate
 * Rate limit: 20/min per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api/errors'
import { validateQuery } from '@/lib/api/validation'
import { checkRateLimit } from '@/lib/rate-limiter'
import {
  estimateLegalCost,
  getFeeStructuresForPA,
  getStateAverageComparison,
  type Complexity,
} from '@/lib/cost-estimator'

const querySchema = z.object({
  practiceArea: z.string().min(1).max(100),
  state: z.string().length(2).transform((s) => s.toUpperCase()),
  complexity: z.enum(['simple', 'moderate', 'complex']).default('moderate'),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Rate limit: 20 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous'

  const rateLimitResult = await checkRateLimit(`cost-estimate:${ip}`, {
    maxRequests: 20,
    windowMs: 60_000,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  const { practiceArea, state, complexity } = validateQuery(request, querySchema)

  const estimate = estimateLegalCost(practiceArea, state, complexity as Complexity)
  const feeStructures = getFeeStructuresForPA(practiceArea, state)
  const stateComparison = getStateAverageComparison(practiceArea, state)

  return NextResponse.json(
    {
      data: {
        estimate,
        feeStructures,
        stateComparison,
      },
      meta: {
        disclaimer:
          'These are estimated ranges based on public legal industry data and should not be considered legal advice. Actual costs vary based on individual circumstances.',
        updatedAt: new Date().toISOString(),
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      },
    },
  )
})
