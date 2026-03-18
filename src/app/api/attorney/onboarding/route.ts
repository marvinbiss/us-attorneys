/**
 * Attorney Onboarding API
 * GET: Returns onboarding progress (which steps completed, current step, completion %)
 * PATCH: Save step data (partial updates per step)
 */

import { NextRequest } from 'next/server'
import { requireAttorney } from '@/lib/auth/attorney-guard'
import { apiSuccess, apiError } from '@/lib/api/handler'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ─── Schemas ────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  step: z.number().int().min(1).max(6),
  data: z.record(z.string(), z.unknown()).optional(),
  completed: z.boolean().optional(),
})

// ─── Step definitions ───────────────────────────────────────────────────────

const STEP_KEYS = ['welcome', 'bar_verification', 'profile_basics', 'practice_areas', 'availability', 'choose_plan'] as const

// ─── GET: Onboarding progress ───────────────────────────────────────────────

export async function GET() {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    const { data: attorney, error: fetchError } = await supabase
      .from('attorneys')
      .select('id, name, bar_number, bar_state, phone, address_city, address_state, address_zip, description, firm_name, is_verified, primary_specialty_id, onboarding_step, onboarding_completed_at, onboarding_data, profile_completion_pct')
      .eq('user_id', user!.id)
      .single()

    if (fetchError || !attorney) {
      logger.error('Onboarding GET - attorney not found', fetchError)
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    // Compute which steps are complete based on actual data
    const stepsCompleted: Record<string, boolean> = {
      welcome: (attorney.onboarding_step ?? 0) >= 1,
      bar_verification: !!attorney.bar_number && !!attorney.bar_state,
      profile_basics: !!attorney.name && !!attorney.phone && !!attorney.address_city,
      practice_areas: !!attorney.primary_specialty_id,
      availability: !!(attorney.onboarding_data as Record<string, unknown>)?.availability,
      choose_plan: !!(attorney.onboarding_data as Record<string, unknown>)?.plan_selected,
    }

    const completedCount = Object.values(stepsCompleted).filter(Boolean).length

    return apiSuccess({
      currentStep: attorney.onboarding_step ?? 0,
      completedAt: attorney.onboarding_completed_at,
      profileCompletionPct: attorney.profile_completion_pct ?? 0,
      stepsCompleted,
      completedCount,
      totalSteps: 6,
      onboardingData: attorney.onboarding_data ?? {},
      attorney: {
        id: attorney.id,
        name: attorney.name,
        barNumber: attorney.bar_number,
        barState: attorney.bar_state,
        phone: attorney.phone,
        addressCity: attorney.address_city,
        addressState: attorney.address_state,
        addressZip: attorney.address_zip,
        description: attorney.description,
        firmName: attorney.firm_name,
        isVerified: attorney.is_verified,
        primarySpecialtyId: attorney.primary_specialty_id,
      },
    })
  } catch (err) {
    logger.error('Onboarding GET error', err as Error)
    return apiError('INTERNAL_ERROR', 'Failed to fetch onboarding progress', 500)
  }
}

// ─── PATCH: Save step data ──────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const { error: guardError, user, supabase } = await requireAttorney()
    if (guardError) return guardError

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', parsed.error.issues.map(i => i.message).join(', '), 400)
    }

    const { step, data, completed } = parsed.data

    // Fetch current attorney
    const { data: attorney, error: fetchError } = await supabase
      .from('attorneys')
      .select('id, onboarding_step, onboarding_data')
      .eq('user_id', user!.id)
      .single()

    if (fetchError || !attorney) {
      return apiError('NOT_FOUND', 'Attorney profile not found', 404)
    }

    // Use admin client for the update (bypasses RLS)
    const adminDb = createAdminClient()

    // Build update payload
    const currentData = (attorney.onboarding_data as Record<string, unknown>) ?? {}
    const stepKey = STEP_KEYS[step - 1]

    const updatePayload: Record<string, unknown> = {
      onboarding_step: Math.max(step, attorney.onboarding_step ?? 0),
      onboarding_data: {
        ...currentData,
        [stepKey]: data ?? true,
        [`${stepKey}_completed_at`]: new Date().toISOString(),
      },
    }

    // Step-specific field updates
    if (step === 2 && data) {
      // Bar verification
      const barData = data as { barNumber?: string; barState?: string }
      if (barData.barNumber) updatePayload.bar_number = barData.barNumber
      if (barData.barState) updatePayload.bar_state = barData.barState
    }

    if (step === 3 && data) {
      // Profile basics
      const profileData = data as {
        name?: string
        phone?: string
        bio?: string
        addressCity?: string
        addressState?: string
        addressZip?: string
        firmName?: string
        officeHours?: string
      }
      if (profileData.name) updatePayload.name = profileData.name
      if (profileData.phone) updatePayload.phone = profileData.phone
      if (profileData.bio) updatePayload.description = profileData.bio
      if (profileData.addressCity) updatePayload.address_city = profileData.addressCity
      if (profileData.addressState) updatePayload.address_state = profileData.addressState
      if (profileData.addressZip) updatePayload.address_zip = profileData.addressZip
      if (profileData.firmName) updatePayload.firm_name = profileData.firmName
    }

    if (step === 4 && data) {
      // Practice areas
      const paData = data as { primarySpecialtyId?: string }
      if (paData.primarySpecialtyId) updatePayload.primary_specialty_id = paData.primarySpecialtyId
    }

    // Mark complete if this is the last step
    if (completed || step === 6) {
      updatePayload.onboarding_completed_at = new Date().toISOString()
    }

    const { error: updateError } = await adminDb
      .from('attorneys')
      .update(updatePayload)
      .eq('id', attorney.id)

    if (updateError) {
      logger.error('Onboarding PATCH - update failed', updateError)
      return apiError('DATABASE_ERROR', 'Failed to save onboarding progress', 500)
    }

    return apiSuccess({
      step,
      saved: true,
      completed: completed || step === 6,
    })
  } catch (err) {
    logger.error('Onboarding PATCH error', err as Error)
    return apiError('INTERNAL_ERROR', 'Failed to save onboarding data', 500)
  }
}
