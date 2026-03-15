/**
 * GDPR Cookie Consent API - US Attorneys
 * Records user cookie consent for compliance
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const consentPostSchema = z.object({
  preferences: z.object({
    necessary: z.boolean(),
    functional: z.boolean().optional(),
    analytics: z.boolean(),
    marketing: z.boolean(),
    personalization: z.boolean(),
  }),
  timestamp: z.string().datetime().optional(),
  userAgent: z.string().max(500).optional(),
})

// Lazy initialize to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/gdpr/consent - Record cookie consent
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = consentPostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid request', details: result.error.flatten() } }, { status: 400 })
    }
    const { preferences, timestamp, userAgent } = result.data

    // Get user if authenticated
    let userId: string | null = null
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
      userId = user?.id || null
    } catch {
      // User not authenticated, that's fine
    }

    // Get IP address (for compliance records)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

    // Record consent
    const { error } = await getSupabaseAdmin().from('cookie_consents').insert({
      user_id: userId,
      session_id: crypto.randomUUID(),
      ip_address: ip,
      user_agent: userAgent,
      necessary: preferences.necessary,
      functional: preferences.functional ?? false,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      personalization: preferences.personalization,
      consent_given_at: timestamp,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('GDPR consent error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error recording consent' } },
      { status: 500 }
    )
  }
}

// GET /api/gdpr/consent - Get user's consent history
export async function GET(_request: Request) {
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

    const { data: consents } = await getSupabaseAdmin()
      .from('cookie_consents')
      .select('id, user_id, session_id, ip_address, user_agent, necessary, analytics, marketing, personalization, consent_given_at, updated_at')
      .eq('user_id', user.id)
      .order('consent_given_at', { ascending: false })

    return NextResponse.json({ consents: consents || [] })
  } catch (error) {
    logger.error('GDPR consent fetch error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error retrieving consent history' } },
      { status: 500 }
    )
  }
}
