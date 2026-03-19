/**
 * Password Reset API - US Attorneys
 * Sends password reset email via Supabase
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const resetSchema = z.object({
  email: z.string().email('Invalid email'),
})

export async function POST(request: Request) {
  try {
    // Rate limiting — auth category (5/min, fail-close)
    const rl = await rateLimit(request, RATE_LIMITS.auth)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) },
        }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()

    // Validate input
    const validation = resetSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const { email } = validation.data
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    })

    if (error) {
      logger.error('Reset password error', error)
      // Don't reveal if email exists or not for security
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a reset link.',
    })
  } catch (error: unknown) {
    logger.error('Reset password API error', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
