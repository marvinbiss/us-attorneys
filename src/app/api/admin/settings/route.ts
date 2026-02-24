import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// PATCH request schema
const updateSettingsSchema = z.object({
  siteName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  supportEmail: z.string().email().optional(),
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  maxQuotesPerDay: z.number().int().min(1).max(100).optional(),
  requireEmailVerification: z.boolean().optional(),
  requirePhoneVerification: z.boolean().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  minBookingNotice: z.number().int().min(0).max(168).optional(), // max 1 week in hours
  maxBookingAdvance: z.number().int().min(1).max(365).optional(), // max 1 year in days
})

export const dynamic = 'force-dynamic'

// Default settings
const DEFAULT_SETTINGS = {
  siteName: 'ServicesArtisans',
  contactEmail: 'contact@servicesartisans.fr',
  supportEmail: 'support@servicesartisans.fr',
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  smsNotifications: false,
  maxQuotesPerDay: 10,
  requireEmailVerification: true,
  requirePhoneVerification: false,
  commissionRate: 10,
  minBookingNotice: 24, // hours
  maxBookingAdvance: 90, // days
}

export async function GET() {
  try {
    // Verify admin with settings:read permission
    const authResult = await requirePermission('settings', 'read')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()

    // Fetch settings from database
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('id, data, updated_at, updated_by')
      .single()

    if (error || !settings) {
      // Return default settings if none exist
      return NextResponse.json({ settings: DEFAULT_SETTINGS })
    }

    return NextResponse.json({ settings: settings.data || DEFAULT_SETTINGS })
  } catch (error) {
    logger.error('Settings fetch error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin with settings:write permission
    const authResult = await requirePermission('settings', 'write')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const result = updateSettingsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Erreur de validation', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const updates = result.data

    // Fetch current settings for audit
    let currentSettings: Record<string, unknown> | null = null
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('id, data, updated_at, updated_by')
        .single()
      currentSettings = data
    } catch {
      // Table may not exist yet
    }

    // Upsert settings
    try {
      const { data: settings, error } = await supabase
        .from('platform_settings')
        .upsert({
          id: (currentSettings?.id as number) || 1,
          data: {
            ...((currentSettings?.data as Record<string, unknown>) || DEFAULT_SETTINGS),
            ...updates,
          },
          updated_at: new Date().toISOString(),
          updated_by: authResult.admin.id,
        })
        .select()
        .single()

      if (error) {
        logger.error('Settings update error', error)
        return NextResponse.json({ success: false, error: { message: 'Erreur lors de la mise à jour des paramètres. La table platform_settings n\'existe peut-être pas encore.' } }, { status: 500 })
      }

      // Log audit
      await logAdminAction(authResult.admin.id, 'settings_updated', 'settings', '1', updates)

      return NextResponse.json({ settings: settings?.data })
    } catch {
      // platform_settings table may not exist yet
      logger.error('Settings table not found — platform_settings may not be created yet')
      return NextResponse.json({
        success: false, error: { message: 'La table platform_settings n\'existe pas encore. Veuillez exécuter la migration correspondante.' },
      }, { status: 500 })
    }
  } catch (error) {
    logger.error('Settings update error', error)
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
