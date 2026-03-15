'use client'

import {
  Plus, Send, Eye, FileText, X, Check, XCircle, CheckCircle, Clock, RefreshCw,
} from 'lucide-react'
import type { LeadEventType } from '@/types/leads'

interface TimelineEvent {
  id: string
  event_type: LeadEventType
  metadata: Record<string, unknown>
  created_at: string
}

interface EventTimelineProps {
  events: TimelineEvent[]
  compact?: boolean
}

const iconMap: Record<LeadEventType, React.ReactNode> = {
  created: <Plus className="w-4 h-4" />,
  dispatched: <Send className="w-4 h-4" />,
  viewed: <Eye className="w-4 h-4" />,
  quoted: <FileText className="w-4 h-4" />,
  declined: <X className="w-4 h-4" />,
  accepted: <Check className="w-4 h-4" />,
  refused: <XCircle className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  expired: <Clock className="w-4 h-4" />,
  reassigned: <RefreshCw className="w-4 h-4" />,
}

const colorMap: Record<LeadEventType, string> = {
  created: 'bg-blue-100 text-blue-600 ring-blue-200',
  dispatched: 'bg-indigo-100 text-indigo-600 ring-indigo-200',
  viewed: 'bg-yellow-100 text-yellow-600 ring-yellow-200',
  quoted: 'bg-green-100 text-green-600 ring-green-200',
  declined: 'bg-gray-100 text-gray-500 ring-gray-200',
  accepted: 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  refused: 'bg-red-100 text-red-600 ring-red-200',
  completed: 'bg-green-100 text-green-700 ring-green-200',
  expired: 'bg-orange-100 text-orange-600 ring-orange-200',
  reassigned: 'bg-purple-100 text-purple-600 ring-purple-200',
}

const labelMap: Record<LeadEventType, string> = {
  created: 'Lead created',
  dispatched: 'Lead dispatched',
  viewed: 'Lead viewed',
  quoted: 'Quote sent',
  declined: 'Lead declined',
  accepted: 'Quote accepted',
  refused: 'Quote refused',
  completed: 'Case completed',
  expired: 'Lead expired',
  reassigned: 'Lead reassigned',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderMetadata(meta: Record<string, unknown>, eventType: LeadEventType): string | null {
  if (eventType === 'quoted' && meta.amount) {
    return `Amount: $${meta.amount}`
  }
  if (eventType === 'declined' && meta.reason) {
    return `Reason: ${meta.reason}`
  }
  return null
}

export function EventTimeline({ events, compact = false }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {events.map((event, idx) => {
          const metaText = renderMetadata(event.metadata, event.event_type)
          const isLast = idx === events.length - 1

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon dot */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ring-4 ring-white ${colorMap[event.event_type]}`}
              >
                {iconMap[event.event_type]}
              </div>

              {/* Content */}
              <div className={`flex-1 ${compact ? 'pb-2' : 'pb-3'} ${isLast ? '' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                    {labelMap[event.event_type]}
                  </p>
                  <time className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDate(event.created_at)}
                  </time>
                </div>
                {metaText && (
                  <p className="text-sm text-gray-500 mt-0.5">{metaText}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
