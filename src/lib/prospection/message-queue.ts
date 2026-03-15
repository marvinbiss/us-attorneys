/**
 * Message Queue Service - Prospection
 * Traitement par batch des envois massifs avec rate limiting
 * Utilise la base de données comme queue (prospection_messages status='queued')
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { sendWhatsApp } from './channels/whatsapp'
import { sendProspectionSMS } from './channels/sms'
import { sendProspectionEmailBatch } from './channels/email'
import { renderTemplate } from './template-renderer'
import type {
  ProspectionChannel,
  ProspectionMessage,
  ProspectionContact,
  ProspectionCampaign,
  ProspectionTemplate,
} from '@/types/prospection'

/**
 * Mask a phone number for safe logging (e.g. +33****78)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***'
  return phone.slice(0, 3) + '****' + phone.slice(-2)
}

// Rate limits par canal (messages par seconde)
const CHANNEL_RATE_LIMITS: Record<ProspectionChannel, { perSecond: number; perMinute: number }> = {
  whatsapp: { perSecond: 80, perMinute: 1000 },
  sms: { perSecond: 10, perMinute: 400 },
  email: { perSecond: 100, perMinute: 5000 },
  voice: { perSecond: 5, perMinute: 60 },
}

// In-memory rate limiter per channel with sliding window
const rateLimitCounters: Record<string, { timestamps: number[] }> = {}

function checkRateLimit(channel: ProspectionChannel): boolean {
  const limit = CHANNEL_RATE_LIMITS[channel]
  const key = channel
  if (!rateLimitCounters[key]) {
    rateLimitCounters[key] = { timestamps: [] }
  }

  const now = Date.now()
  const windowMs = 60_000 // 1 minute window

  // Remove timestamps outside the window
  rateLimitCounters[key].timestamps = rateLimitCounters[key].timestamps.filter(
    ts => now - ts < windowMs
  )

  // Check if we're at the per-minute limit
  if (rateLimitCounters[key].timestamps.length >= limit.perMinute) {
    return false
  }

  return true
}

function recordSend(channel: ProspectionChannel): void {
  const key = channel
  if (!rateLimitCounters[key]) {
    rateLimitCounters[key] = { timestamps: [] }
  }
  rateLimitCounters[key].timestamps.push(Date.now())
}

export interface BatchResult {
  processed: number
  sent: number
  failed: number
  errors: Array<{ messageId: string; error: string }>
}

export interface QueueStats {
  queued: number
  sending: number
  sent: number
  delivered: number
  failed: number
  total: number
}

/**
 * Enfiler les messages pour une campagne
 * Crée les entrées prospection_messages pour chaque contact de la liste
 */
export async function enqueueCampaignMessages(
  campaignId: string
): Promise<{ enqueued: number; skipped: number }> {
  const supabase = createAdminClient()

  // Charger la campagne avec template et liste
  const { data: campaign, error: campError } = await supabase
    .from('prospection_campaigns')
    .select('id, name, channel, list_id, template_id, status, ab_test_enabled, ab_split_percent, template:prospection_templates(id, name, channel, subject, body, variables), list:prospection_lists(id, name)')
    .eq('id', campaignId)
    .single()

  if (campError || !campaign) {
    throw new Error(`Campaign not found: ${campError?.message}`)
  }

  if (!campaign.list_id) {
    throw new Error('Campaign has no contact list')
  }

  if (!campaign.template_id) {
    throw new Error('Campaign has no template')
  }

  // Prevent double-enqueue
  const { count: existingMessages } = await supabase
    .from('prospection_messages')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)

  if (existingMessages && existingMessages > 0) {
    throw new Error('Messages already enqueued for this campaign')
  }

  // Retrieve les contacts de la liste
  const { data: members, error: memberError } = await supabase
    .from('prospection_list_members')
    .select('contact_id')
    .eq('list_id', campaign.list_id)

  if (memberError) {
    throw new Error(`Failed to load list members: ${memberError.message}`)
  }

  // Charger les contacts
  const contactIds = members.map(m => m.contact_id)
  const { data: contacts, error: contactError } = await supabase
    .from('prospection_contacts')
    .select('id, contact_type, company_name, contact_name, email, phone, phone_e164, city, postal_code, department, region, location_code, custom_fields, is_active, consent_status')
    .in('id', contactIds)
    .eq('is_active', true)
    .eq('consent_status', 'opted_in')

  if (contactError) {
    throw new Error(`Failed to load contacts: ${contactError.message}`)
  }

  // Filter les contacts qui ont le canal nécessaire
  const validContacts = ((contacts || []) as unknown as ProspectionContact[]).filter(c => {
    if (campaign.channel === 'email') return !!c.email
    return !!c.phone_e164
  })

  // Déterminer le variant A/B
  const template = campaign.template as unknown as ProspectionTemplate
  const messages = validContacts.map((contact: ProspectionContact, index: number) => {
    const isVariantB = campaign.ab_test_enabled && index % 100 < campaign.ab_split_percent
    const renderedBody = renderTemplate(template.body, contact, campaign as unknown as ProspectionCampaign)
    const renderedSubject = template.subject
      ? renderTemplate(template.subject, contact, campaign as unknown as ProspectionCampaign)
      : null

    return {
      campaign_id: campaignId,
      contact_id: contact.id,
      channel: campaign.channel,
      rendered_body: renderedBody,
      rendered_subject: renderedSubject,
      ab_variant: isVariantB ? 'B' : 'A',
      status: 'queued' as const,
      queued_at: new Date().toISOString(),
    }
  })

  // Insérer par batch de 500
  let enqueued = 0
  const batchSize = 500
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize)
    const { error: insertError } = await supabase
      .from('prospection_messages')
      .insert(batch)

    if (insertError) {
      logger.error('Failed to enqueue batch', { error: insertError.message, offset: i })
    } else {
      enqueued += batch.length
    }
  }

  // Update les stats de la campagne
  await supabase
    .from('prospection_campaigns')
    .update({
      total_recipients: enqueued,
      status: 'sending',
      started_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  return { enqueued, skipped: contactIds.length - enqueued }
}

/**
 * Traiter un batch de messages en queue
 * Uses atomic UPDATE...RETURNING to prevent double-send race conditions
 */
export async function processBatch(
  campaignId: string,
  batchSize: number = 100
): Promise<BatchResult> {
  const supabase = createAdminClient()
  const result: BatchResult = { processed: 0, sent: 0, failed: 0, errors: [] }

  // Reconcile any orphaned messages before processing new batch
  await reconcileOrphanedMessages(supabase)

  // Retrieve la campagne pour le canal
  const { data: campaign } = await supabase
    .from('prospection_campaigns')
    .select('channel, status')
    .eq('id', campaignId)
    .single()

  if (!campaign || campaign.status === 'paused' || campaign.status === 'cancelled') {
    return result
  }

  const channel = campaign.channel as ProspectionChannel

  // Check rate limit before claiming messages
  if (!checkRateLimit(channel)) {
    logger.warn('Rate limit reached, skipping batch', { campaignId, channel })
    return result
  }

  // ATOMIC: Use database RPC with FOR UPDATE SKIP LOCKED to claim queued messages.
  // This prevents race conditions when multiple workers process the same campaign.
  const { data: claimedMessages, error: claimError } = await supabase.rpc('claim_queued_messages', {
    p_campaign_id: campaignId,
    p_batch_size: batchSize,
  })

  if (claimError || !claimedMessages?.length) {
    if (claimError) {
      logger.error('Failed to claim messages', { error: claimError.message })
    }
    return result
  }

  // The RPC returns raw message rows without contacts — fetch contacts separately
  const contactIds = Array.from(new Set(claimedMessages.map((m: ProspectionMessage) => m.contact_id)))
  const { data: contacts } = await supabase
    .from('prospection_contacts')
    .select('id, email, phone_e164')
    .in('id', contactIds)

  const contactMap = new Map(((contacts || []) as unknown as ProspectionContact[]).map((c: ProspectionContact) => [c.id, c]))
  const messages = claimedMessages.map((m: ProspectionMessage) => ({
    ...m,
    contact: contactMap.get(m.contact_id) || null,
  })) as (ProspectionMessage & { contact: ProspectionContact })[]

  // Rate limiting
  const rateLimit = CHANNEL_RATE_LIMITS[channel]
  const delayMs = Math.ceil(1000 / rateLimit.perSecond)

  // Send par canal
  if (channel === 'email') {
    // Batch email - separate messages with valid emails from those without
    const emailMessages = messages.filter(m => m.contact?.email)
    const skippedMessages = messages.filter(m => !m.contact?.email)

    // Mark messages without email as failed
    for (const msg of skippedMessages) {
      result.processed++
      result.failed++
      await updateMessageFailed(supabase, msg.id, 'No email address')
    }

    const emailParams = emailMessages.map(m => ({
      to: m.contact.email!,
      subject: m.rendered_subject || 'US Attorneys',
      html: m.rendered_body || '',
      tags: [{ name: 'campaign_id', value: campaignId }],
    }))

    if (emailParams.length > 0) {
      try {
        const batchResult = await sendProspectionEmailBatch(emailParams)

        // Map results back using emailMessages (same length/order as emailParams)
        for (let i = 0; i < emailMessages.length; i++) {
          const msg = emailMessages[i]
          const emailResult = batchResult.results[i]
          result.processed++

          if (emailResult?.success) {
            result.sent++
            recordSend(channel)
            try {
              await updateMessageStatus(supabase, msg.id, 'sent', emailResult.id)
            } catch (updateErr) {
              logger.error('CRITICAL: Message sent but status update failed', {
                messageId: msg.id,
                sid: emailResult.id,
                error: updateErr instanceof Error ? updateErr.message : 'Unknown',
              })
              // Retry once
              try {
                await updateMessageStatus(supabase, msg.id, 'sent', emailResult.id)
              } catch {
                // Message is sent but stuck in 'sending' — requires manual reconciliation
                logger.error('FATAL: Status update retry failed', { messageId: msg.id })
              }
            }
          } else {
            result.failed++
            const errMsg = emailResult?.error || 'Unknown error'
            result.errors.push({ messageId: msg.id, error: errMsg })
            await updateMessageFailed(supabase, msg.id, errMsg)
          }
        }
      } catch (batchErr) {
        for (const msg of emailMessages) {
          result.processed++
          result.failed++
          const errMsg = batchErr instanceof Error ? batchErr.message : 'Email batch error'
          result.errors.push({ messageId: msg.id, error: errMsg })
          await updateMessageFailed(supabase, msg.id, errMsg)
        }
      }
    }
  } else {
    // SMS et WhatsApp : envoi séquentiel avec rate limiting
    for (const msg of messages) {
      result.processed++
      const contact = msg.contact

      if (!contact?.phone_e164) {
        result.failed++
        await updateMessageFailed(supabase, msg.id, 'No phone number')
        continue
      }

      // Check per-minute rate limit before each send
      if (!checkRateLimit(channel)) {
        logger.warn('Rate limit reached mid-batch, stopping', { campaignId, channel })
        // Re-queue the message since we can't send it now
        await supabase
          .from('prospection_messages')
          .update({ status: 'queued', sent_at: null })
          .eq('id', msg.id)
        continue
      }

      try {
        let sendResult: { success: boolean; sid?: string; error?: string }

        if (channel === 'whatsapp') {
          sendResult = await sendWhatsApp({
            to: contact.phone_e164,
            body: msg.rendered_body || '',
          })
        } else {
          sendResult = await sendProspectionSMS({
            to: contact.phone_e164,
            body: msg.rendered_body || '',
          })
        }

        if (sendResult.success) {
          result.sent++
          recordSend(channel)
          try {
            await updateMessageStatus(supabase, msg.id, 'sent', sendResult.sid)
          } catch (updateErr) {
            logger.error('CRITICAL: Message sent but status update failed', {
              messageId: msg.id,
              sid: sendResult.sid,
              error: updateErr instanceof Error ? updateErr.message : 'Unknown',
            })
            // Retry once
            try {
              await updateMessageStatus(supabase, msg.id, 'sent', sendResult.sid)
            } catch {
              // Message is sent but stuck in 'sending' — requires manual reconciliation
              logger.error('FATAL: Status update retry failed', { messageId: msg.id })
            }
          }
        } else {
          result.failed++
          const errMsg = sendResult.error || 'Send failed'
          result.errors.push({ messageId: msg.id, error: errMsg })
          await updateMessageFailed(supabase, msg.id, errMsg)
        }
      } catch (err) {
        result.failed++
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        result.errors.push({ messageId: msg.id, error: errMsg })
        await updateMessageFailed(supabase, msg.id, errMsg)
      }

      // Rate limiting delay between sends
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  // Update les stats de la campagne
  try {
    await updateCampaignStats(supabase, campaignId)
  } catch (err) {
    logger.error('Failed to update campaign stats', {
      campaignId,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }

  // Verify si la campagne est terminée
  try {
    await checkCampaignCompletion(supabase, campaignId)
  } catch (err) {
    logger.error('Failed to check campaign completion', {
      campaignId,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }

  return result
}

/**
 * Mettre en pause une campagne
 */
export async function pauseCampaign(campaignId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('prospection_campaigns')
    .update({ status: 'paused', paused_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('status', 'sending')
}

/**
 * Reprendre une campagne
 */
export async function resumeCampaign(campaignId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('prospection_campaigns')
    .update({ status: 'sending', paused_at: null })
    .eq('id', campaignId)
    .eq('status', 'paused')
}

/**
 * Réessayer les messages échoués
 * Keeps existing retry_count so we know total attempts; only clears error and re-queues
 */
export async function retryFailed(campaignId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('prospection_messages')
    .update({
      status: 'queued',
      error_code: null,
      error_message: null,
      failed_at: null,
      next_retry_at: null,
      // Do NOT reset retry_count — keep existing count to track total attempts
    })
    .eq('campaign_id', campaignId)
    .eq('status', 'failed')
    .select('id')

  if (error) {
    logger.error('Failed to retry messages', { error: error.message })
    return 0
  }

  return data?.length || 0
}

/**
 * Obtenir les stats de la queue pour une campagne
 */
export async function getQueueStats(campaignId: string): Promise<QueueStats> {
  const supabase = createAdminClient()

  const statuses = ['queued', 'sending', 'sent', 'delivered', 'failed'] as const
  const stats: QueueStats = { queued: 0, sending: 0, sent: 0, delivered: 0, failed: 0, total: 0 }

  for (const status of statuses) {
    const { count } = await supabase
      .from('prospection_messages')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', status)

    stats[status] = count || 0
    stats.total += count || 0
  }

  return stats
}

/**
 * Reconcile orphaned messages stuck in 'sending' status for more than 10 minutes.
 * Messages with retries remaining go back to 'queued'; those that exceeded max retries are marked 'failed'.
 * Can be called from processBatch or externally via cron.
 */
export async function reconcileOrphanedMessages(supabase: ReturnType<typeof createAdminClient>): Promise<number> {
  const TEN_MINUTES_AGO = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  // Reset stuck 'sending' messages that have been in that state for > 10 minutes
  // Messages with retries remaining go back to 'queued'
  const { data: stuck, error } = await supabase
    .from('prospection_messages')
    .update({
      status: 'queued',
      sent_at: null,
    })
    .eq('status', 'sending')
    .lt('sent_at', TEN_MINUTES_AGO)
    .lt('retry_count', 3)
    .select('id')

  if (error) {
    logger.error('Failed to reconcile orphaned messages', error)
    return 0
  }

  // Messages that exceeded max retries -> mark as failed
  const { data: failed } = await supabase
    .from('prospection_messages')
    .update({
      status: 'failed',
      error_message: 'Message stuck in sending state - max retries exceeded',
      failed_at: new Date().toISOString(),
    })
    .eq('status', 'sending')
    .lt('sent_at', TEN_MINUTES_AGO)
    .gte('retry_count', 3)
    .select('id')

  const reconciledCount = (stuck?.length || 0) + (failed?.length || 0)
  if (reconciledCount > 0) {
    logger.warn(`Reconciled ${reconciledCount} orphaned messages (${stuck?.length || 0} requeued, ${failed?.length || 0} failed)`)
  }

  return reconciledCount
}

// --- Helpers privés ---

async function updateMessageStatus(
  supabase: ReturnType<typeof createAdminClient>,
  messageId: string,
  status: string,
  externalId?: string
): Promise<void> {
  await supabase
    .from('prospection_messages')
    .update({
      status,
      external_id: externalId || null,
      sent_at: new Date().toISOString(),
    })
    .eq('id', messageId)
}

async function updateMessageFailed(
  supabase: ReturnType<typeof createAdminClient>,
  messageId: string,
  errorMessage: string
): Promise<void> {
  // Incrémenter retry_count via un select + update
  const { data: msg } = await supabase
    .from('prospection_messages')
    .select('retry_count, max_retries')
    .eq('id', messageId)
    .single()

  const retryCount = (msg?.retry_count || 0) + 1
  const maxRetries = msg?.max_retries || 3
  const shouldRetry = retryCount < maxRetries

  await supabase
    .from('prospection_messages')
    .update({
      status: shouldRetry ? 'queued' : 'failed',
      error_message: errorMessage,
      retry_count: retryCount,
      failed_at: shouldRetry ? null : new Date().toISOString(),
      // Backoff exponentiel: 30s, 2min, 8min
      next_retry_at: shouldRetry
        ? new Date(Date.now() + Math.pow(4, retryCount) * 30000).toISOString()
        : null,
    })
    .eq('id', messageId)
}

async function updateCampaignStats(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string
): Promise<void> {
  const stats = await getQueueStats(campaignId)

  await supabase
    .from('prospection_campaigns')
    .update({
      sent_count: stats.sent + stats.delivered,
      delivered_count: stats.delivered,
      failed_count: stats.failed,
    })
    .eq('id', campaignId)
}

async function checkCampaignCompletion(
  supabase: ReturnType<typeof createAdminClient>,
  campaignId: string
): Promise<void> {
  const { count: remaining } = await supabase
    .from('prospection_messages')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .in('status', ['queued', 'sending'])

  if (remaining === 0) {
    await supabase
      .from('prospection_campaigns')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('status', 'sending')
  }
}
