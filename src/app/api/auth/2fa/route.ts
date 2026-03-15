/**
 * Two-Factor Authentication API
 * Setup, verify, and manage 2FA
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { twoFactorAuth } from '@/lib/auth/two-factor'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const verifySchema = z.object({
  action: z.literal('verify'),
  code: z.string().min(6).max(8),
})

const disableSchema = z.object({
  action: z.literal('disable'),
  code: z.string().min(6).max(8),
})

const regenerateSchema = z.object({
  action: z.literal('regenerate_backup'),
  code: z.string().min(6).max(8),
})

const verifyLoginSchema = z.object({
  action: z.literal('verify_login'),
  code: z.string().min(6).max(8),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const status = await twoFactorAuth.getStatus(user.id)

    return NextResponse.json({ status })
  } catch (error) {
    logger.error('2FA status error:', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'setup': {
        const setup = await twoFactorAuth.generateSetup(user.id, user.email || '')
        return NextResponse.json({
          success: true,
          qrCodeUrl: setup.qrCodeUrl,
          backupCodes: setup.backupCodes,
          message: 'Scan the QR code with your authenticator app',
        })
      }

      case 'verify': {
        const result = verifySchema.safeParse(body)
        if (!result.success) {
          return NextResponse.json({ success: false, error: { message: 'Invalid code' } }, { status: 400 })
        }

        const verified = await twoFactorAuth.verifyAndEnable(user.id, result.data.code)
        return NextResponse.json({
          success: verified,
          message: verified ? '2FA enabled successfully' : 'Invalid code',
        })
      }

      case 'disable': {
        const result = disableSchema.safeParse(body)
        if (!result.success) {
          return NextResponse.json({ success: false, error: { message: 'Invalid code' } }, { status: 400 })
        }

        const disabled = await twoFactorAuth.disable(user.id, result.data.code)
        return NextResponse.json({
          success: disabled,
          message: disabled ? '2FA disabled' : 'Invalid code',
        })
      }

      case 'regenerate_backup': {
        const result = regenerateSchema.safeParse(body)
        if (!result.success) {
          return NextResponse.json({ success: false, error: { message: 'Invalid code' } }, { status: 400 })
        }

        const backupCodes = await twoFactorAuth.regenerateBackupCodes(user.id, result.data.code)
        return NextResponse.json({
          success: true,
          backupCodes,
          message: 'New backup codes generated',
        })
      }

      case 'verify_login': {
        const result = verifyLoginSchema.safeParse(body)
        if (!result.success) {
          return NextResponse.json({ success: false, error: { message: 'Invalid code' } }, { status: 400 })
        }

        const verified = await twoFactorAuth.verifyCode(user.id, result.data.code)
        if (!verified) {
          return NextResponse.json({ success: false, error: { message: 'Invalid code' } }, { status: 401 })
        }

        return NextResponse.json({
          success: true,
          message: 'Verification successful',
        })
      }

      default:
        return NextResponse.json({ success: false, error: { message: 'Action non reconnue' } }, { status: 400 })
    }
  } catch (error) {
    logger.error('2FA error:', error)
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ success: false, error: { message } }, { status: 500 })
  }
}
