/**
 * User Preferences API - US Attorneys
 * Manages user notification and display preferences
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// PUT request schema — matches { notifications: {...}, privacy: {...}, display: {...} }
const preferencesSchema = z.object({
  notifications: z.object({
    email_booking_confirmation: z.boolean().optional(),
    email_booking_reminder: z.boolean().optional(),
    email_marketing: z.boolean().optional(),
    email_newsletter: z.boolean().optional(),
    sms_booking_reminder: z.boolean().optional(),
    sms_marketing: z.boolean().optional(),
    push_enabled: z.boolean().optional(),
    push_booking_updates: z.boolean().optional(),
    push_messages: z.boolean().optional(),
    push_promotions: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    profile_public: z.boolean().optional(),
    show_online_status: z.boolean().optional(),
    allow_reviews: z.boolean().optional(),
  }).optional(),
  display: z.object({
    language: z.string().optional(),
    currency: z.string().optional(),
    theme: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
})

// GET /api/user/preferences - Get user preferences
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { data: prefs } = await getSupabaseAdmin()
      .from('user_preferences')
      .select('user_id, email_booking_confirmation, email_booking_reminder, email_marketing, email_newsletter, sms_booking_reminder, sms_marketing, push_enabled, push_booking_updates, push_messages, push_promotions, profile_public, show_online_status, allow_reviews, language, currency, theme, timezone, updated_at')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      userId: user.id,
      preferences: prefs || null,
    })
  } catch (error: unknown) {
    logger.error('Get preferences error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error retrieving preferences' } },
      { status: 500 }
    )
  }
}

// PUT /api/user/preferences - Update user preferences
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = preferencesSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid request', details: result.error.flatten() } }, { status: 400 })
    }
    const { notifications, privacy, display } = result.data

    // Map nested structure to flat columns in user_preferences
    const flatColumns = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      ...(notifications ?? {}),
      ...(privacy ?? {}),
      ...(display ?? {}),
    }

    // Upsert preferences using flat columns (no ghost 'preferences' jsonb column)
    const { error } = await getSupabaseAdmin()
      .from('user_preferences')
      .upsert(flatColumns, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Update preferences error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error updating preferences' } },
      { status: 500 }
    )
  }
}
