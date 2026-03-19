import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission, logAdminAction } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { isValidUuid } from '@/lib/sanitize'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

// POST request schema
const gdprDeleteSchema = z.object({
  confirmDelete: z.literal('SUPPRIMER'),
})

export const dynamic = 'force-dynamic'

// POST - Delete/Anonymize user data (GDPR) via atomic transaction
export const POST = createApiHandler(async ({ request, params }) => {
  // Verify admin with users:delete permission (GDPR deletion is critical)
  const authResult = await requirePermission('users', 'delete')
  if (!authResult.success || !authResult.admin) {
    return (
      authResult.error ??
      NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 403 })
    )
  }

  const userId = params?.userId
  if (!userId || !isValidUuid(userId)) {
    return NextResponse.json({ success: false, error: { message: 'Invalid ID' } }, { status: 400 })
  }

  const supabase = createAdminClient()
  const body = await request.json()
  const result = gdprDeleteSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Confirmation required (SUPPRIMER)', details: result.error.flatten() },
      },
      { status: 400 }
    )
  }

  try {
    // Call the atomic RPC function that wraps everything in a single transaction
    const { data: rpcResult, error: rpcError } = await supabase.rpc('gdpr_delete_user', {
      target_user_id: userId,
    })

    if (rpcError) {
      logger.error('GDPR atomic deletion RPC failed', { userId, error: rpcError })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'GDPR deletion failed — transaction rolled back, no data was modified',
            details: rpcError.message,
          },
        },
        { status: 500 }
      )
    }

    // The RPC returns a JSONB object with the audit trail
    if (!rpcResult?.success) {
      logger.error('GDPR deletion returned failure', { userId, result: rpcResult })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: rpcResult?.error || 'GDPR deletion failed',
          },
        },
        { status: 404 }
      )
    }

    // Log the deletion for compliance audit trail
    await logAdminAction(authResult.admin.id, 'gdpr.delete', 'user', userId, {
      anonymized: true,
      atomic_transaction: true,
      audit_trail: rpcResult,
    })

    logger.info('GDPR atomic deletion completed', {
      userId,
      adminId: authResult.admin.id,
      audit_trail: rpcResult,
    })

    return NextResponse.json({
      success: true,
      message: 'User data anonymized in compliance with GDPR (atomic transaction)',
      audit_trail: {
        user_id: rpcResult.user_id,
        profile_anonymized: rpcResult.profile_anonymized,
        reviews_anonymized: rpcResult.reviews_anonymized,
        bookings_anonymized: rpcResult.bookings_anonymized,
        leads_anonymized: rpcResult.leads_anonymized,
        claims_deleted: rpcResult.claims_deleted,
        messages_anonymized: rpcResult.messages_anonymized,
        notifications_deleted: rpcResult.notifications_deleted,
        attorney_deactivated: rpcResult.attorney_deactivated,
        completed_at: rpcResult.completed_at,
      },
    })
  } catch (error: unknown) {
    logger.error('GDPR deletion unexpected error', { userId, error })
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Unexpected error during GDPR deletion' },
      },
      { status: 500 }
    )
  }
})
