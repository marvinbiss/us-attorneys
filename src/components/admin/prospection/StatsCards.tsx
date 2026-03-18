import { Mail, MessageSquare, Phone, Users, Send, TrendingUp, DollarSign, Inbox } from 'lucide-react'
import type { OverviewStats } from '@/types/prospection'

interface StatsCardsProps {
  stats: OverviewStats | null
  loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      name: 'Contacts',
      value: stats?.total_contacts || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      detail: stats ? `${stats.contacts_by_type.attorney} attorneys, ${stats.contacts_by_type.client} clients, ${stats.contacts_by_type.municipality} firms` : '',
    },
    {
      name: 'Active campaigns',
      value: stats?.active_campaigns || 0,
      icon: Send,
      color: 'text-green-600 bg-green-100',
      detail: `${stats?.total_campaigns || 0} total`,
    },
    {
      name: 'Messages sent',
      value: stats?.total_messages_sent || 0,
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-100',
      detail: stats ? `Email: ${stats.messages_by_channel.email}, SMS: ${stats.messages_by_channel.sms}, WA: ${stats.messages_by_channel.whatsapp}` : '',
    },
    {
      name: 'Delivery rate',
      value: `${(stats?.overall_delivery_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-amber-600 bg-amber-100',
    },
    {
      name: 'Reply rate',
      value: `${(stats?.overall_reply_rate || 0).toFixed(1)}%`,
      icon: Inbox,
      color: 'text-blue-600 bg-blue-100',
      detail: `${stats?.open_conversations || 0} open conversations`,
    },
    {
      name: 'Total cost',
      value: `${(stats?.total_cost || 0).toFixed(2)} $`,
      icon: DollarSign,
      color: 'text-rose-600 bg-rose-100',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.name} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{card.name}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {typeof card.value === 'number' ? card.value.toLocaleString('en-US') : card.value}
            </p>
            {card.detail && (
              <p className="text-xs text-gray-400 mt-1">{card.detail}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Channel icons
export function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  switch (channel) {
    case 'email': return <Mail className={className || 'w-4 h-4'} />
    case 'sms': return <Phone className={className || 'w-4 h-4'} />
    case 'whatsapp': return <MessageSquare className={className || 'w-4 h-4'} />
    default: return null
  }
}

// Campaign status badge
export function CampaignStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const labels: Record<string, string> = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    sending: 'Sending',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  )
}

// Contact type badge
export function ContactTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    artisan: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    mairie: 'bg-blue-100 text-blue-700',
  }

  const labels: Record<string, string> = {
    artisan: 'Attorney',
    client: 'Client',
    mairie: 'Firm',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
      {labels[type] || type}
    </span>
  )
}
