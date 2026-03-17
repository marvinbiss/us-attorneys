import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'

// POST request schema
const gdprDeleteSchema = z.object({
  confirmDelete: z.literal('SUPPRIMER'),
})

export const dynamic = 'force-dynamic'

// POST - Delete/Anonymize user data (GDPR)
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify admin with users:delete permission (GDPR deletion is critical)
    const authResult = await requirePermission('users', 'delete')
    if (!authResult.success || !authResult.admin) {
      return authResult.error
    }

    if (!isValidUuid(params.userId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid ID' } },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const userId = params.userId
    const body = await request.json()
    const result = gdprDeleteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Confirmation required (DELETE)', details: result.error.flatten() } },
        { status: 400 }
      )
    }

    const completedSteps: string[] = []

    try {
      // Step 1 — Retrieve profile email to anonymize client reviews
      completedSteps.push('fetch_profile')
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle()

      // Step 2 — Check if user is an attorney
      completedSteps.push('check_attorney')
      const { data: attorneyRecord } = await supabase
        .from('attorneys')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      // Step 3 — Anonymize profile (only columns that exist on profiles)
      completedSteps.push('anonymize_profile')
      await supabase
        .from('profiles')
        .update({
          email: `deleted_${userId.slice(0, 8)}@anonymized.local`,
          full_name: 'Deleted user',
          phone_e164: null,
        })
        .eq('id', userId)

      // Step 4 — Anonymize client reviews (filtered by client_email)
      completedSteps.push('anonymize_client_reviews')
      if (profileData?.email) {
        await supabase
          .from('reviews')
          .update({
            client_name: 'Deleted user',
            client_email: 'deleted@anonymized.local',
          })
          .eq('client_email', profileData.email)
      }

      // Step 5 — Anonymize review responses only if user is an attorney
      completedSteps.push('anonymize_attorney_reviews')
      if (attorneyRecord) {
        await supabase
          .from('reviews')
          .update({
            artisan_response: null,
            artisan_responded_at: null,
          })
          .eq('attorney_id', userId)
      }

      // Step 6 — Deactivate provider if user is an attorney
      completedSteps.push('deactivate_provider')
      if (attorneyRecord) {
        await supabase
          .from('attorneys')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
      }

      // Step 7 — Audit log
      completedSteps.push('audit_log')
      await logAdminAction(authResult.admin.id, 'gdpr.delete', 'user', userId, { anonymized: true })
    } catch (stepError) {
      const failedStep = completedSteps[completedSteps.length - 1] ?? 'unknown'
      logger.error('GDPR delete failed at step', { completedSteps, userId, error: stepError })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Partial deletion — failed step: ${failedStep}`,
            completedSteps,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User data anonymized in compliance with GDPR',
    })
  } catch (error) {
    logger.error('Admin GDPR delete error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
