import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { logger } from '@/lib/logger'

export type AuditAction =
  | 'user.view'
  | 'user.update'
  | 'user.delete'
  | 'user.ban'
  | 'user.unban'
  | 'provider.view'
  | 'provider.update'
  | 'provider.delete'
  | 'provider.verify'
  | 'provider.suspend'
  | 'review.view'
  | 'review.update'
  | 'review.delete'
  | 'review.approve'
  | 'review.reject'
  | 'payment.view'
  | 'payment.refund'
  | 'subscription.view'
  | 'subscription.update'
  | 'subscription.cancel'
  | 'service.create'
  | 'service.update'
  | 'service.delete'
  | 'booking.view'
  | 'booking.update'
  | 'booking.cancel'
  | 'quote.view'
  | 'quote.update'
  | 'report.view'
  | 'report.resolve'
  | 'report.dismiss'
  | 'message.view'
  | 'message.delete'
  | 'settings.view'
  | 'settings.update'
  | 'gdpr.export'
  | 'gdpr.delete'
  | 'admin.login'
  | 'admin.logout'

export type EntityType =
  | 'user'
  | 'provider'
  | 'review'
  | 'payment'
  | 'subscription'
  | 'service'
  | 'booking'
  | 'quote'
  | 'report'
  | 'message'
  | 'settings'
  | 'admin'

interface AuditLogParams {
  adminId: string
  adminEmail: string
  action: AuditAction
  entityType: EntityType
  entityId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()
    const headersList = await headers()

    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown'

    const userAgent = headersList.get('user-agent') || 'unknown'

    await supabase.from('audit_logs').insert({
      user_id: params.adminId,
      action: params.action,
      resource_type: params.entityType,
      resource_id: params.entityId,
      old_value: params.oldData,
      new_value: params.newData,
      metadata: {
        ...params.metadata,
        admin_email: params.adminEmail,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      created_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    // Log to console but don't throw - audit logging should not break main operations
    logger.error('Failed to log audit event', error as Error)
  }
}

// Helper to get admin info from session
export async function getAdminInfo(): Promise<{
  id: string
  email: string
} | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    return {
      id: user.id,
      email: user.email || 'unknown',
    }
  } catch {
    return null
  }
}

// Convenience functions for common audit actions
export async function auditUserAction(
  action: Extract<AuditAction, `user.${string}`>,
  userId: string,
  details?: { oldData?: Record<string, unknown>; newData?: Record<string, unknown> }
) {
  const admin = await getAdminInfo()
  if (!admin) return

  await logAuditEvent({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    entityType: 'user',
    entityId: userId,
    ...details,
  })
}

export async function auditProviderAction(
  action: Extract<AuditAction, `provider.${string}`>,
  attorneyId: string,
  details?: { oldData?: Record<string, unknown>; newData?: Record<string, unknown> }
) {
  const admin = await getAdminInfo()
  if (!admin) return

  await logAuditEvent({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    entityType: 'provider',
    entityId: attorneyId,
    ...details,
  })
}

export async function auditReviewAction(
  action: Extract<AuditAction, `review.${string}`>,
  reviewId: string,
  details?: { oldData?: Record<string, unknown>; newData?: Record<string, unknown> }
) {
  const admin = await getAdminInfo()
  if (!admin) return

  await logAuditEvent({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    entityType: 'review',
    entityId: reviewId,
    ...details,
  })
}

export async function auditPaymentAction(
  action: Extract<AuditAction, `payment.${string}` | `subscription.${string}`>,
  entityId: string,
  entityType: 'payment' | 'subscription',
  details?: { oldData?: Record<string, unknown>; newData?: Record<string, unknown> }
) {
  const admin = await getAdminInfo()
  if (!admin) return

  await logAuditEvent({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    entityType,
    entityId,
    ...details,
  })
}

export async function auditReportAction(
  action: Extract<AuditAction, `report.${string}`>,
  reportId: string,
  details?: { oldData?: Record<string, unknown>; newData?: Record<string, unknown> }
) {
  const admin = await getAdminInfo()
  if (!admin) return

  await logAuditEvent({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    entityType: 'report',
    entityId: reportId,
    ...details,
  })
}

export async function auditGdprAction(
  action: Extract<AuditAction, `gdpr.${string}`>,
  userId: string,
  details?: { metadata?: Record<string, unknown> }
) {
  const admin = await getAdminInfo()
  if (!admin) return

  await logAuditEvent({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    entityType: 'user',
    entityId: userId,
    metadata: details?.metadata,
  })
}
