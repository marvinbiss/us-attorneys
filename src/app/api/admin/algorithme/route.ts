/**
 * Admin Algorithm Config API
 * GET: Read current algorithm config
 * PATCH: Update algorithm config
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { DEFAULT_ALGORITHM_CONFIG } from '@/types/algorithm'

const algorithmConfigSchema = z.object({
  matching_strategy: z.enum(['scored', 'round_robin', 'geographic']).optional(),
  max_artisans_per_lead: z.number().int().min(1).max(20).optional(),
  geo_radius_km: z.number().int().min(1).max(500).optional(),
  weight_rating: z.number().int().min(0).max(100).optional(),
  weight_reviews: z.number().int().min(0).max(100).optional(),
  weight_verified: z.number().int().min(0).max(100).optional(),
  weight_proximity: z.number().int().min(0).max(100).optional(),
  weight_data_quality: z.number().int().min(0).max(100).optional(),
  cooldown_minutes: z.number().int().min(0).max(1440).optional(),
  daily_lead_quota: z.number().int().min(0).max(1000).optional(),
  monthly_lead_quota: z.number().int().min(0).max(30000).optional(),
  exclude_inactive_days: z.number().int().min(0).max(365).optional(),
  min_rating: z.number().min(0).max(5).optional(),
  require_verified_urgent: z.boolean().optional(),
  specialty_match_mode: z.enum(['exact', 'fuzzy', 'category']).optional(),
  urgency_low_multiplier: z.number().positive().max(10).optional(),
  urgency_medium_multiplier: z.number().positive().max(10).optional(),
  urgency_high_multiplier: z.number().positive().max(10).optional(),
  urgency_emergency_multiplier: z.number().positive().max(10).optional(),
  prefer_claimed: z.boolean().optional(),
  lead_expiry_hours: z.number().int().min(1).max(168).optional(),
  auto_reassign_hours: z.number().int().min(1).max(168).optional(),
}).strict()

export const dynamic = 'force-dynamic'

export async function GET() {
  // Verify admin with settings:read permission
  const auth = await requirePermission('settings', 'read')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const supabase = createAdminClient()

    // Try d'abord le schema app
    const { data, error } = await supabase
      .from('algorithm_config')
      .select('id, matching_strategy, max_artisans_per_lead, geo_radius_km, require_same_department, require_specialty_match, specialty_match_mode, weight_rating, weight_reviews, weight_verified, weight_proximity, weight_data_quality, daily_lead_quota, monthly_lead_quota, cooldown_minutes, lead_expiry_hours, quote_expiry_hours, auto_reassign_hours, min_rating, require_verified_urgent, exclude_inactive_days, prefer_claimed, urgency_low_multiplier, urgency_medium_multiplier, urgency_high_multiplier, urgency_emergency_multiplier, updated_at, updated_by')
      .limit(1)
      .single()

    if (error || !data) {
      // Return les defaults si la table n'existe pas encore
      return NextResponse.json({
        config: {
          id: 'default',
          ...DEFAULT_ALGORITHM_CONFIG,
          updated_at: new Date().toISOString(),
          updated_by: null,
        },
        source: 'defaults',
      })
    }

    return NextResponse.json({ config: data, source: 'database' })
  } catch {
    return NextResponse.json({
      config: {
        id: 'default',
        ...DEFAULT_ALGORITHM_CONFIG,
        updated_at: new Date().toISOString(),
        updated_by: null,
      },
      source: 'defaults',
    })
  }
}

export async function PATCH(request: NextRequest) {
  // Verify admin with settings:write permission
  const auth = await requirePermission('settings', 'write')
  if (!auth.success || !auth.admin) return auth.error!

  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // Delete les champs non-modifiables avant validation
    const { id, created_at, updated_at, singleton, ...fieldsToValidate } = body as Record<string, unknown>

    // Validate avec Zod
    const parsed = algorithmConfigSchema.safeParse(fieldsToValidate)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false, error: { message: 'Invalid data', details: parsed.error.flatten().fieldErrors },
        },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = { ...parsed.data }

    // Add le metadata
    updates.updated_by = auth.admin.id
    updates.updated_at = new Date().toISOString()

    // Retrieve l'ID de la config actuelle
    const { data: current } = await supabase
      .from('algorithm_config')
      .select('id')
      .limit(1)
      .single()

    if (!current) {
      // Insert if no config exists yet
      const { data, error } = await supabase
        .from('algorithm_config')
        .insert(updates)
        .select()
        .single()

      if (error) {
        logger.error('Algorithm config insert error', { message: error.message })
        return NextResponse.json({ success: false, error: { message: 'Error saving configuration' } }, { status: 500 })
      }

      await logAdminAction(
        auth.admin.id,
        'algorithm_config_create',
        'algorithm_config',
        data.id,
        updates
      )

      return NextResponse.json({ config: data, action: 'created' })
    }

    // Update the existing config
    const { data, error } = await supabase
      .from('algorithm_config')
      .update(updates)
      .eq('id', current.id)
      .select()
      .single()

    if (error) {
      logger.error('Algorithm config update error', { message: error.message })
      return NextResponse.json({ success: false, error: { message: 'Error updating configuration' } }, { status: 500 })
    }

    await logAdminAction(
      auth.admin.id,
      'algorithm_config_update',
      'algorithm_config',
      current.id,
      updates
    )

    return NextResponse.json({ config: data, action: 'updated' })
  } catch (error) {
    logger.error('Algorithm config PATCH error', error)
    return NextResponse.json({ success: false, error: { message: 'Server error' } }, { status: 500 })
  }
}
