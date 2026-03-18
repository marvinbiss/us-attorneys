import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'provider.claim'
  | 'provider.update'
  | 'provider.verify'
  | 'provider.plan_change'
  | 'quote.create'
  | 'quote.status_change'
  | 'quote.delete'
  | 'review.response'
  | 'review.moderate'
  | 'admin.provider_edit'
  | 'admin.provider_delete'
  | 'admin.review_moderate'
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'subscription.upgraded'

export interface AuditLogEntry {
  action: AuditAction
  userId?: string
  attorneyId?: string
  resourceType?: string
  resourceId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()

    await supabase.from('audit_logs').insert({
      action: entry.action,
      user_id: entry.userId,
      attorney_id: entry.attorneyId,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      old_value: entry.oldValue,
      new_value: entry.newValue,
      metadata: entry.metadata,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      created_at: new Date().toISOString(),
    })
  } catch (error: unknown) {
    logger.error('Audit logging error', error as Error)
  }
}

