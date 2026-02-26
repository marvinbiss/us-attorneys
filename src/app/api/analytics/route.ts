/**
 * Analytics Event Ingestion API
 * POST /api/analytics
 * Receives events from client-side tracking (sendBeacon / fetch)
 * Stores in analytics_events table for artisan dashboard reporting
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter'
import { z } from 'zod'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = ['artisan_profile_view', 'phone_reveal', 'phone_click'] as const

const analyticsSchema = z.object({
  event: z.enum(ALLOWED_EVENTS),
  properties: z.object({
    artisanId: z.string().uuid(),
    artisanName: z.string().max(200).optional(),
    source: z.string().max(50).optional(),
    url: z.string().max(2000).optional(),
    referrer: z.string().max(2000).optional(),
    userAgent: z.string().max(500).optional(),
    screenSize: z.string().max(20).optional(),
    timestamp: z.string().optional(),
  }).passthrough(),
  sessionId: z.string().max(100).optional(),
  timestamp: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIp(request.headers)
    const result = await checkRateLimit(
      `analytics:${ip}`,
      RATE_LIMITS.analytics
    )
    if (!result.allowed) {
      return new NextResponse(null, { status: 429 })
    }

    // sendBeacon sends as text/plain, not application/json
    let body: unknown
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else {
      const text = await request.text()
      body = JSON.parse(text)
    }

    const validation = analyticsSchema.safeParse(body)
    if (!validation.success) {
      return new NextResponse(null, { status: 400 })
    }

    const { event, properties, sessionId } = validation.data

    // Hash IP for dedup (RGPD: no raw IP stored)
    const ipHash = createHash('sha256')
      .update(ip + (process.env.ANALYTICS_SALT || 'sa-analytics-2026'))
      .digest('hex')
      .substring(0, 16)

    const supabase = createAdminClient()
    const { error } = await supabase.from('analytics_events').insert({
      event_type: event,
      provider_id: properties.artisanId,
      session_id: sessionId || null,
      source: properties.source || null,
      ip_hash: ipHash,
      metadata: {
        artisanName: properties.artisanName,
        url: properties.url,
        referrer: properties.referrer,
      },
    })

    if (error) {
      logger.error('Analytics insert error', error)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logger.error('Analytics API error', error)
    return new NextResponse(null, { status: 204 })
  }
}
