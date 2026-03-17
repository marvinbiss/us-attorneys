/**
 * Analytics Event Ingestion API
 * POST /api/analytics
 * Receives events from client-side tracking (sendBeacon / fetch)
 * Stores in analytics_events table for admin dashboard reporting
 *
 * Supported events:
 * - attorney_profile_view, phone_reveal, phone_click (attorney interactions)
 * - page_view (page navigation tracking with visitor_id)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limiter'
import { z } from 'zod'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = [
  'attorney_profile_view',
  'phone_reveal',
  'phone_click',
  'page_view',
  'calendar_opened',
  'date_selected',
  'slot_selected',
  'form_started',
  'form_completed',
  'booking_initiated',
  'booking_completed',
  'booking_cancelled',
  'booking_rescheduled',
  'payment_started',
  'payment_completed',
  'payment_failed',
  'review_submitted',
  'waitlist_joined',
  'reminder_sent',
  'reminder_clicked',
  'consultation_submitted',
] as const

const analyticsSchema = z.object({
  event: z.enum(ALLOWED_EVENTS),
  properties: z.object({
    attorneyId: z.string().uuid().optional(),
    attorneyName: z.string().max(200).optional(),
    source: z.string().max(50).optional(),
    url: z.string().max(2000).optional(),
    referrer: z.string().max(2000).optional(),
    userAgent: z.string().max(500).optional(),
    screenSize: z.string().max(20).optional(),
    timestamp: z.string().optional(),
    page_path: z.string().max(500).optional(),
    title: z.string().max(500).optional(),
  }),
  sessionId: z.string().max(100).optional(),
  visitorId: z.string().max(100).optional(),
  timestamp: z.string().optional(),
})

export const POST = createApiHandler(async ({ request }) => {
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

  const { event, properties, sessionId, visitorId } = validation.data

  // For attorney-specific events, attorneyId is required
  const ATTORNEY_EVENTS = ['attorney_profile_view', 'phone_reveal', 'phone_click']
  if (ATTORNEY_EVENTS.includes(event) && !properties.attorneyId) {
    return new NextResponse(null, { status: 400 })
  }

  // Hash IP for dedup (GDPR: no raw IP stored)
  const ipHash = createHash('sha256')
    .update(ip + (process.env.ANALYTICS_SALT || 'sa-analytics-2026'))
    .digest('hex')
    .substring(0, 16)

  const supabase = createAdminClient()

  // Build insert data based on event type
  const insertData: Record<string, unknown> = {
    event_type: event,
    session_id: sessionId || null,
    visitor_id: visitorId || null,
    ip_hash: ipHash,
  }

  if (event === 'page_view') {
    insertData.page_path = properties.page_path || null
    insertData.source = properties.referrer || null
    insertData.metadata = {
      title: properties.title,
      url: properties.url,
      screenSize: properties.screenSize,
    }
  } else {
    insertData.attorney_id = properties.attorneyId
    insertData.source = properties.source || null
    insertData.metadata = {
      attorneyName: properties.attorneyName,
      url: properties.url,
      referrer: properties.referrer,
    }
  }

  const { error } = await supabase.from('analytics_events').insert(insertData)

  if (error) {
    logger.error('Analytics insert error', error)
  }

  return new NextResponse(null, { status: 204 })
}, {})
