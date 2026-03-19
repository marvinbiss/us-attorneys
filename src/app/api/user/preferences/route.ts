/**
 * User Preferences API
 * GET:    Fetch user notification/display/privacy preferences
 * PUT:    Update preferences
 * DELETE: Reset preferences to defaults
 *
 * Preferences are stored in auth.users.raw_user_meta_data via
 * supabase.auth.updateUser(). No dedicated table or migration needed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const DEFAULT_PREFERENCES: Record<string, unknown> = {
  // Notification preferences
  email_booking_confirmation: true,
  email_booking_reminder: true,
  email_marketing: false,
  email_newsletter: false,
  push_enabled: false,
  push_booking_updates: true,
  push_messages: true,
  push_promotions: false,
  sms_booking_reminder: false,
  sms_marketing: false,
  // Privacy preferences
  profile_public: true,
  show_online_status: true,
  allow_reviews: true,
  // Display preferences
  language: 'en',
  theme: 'light',
  timezone: 'America/New_York',
  currency: 'USD',
}

const preferencesSchema = z.object({
  notifications: z
    .object({
      email_booking_confirmation: z.boolean(),
      email_booking_reminder: z.boolean(),
      email_marketing: z.boolean(),
      email_newsletter: z.boolean(),
      push_enabled: z.boolean(),
      push_booking_updates: z.boolean(),
      push_messages: z.boolean(),
      push_promotions: z.boolean(),
      sms_booking_reminder: z.boolean(),
      sms_marketing: z.boolean(),
    })
    .partial()
    .optional(),
  privacy: z
    .object({
      profile_public: z.boolean(),
      show_online_status: z.boolean(),
      allow_reviews: z.boolean(),
    })
    .partial()
    .optional(),
  display: z
    .object({
      language: z.string().max(10),
      theme: z.enum(['light', 'dark', 'system']),
      timezone: z.string().max(50),
      currency: z.string().max(5),
    })
    .partial()
    .optional(),
})

/**
 * GET /api/user/preferences — Fetch current user preferences
 */
export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, RATE_LIMITS.api)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
      { status: 429 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHENTICATION_ERROR', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Read preferences from user metadata (no DB table needed)
    const storedPrefs = (user.user_metadata?.preferences as Record<string, unknown>) || {}
    const preferences = { ...DEFAULT_PREFERENCES, ...storedPrefs }

    return NextResponse.json({
      success: true,
      userId: user.id,
      preferences,
    })
  } catch (error: unknown) {
    logger.error('GET /api/user/preferences failed', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch preferences' } },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/preferences — Update user preferences
 */
export async function PUT(request: NextRequest) {
  const rl = await rateLimit(request, RATE_LIMITS.apiWrite)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
      { status: 429 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHENTICATION_ERROR', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const rawBody = await request.json()
    const parseResult = preferencesSchema.safeParse(rawBody)

    if (!parseResult.success) {
      const messages = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: messages.join(', ') } },
        { status: 400 }
      )
    }

    const { notifications, privacy, display } = parseResult.data

    // Merge with existing preferences
    const existingPrefs = (user.user_metadata?.preferences as Record<string, unknown>) || {}
    const mergedPrefs: Record<string, unknown> = {
      ...DEFAULT_PREFERENCES,
      ...existingPrefs,
      ...(notifications ?? {}),
      ...(privacy ?? {}),
      ...(display ?? {}),
    }

    // Store in user metadata via auth API
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        preferences: mergedPrefs,
      },
    })

    if (updateError) {
      logger.error('Failed to update user preferences', updateError)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to update preferences' },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { preferences: mergedPrefs },
    })
  } catch (error: unknown) {
    logger.error('PUT /api/user/preferences failed', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update preferences' },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/preferences — Reset preferences to defaults
 */
export async function DELETE(request: NextRequest) {
  const rl = await rateLimit(request, RATE_LIMITS.apiWrite)
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
      { status: 429 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTHENTICATION_ERROR', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Reset by writing defaults back into user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        preferences: DEFAULT_PREFERENCES,
      },
    })

    if (updateError) {
      logger.error('Failed to reset user preferences', updateError)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to reset preferences' },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { preferences: DEFAULT_PREFERENCES },
    })
  } catch (error: unknown) {
    logger.error('DELETE /api/user/preferences failed', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to reset preferences' } },
      { status: 500 }
    )
  }
}
