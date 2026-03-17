import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { createApiHandler } from '@/lib/api/handler'
import { verifyResendSignature } from '@/lib/prospection/webhook-security'

export const dynamic = 'force-dynamic'

/**
 * Webhook Resend - Delivery status callbacks pour les emails
 * Receives events: email.sent, email.delivered, email.bounced,
 * email.complained, email.delivery_delayed
 */
export const POST = createApiHandler(async (ctx) => {
  const rawBody = await ctx.request.text()

  // Verify the Resend signature (svix)
  const svixHeaders = {
    'svix-id': ctx.request.headers.get('svix-id') || undefined,
    'svix-timestamp': ctx.request.headers.get('svix-timestamp') || undefined,
    'svix-signature': ctx.request.headers.get('svix-signature') || undefined,
  }

  if (!verifyResendSignature(rawBody, svixHeaders)) {
    logger.warn('Invalid Resend webhook signature')
    return new NextResponse('OK', { status: 200 })
  }

  const event = JSON.parse(rawBody)
  const eventType: string = event.type
  const data = event.data

  if (!eventType || !data) {
    return new NextResponse('OK', { status: 200 })
  }

  const supabase = createAdminClient()

  // Map Resend events → prospection statuses
  const statusMap: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.bounced': 'failed',
    'email.complained': 'failed',
    'email.delivery_delayed': 'sending',
  }

  const newStatus = statusMap[eventType]
  if (!newStatus) {
    return new NextResponse('OK', { status: 200 })
  }

  // Resend sends the email_id in data.email_id
  const emailId: string | undefined = data.email_id
  if (!emailId) {
    logger.warn('Resend webhook missing email_id', { eventType })
    return new NextResponse('OK', { status: 200 })
  }

  const updateData: Record<string, unknown> = { status: newStatus }

  switch (newStatus) {
    case 'sent':
      updateData.sent_at = new Date().toISOString()
      break
    case 'delivered':
      updateData.delivered_at = new Date().toISOString()
      break
    case 'failed':
      updateData.failed_at = new Date().toISOString()
      updateData.error_code = eventType === 'email.bounced' ? 'bounced' : 'complained'
      updateData.error_message = data.bounce?.message || data.complaint?.message || eventType
      break
  }

  const { error } = await supabase
    .from('prospection_messages')
    .update(updateData)
    .eq('external_id', emailId)

  if (error) {
    logger.error('Resend webhook DB update error', error)
  }

  return new NextResponse('OK', { status: 200 })
}, {})
