/**
 * Consultation Request API - US Attorneys
 * POST: Create a consultation request (unauthenticated)
 * Rate limited: 5 per hour per IP
 * Stores in bookings table with status 'pending'
 * Sends email notification to attorney via Resend
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@/lib/errors/types'
import { formatZodErrors } from '@/lib/validations/schemas'
import { sendBookingNotifications, type NotificationPayload } from '@/lib/notifications/unified-notification-service'
import { distributeLead } from '@/lib/matching'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// --- Validation schema ---

const consultationRequestSchema = z.object({
  attorneyId: z.string().uuid('Invalid attorney ID').nullable().optional(),
  consultationType: z.enum(['video', 'phone', 'in_person'], {
    error: 'Consultation type must be video, phone, or in_person',
  }),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable()
    .optional(),
  preferredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)')
    .nullable()
    .optional(),
  clientName: z
    .string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-'.]+$/, 'Invalid name'),
  clientEmail: z.string().email('Invalid email address').max(255),
  clientPhone: z.string().min(7, 'Phone too short').max(20, 'Phone too long'),
  legalIssue: z.string().max(500, 'Description too long').nullable().optional(),
  // Lead matching fields (optional — used when no specific attorney is targeted)
  practiceAreaSlug: z.string().max(100).nullable().optional(),
  clientState: z.string().length(2).nullable().optional(),
  clientCity: z.string().max(100).nullable().optional(),
  clientZip: z.string().regex(/^\d{5}$/, 'Invalid ZIP code').nullable().optional(),
})

// Custom rate limit: 5 requests per hour per IP
const CONSULTATION_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 3_600_000, // 1 hour
  failOpen: false,
} satisfies typeof RATE_LIMITS.contact

export async function POST(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const rl = await rateLimit(request, CONSULTATION_RATE_LIMIT)
    if (!rl.success) {
      return NextResponse.json(
        createErrorResponse(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          'Too many consultation requests. Please try again later.',
          { remaining: rl.remaining, resetAt: new Date(rl.reset).toISOString() }
        ),
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      )
    }

    // --- Parse and validate body ---
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid JSON body'),
        { status: 400 }
      )
    }

    const validation = consultationRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid request data', {
          fields: formatZodErrors(validation.error),
        }),
        { status: 400 }
      )
    }

    const {
      attorneyId,
      consultationType,
      preferredDate,
      preferredTime,
      clientName,
      clientEmail,
      clientPhone,
      legalIssue,
      practiceAreaSlug,
      clientState,
      clientCity,
      clientZip,
    } = validation.data

    // Use RLS-respecting client for reads (attorneys are publicly readable)
    const supabase = await createClient()
    // AdminClient only for inserts (unauthenticated user cannot insert via RLS)
    const adminSupabase = createAdminClient()

    // --- Verify attorney exists (if specified) ---
    let attorney: { id: string; name: string; slug: string; user_id: string | null } | null = null
    if (attorneyId) {
      const { data: attyData, error: attorneyError } = await supabase
        .from('attorneys')
        .select('id, name, slug, user_id')
        .eq('id', attorneyId)
        .single()

      if (attorneyError || !attyData) {
        return NextResponse.json(
          createErrorResponse(ErrorCode.NOT_FOUND, 'Attorney not found'),
          { status: 404 }
        )
      }
      attorney = attyData
    }

    // --- Build scheduled_at timestamp ---
    let scheduledAt: string | null = null
    if (preferredDate) {
      const timeStr = preferredTime || '09:00'
      scheduledAt = `${preferredDate}T${timeStr}:00`
    }

    // --- Insert into bookings table with status 'pending' ---
    const consultationTypeLabel =
      consultationType === 'video'
        ? 'Video Call'
        : consultationType === 'phone'
          ? 'Phone Call'
          : 'In-Person Meeting'

    const notes = [
      `Consultation type: ${consultationTypeLabel}`,
      legalIssue ? `Legal issue: ${legalIssue}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const { data: booking, error: insertError } = await adminSupabase
      .from('bookings')
      .insert({
        attorney_id: attorneyId || null,
        client_name: clientName.trim(),
        client_email: clientEmail.toLowerCase().trim(),
        client_phone: clientPhone.trim(),
        scheduled_at: scheduledAt || new Date().toISOString(),
        duration_minutes: 30,
        status: 'pending',
        notes,
        booking_fee: 0,
        // Lead matching fields
        practice_area_slug: practiceAreaSlug || null,
        client_state: clientState || null,
        client_city: clientCity || null,
        client_zip: clientZip || null,
        matching_status: attorneyId ? 'assigned' : 'unmatched',
      })
      .select('id')
      .single()

    if (insertError) {
      logger.error('Consultation request insert error', insertError)
      return NextResponse.json(
        createErrorResponse(ErrorCode.DATABASE_ERROR, 'Failed to create consultation request'),
        { status: 500 }
      )
    }

    // --- Trigger lead matching (non-blocking) ---
    // If no specific attorney was targeted, run the matching algorithm
    if (!attorneyId) {
      distributeLead(booking.id).catch((err) => {
        logger.error('Lead distribution failed (non-blocking)', err)
      })
    }

    // --- Format date for notification ---
    const formattedDate = preferredDate
      ? new Date(preferredDate).toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'To be confirmed'

    // --- Fetch attorney email for notification (if attorney specified) ---
    let attorneyEmail: string | undefined
    if (attorney?.user_id) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('email')
        .eq('id', attorney.user_id)
        .single()
      attorneyEmail = profile?.email || undefined
    }

    // --- Send notification (non-blocking, only when attorney is known) ---
    if (attorney) {
      const notificationPayload: NotificationPayload = {
        bookingId: booking.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.toLowerCase().trim(),
        clientPhone: clientPhone.trim(),
        attorneyName: attorney.name,
        attorneyEmail,
        specialtyName: consultationTypeLabel,
        date: formattedDate,
        startTime: preferredTime || 'TBD',
        message: legalIssue || undefined,
      }

      sendBookingNotifications(notificationPayload).catch((err) => {
        logger.error('Failed to send consultation notification', err)
      })
    }

    // --- Return success ---
    return NextResponse.json(
      createSuccessResponse({
        consultationId: booking.id,
        status: 'pending',
        attorneyName: attorney?.name || null,
        consultationType: consultationTypeLabel,
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        matchingTriggered: !attorneyId,
        message: attorneyId
          ? 'Consultation request submitted successfully. The attorney will contact you shortly.'
          : 'Consultation request submitted. We are matching you with the best attorney for your needs.',
      }),
      { status: 201 }
    )
  } catch (error) {
    logger.error('Consultation request unexpected error', error)
    return NextResponse.json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred'),
      { status: 500 }
    )
  }
}
