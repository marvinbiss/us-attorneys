/**
 * Password Reset API - US Attorneys
 * Sends password reset email via Supabase
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const resetSchema = z.object({
  email: z.string().email('Invalid email'),
})

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing server configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()

    // Validate input
    const validation = resetSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
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
  } catch (error) {
    logger.error('Reset password API error', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
