import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// POST request schema
const oauthSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple']),
  next: z.string().optional(),
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = oauthSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid provider', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { provider, next } = result.data

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'
    const redirectTo = next
      ? `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`
      : `${siteUrl}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'facebook' | 'apple',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      logger.error('OAuth error', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    logger.error('OAuth error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
