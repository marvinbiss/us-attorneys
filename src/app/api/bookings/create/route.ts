/**
 * POST /api/bookings/create
 * Main booking creation endpoint for video consultations
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailTemplates } from '@/lib/services/email-service'
import { apiError } from '@/lib/api/handler'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { handleIdempotency, cacheIdempotencyResult } from '@/lib/idempotency'

const createBookingBodySchema = z.object({
  attorney_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(120).default(30),
  specialty_id: z.string().uuid().optional(),
  client_name: z.string().min(2).max(100),
  client_email: z.string().email(),
  client_phone: z.string().optional(),
  notes: z.string().max(1000).optional(),
  payment_intent_id: z.string().optional(),
})

type CreateBookingBody = z.infer<typeof createBookingBodySchema>

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Idempotency check — prevent double bookings
    const idempotency = await handleIdempotency(request)
    if (idempotency && 'cached' in idempotency) return idempotency.cached
    const idempotencyKey = idempotency && 'key' in idempotency ? idempotency.key : null

    // Rate limiting — booking category (10/min)
    const rl = await rateLimit(request, RATE_LIMITS.booking)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT_ERROR', message: 'Too many requests. Please try again later.' } },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      )
    }

    // 1. Parse and validate body
    let body: CreateBookingBody
    try {
      const rawBody = await request.json()
      body = createBookingBodySchema.parse(rawBody)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
        return apiError('VALIDATION_ERROR', messages.join('; '), 400)
      }
      return apiError('VALIDATION_ERROR', 'Invalid request body', 400)
    }

    const {
      attorney_id,
      scheduled_at,
      duration_minutes,
      specialty_id,
      client_name,
      client_email,
      client_phone,
      notes,
      payment_intent_id,
    } = body

    // 2. Verify attorney exists (admin client needed: RLS may restrict cross-user reads on attorneys table)
    const adminSupabase = createAdminClient()
    const { data: attorney, error: attorneyError } = await adminSupabase
      .from('attorneys')
      .select('id, name')
      .eq('id', attorney_id)
      .single()

    if (attorneyError || !attorney) {
      return apiError('NOT_FOUND', 'Attorney not found', 404)
    }

    // 3. Check for overlapping bookings (not just exact time match)
    const requestedStart = new Date(scheduled_at)
    const requestedEnd = new Date(requestedStart.getTime() + (duration_minutes || 30) * 60 * 1000)

    const { data: conflicting } = await adminSupabase
      .from('bookings')
      .select('id, scheduled_at, duration_minutes')
      .eq('attorney_id', attorney_id)
      .neq('status', 'cancelled')
      .neq('status', 'no_show')
      .gte('scheduled_at', new Date(requestedStart.getTime() - 120 * 60 * 1000).toISOString()) // 2h window
      .lte('scheduled_at', requestedEnd.toISOString())

    // Check each existing booking for actual temporal overlap
    const hasConflict = conflicting?.some(existing => {
      const existingStart = new Date(existing.scheduled_at)
      const existingEnd = new Date(existingStart.getTime() + (existing.duration_minutes || 30) * 60 * 1000)
      return requestedStart < existingEnd && requestedEnd > existingStart
    })

    if (hasConflict) {
      return apiError('CONFLICT_ERROR', 'Time slot conflicts with an existing booking', 409)
    }

    // 4. Determine status based on payment
    const status = payment_intent_id ? 'confirmed' : 'pending'

    // 5. Create Daily.co room (non-blocking if DAILY_API_KEY not set)
    let dailyRoomUrl: string | null = null
    let dailyRoomName: string | null = null

    // Generate a temporary booking ID for room naming
    const tempId = crypto.randomUUID()

    try {
      const { createDailyRoom } = await import('@/lib/daily')
      const expiresAt = new Date(new Date(scheduled_at).getTime() + 2 * 60 * 60 * 1000)
      const room = await createDailyRoom(tempId, expiresAt)
      dailyRoomUrl = room.url
      dailyRoomName = room.name
    } catch (dailyError) {
      // Daily.co not configured or API error -- continue without room
      logger.warn('Daily.co room creation failed (non-blocking)', { error: dailyError instanceof Error ? dailyError.message : String(dailyError) })
    }

    // 6. Insert booking (admin client needed to bypass RLS for insert with client_id)
    const { data: booking, error: insertError } = await adminSupabase
      .from('bookings')
      .insert({
        id: tempId,
        attorney_id,
        client_id: user.id,
        scheduled_at,
        duration_minutes,
        specialty_id: specialty_id || null,
        status,
        daily_room_url: dailyRoomUrl,
        daily_room_name: dailyRoomName,
        stripe_payment_intent_id: payment_intent_id || null,
        client_name: client_name.trim(),
        client_email: client_email.toLowerCase().trim(),
        client_phone: client_phone || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError || !booking) {
      logger.error('Failed to insert booking', insertError)
      return apiError('DATABASE_ERROR', 'Failed to create booking', 500)
    }

    // 7. Send confirmation emails (non-blocking)
    const scheduledDate = new Date(scheduled_at)
    const dateStr = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const timeStr = scheduledDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    const attorneyName = attorney.name || 'Attorney'

    // Client confirmation email
    try {
      const clientTemplate = emailTemplates.bookingConfirmationClient(
        client_name,
        attorneyName,
        'Video Consultation',
        dateStr,
        timeStr,
        dailyRoomUrl || 'Link will be provided before your consultation'
      )
      sendEmail({ to: client_email, template: clientTemplate }).catch((err) => {
        logger.error('Failed to send client confirmation email', err as Error)
      })
    } catch (emailError) {
      logger.error('Error preparing client email', emailError as Error)
    }

    // Attorney notification email
    try {
      const { data: attorneyProfile } = await adminSupabase
        .from('attorneys')
        .select('email')
        .eq('id', attorney_id)
        .single()

      if (attorneyProfile?.email) {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lawtendr.com'}/attorney-dashboard/bookings`
        const attorneyTemplate = emailTemplates.bookingNotificationAttorney(
          attorneyName,
          client_name,
          client_email,
          'Video Consultation',
          dateStr,
          timeStr,
          notes || '',
          dashboardUrl
        )
        sendEmail({ to: attorneyProfile.email, template: attorneyTemplate }).catch((err) => {
          logger.error('Failed to send attorney notification email', err as Error)
        })
      }
    } catch (emailError) {
      logger.error('Error preparing attorney email', emailError as Error)
    }

    // 8. Return created booking
    const responseBody = {
      success: true as const,
      data: {
        booking: {
          id: booking.id,
          attorney_id: booking.attorney_id,
          scheduled_at: booking.scheduled_at,
          duration_minutes: booking.duration_minutes,
          status: booking.status,
          daily_room_url: booking.daily_room_url,
          client_name: booking.client_name,
          client_email: booking.client_email,
          created_at: booking.created_at,
        },
      },
    }

    // Cache result for idempotency (fire-and-forget)
    if (idempotencyKey) {
      cacheIdempotencyResult(idempotencyKey, 201, responseBody)
    }

    return NextResponse.json(responseBody, { status: 201 })
  } catch (error: unknown) {
    logger.error('Booking creation error', error as Error)
    return apiError('INTERNAL_ERROR', 'Internal server error', 500)
  }
}
