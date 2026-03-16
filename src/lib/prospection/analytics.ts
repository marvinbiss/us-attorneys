/**
 * Analytics Service - Prospection
 * Aggregation of campaign, channel, and audience stats
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CampaignStats,
  OverviewStats,
  ChannelPerformance,
  ProspectionChannel,
  ContactType,
} from '@/types/prospection'

/**
 * Stats for a specific campaign
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('prospection_campaigns')
    .select('total_recipients, sent_count, delivered_count, opened_count, clicked_count, replied_count, failed_count, opted_out_count, actual_cost')
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    return {
      total_recipients: 0, sent: 0, delivered: 0, opened: 0, clicked: 0,
      replied: 0, failed: 0, opted_out: 0,
      delivery_rate: 0, open_rate: 0, reply_rate: 0, bounce_rate: 0, total_cost: 0,
    }
  }

  const sent = campaign.sent_count || 0
  const delivered = campaign.delivered_count || 0

  return {
    total_recipients: campaign.total_recipients || 0,
    sent,
    delivered,
    opened: campaign.opened_count || 0,
    clicked: campaign.clicked_count || 0,
    replied: campaign.replied_count || 0,
    failed: campaign.failed_count || 0,
    opted_out: campaign.opted_out_count || 0,
    delivery_rate: sent > 0 ? (delivered / sent) * 100 : 0,
    open_rate: delivered > 0 ? ((campaign.opened_count || 0) / delivered) * 100 : 0,
    reply_rate: delivered > 0 ? ((campaign.replied_count || 0) / delivered) * 100 : 0,
    bounce_rate: sent > 0 ? ((campaign.failed_count || 0) / sent) * 100 : 0,
    total_cost: campaign.actual_cost || 0,
  }
}

/**
 * Vue d'ensemble globale
 * Optimized: uses parallel queries and in-JS grouping instead of N+1 loops
 */
export async function getOverviewStats(
  dateFrom?: string,
  dateTo?: string
): Promise<OverviewStats> {
  const supabase = createAdminClient()

  // Run all independent queries in parallel to minimize round-trips
  // 1. All active contacts with their type (single query, group in JS)
  const contactsPromise = supabase
    .from('prospection_contacts')
    .select('contact_type')
    .eq('is_active', true)

  // 2. Campaign counts (total + active) in parallel
  let campaignQuery = supabase
    .from('prospection_campaigns')
    .select('id', { count: 'exact', head: true })
  if (dateFrom) campaignQuery = campaignQuery.gte('created_at', dateFrom)
  if (dateTo) campaignQuery = campaignQuery.lte('created_at', dateTo)

  const activeCampaignsPromise = supabase
    .from('prospection_campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sending')

  // 3. All sent/delivered messages with channel+status (single query, group in JS)
  let messagesQuery = supabase
    .from('prospection_messages')
    .select('channel, status')
    .in('status', ['sent', 'delivered', 'read', 'replied', 'failed'])
  if (dateFrom) messagesQuery = messagesQuery.gte('created_at', dateFrom)
  if (dateTo) messagesQuery = messagesQuery.lte('created_at', dateTo)

  // 4. Conversations counts in parallel
  const totalConversationsPromise = supabase
    .from('prospection_conversations')
    .select('id', { count: 'exact', head: true })

  const openConversationsPromise = supabase
    .from('prospection_conversations')
    .select('id', { count: 'exact', head: true })
    .in('status', ['open', 'ai_handling', 'human_required'])

  // 5. Cost data
  const costPromise = supabase
    .from('prospection_campaigns')
    .select('actual_cost')

  // Await all queries in parallel
  const [
    contactsResult,
    campaignCountResult,
    activeCampaignsResult,
    messagesResult,
    totalConversationsResult,
    openConversationsResult,
    costResult,
  ] = await Promise.all([
    contactsPromise,
    campaignQuery,
    activeCampaignsPromise,
    messagesQuery,
    totalConversationsPromise,
    openConversationsPromise,
    costPromise,
  ])

  // Group contacts by type in JS
  const contacts_by_type: Record<ContactType, number> = { artisan: 0, client: 0, mairie: 0 }
  if (contactsResult.data) {
    for (const row of contactsResult.data) {
      const ct = row.contact_type as ContactType
      if (ct in contacts_by_type) {
        contacts_by_type[ct]++
      }
    }
  }
  const total_contacts = Object.values(contacts_by_type).reduce((a, b) => a + b, 0)

  // Group messages by channel and status in JS
  const messages_by_channel: Record<ProspectionChannel, number> = { email: 0, sms: 0, whatsapp: 0, voice: 0 }
  let total_messages_sent = 0
  let totalDelivered = 0
  let totalReplied = 0

  const sentStatuses = new Set(['sent', 'delivered', 'read', 'replied'])
  const deliveredStatuses = new Set(['delivered', 'read', 'replied'])

  if (messagesResult.data) {
    for (const row of messagesResult.data) {
      const ch = row.channel as ProspectionChannel
      const st = row.status as string

      if (sentStatuses.has(st)) {
        if (ch in messages_by_channel) {
          messages_by_channel[ch]++
        }
        total_messages_sent++
      }

      if (deliveredStatuses.has(st)) {
        totalDelivered++
      }

      if (st === 'replied') {
        totalReplied++
      }
    }
  }

  // Cost
  const total_cost = (costResult.data || []).reduce(
    (sum: number, c: { actual_cost: number | null }) => sum + (c.actual_cost || 0),
    0
  )

  return {
    total_contacts,
    contacts_by_type,
    total_campaigns: campaignCountResult.count || 0,
    active_campaigns: activeCampaignsResult.count || 0,
    total_messages_sent,
    messages_by_channel,
    overall_delivery_rate: total_messages_sent > 0 ? (totalDelivered / total_messages_sent) * 100 : 0,
    overall_reply_rate: totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0,
    total_conversations: totalConversationsResult.count || 0,
    open_conversations: openConversationsResult.count || 0,
    total_cost,
  }
}

/**
 * Performance per channel
 * Optimized: single query with in-JS grouping instead of 12 sequential queries
 */
export async function getChannelPerformance(
  dateFrom?: string,
  dateTo?: string
): Promise<ChannelPerformance[]> {
  const supabase = createAdminClient()

  // Single query to get all messages with relevant statuses
  let query = supabase
    .from('prospection_messages')
    .select('channel, status')
    .in('status', ['sent', 'delivered', 'read', 'replied', 'failed'])

  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  const { data: messages } = await query

  // Group in JS
  const sentStatuses = new Set(['sent', 'delivered', 'read', 'replied'])
  const deliveredStatuses = new Set(['delivered', 'read', 'replied'])

  const channelData: Record<string, { sent: number; delivered: number; replied: number; failed: number }> = {
    email: { sent: 0, delivered: 0, replied: 0, failed: 0 },
    sms: { sent: 0, delivered: 0, replied: 0, failed: 0 },
    whatsapp: { sent: 0, delivered: 0, replied: 0, failed: 0 },
  }

  if (messages) {
    for (const row of messages) {
      const ch = row.channel as string
      const st = row.status as string
      if (!(ch in channelData)) continue

      if (sentStatuses.has(st)) channelData[ch].sent++
      if (deliveredStatuses.has(st)) channelData[ch].delivered++
      if (st === 'replied') channelData[ch].replied++
      if (st === 'failed') channelData[ch].failed++
    }
  }

  const channels: ProspectionChannel[] = ['email', 'sms', 'whatsapp']
  return channels.map(channel => {
    const d = channelData[channel]
    return {
      channel,
      sent: d.sent,
      delivered: d.delivered,
      replied: d.replied,
      failed: d.failed,
      delivery_rate: d.sent > 0 ? (d.delivered / d.sent) * 100 : 0,
      reply_rate: d.delivered > 0 ? (d.replied / d.delivered) * 100 : 0,
      avg_cost: 0, // TODO: calculate from actual costs
    }
  })
}
