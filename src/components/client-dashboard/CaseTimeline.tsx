'use client'

import {
  FileText,
  Send,
  Gavel,
  MessageSquare,
  Upload,
  CheckCircle,
  Clock,
  UserPlus,
  AlertCircle,
  Scale,
  Eye,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CaseEventType =
  | 'submitted'
  | 'attorney_assigned'
  | 'viewed'
  | 'in_progress'
  | 'document_uploaded'
  | 'document_shared'
  | 'message_sent'
  | 'hearing_scheduled'
  | 'filing'
  | 'quote_received'
  | 'quote_accepted'
  | 'resolved'
  | 'completed'
  | 'cancelled'

export interface CaseTimelineEvent {
  id: string
  event_type: CaseEventType
  title: string
  description?: string
  date: string
  actor?: string
}

interface CaseTimelineProps {
  events: CaseTimelineEvent[]
  compact?: boolean
}

// ─── Event Config ────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<CaseEventType, { icon: React.ReactNode; color: string }> = {
  submitted: {
    icon: <Send className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-600 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:ring-blue-800',
  },
  attorney_assigned: {
    icon: <UserPlus className="w-4 h-4" />,
    color: 'bg-indigo-100 text-indigo-600 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:ring-indigo-800',
  },
  viewed: {
    icon: <Eye className="w-4 h-4" />,
    color: 'bg-yellow-100 text-yellow-600 ring-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:ring-yellow-800',
  },
  in_progress: {
    icon: <Scale className="w-4 h-4" />,
    color: 'bg-purple-100 text-purple-600 ring-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:ring-purple-800',
  },
  document_uploaded: {
    icon: <Upload className="w-4 h-4" />,
    color: 'bg-cyan-100 text-cyan-600 ring-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:ring-cyan-800',
  },
  document_shared: {
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-teal-100 text-teal-600 ring-teal-200 dark:bg-teal-900/40 dark:text-teal-400 dark:ring-teal-800',
  },
  message_sent: {
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'bg-sky-100 text-sky-600 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-400 dark:ring-sky-800',
  },
  hearing_scheduled: {
    icon: <Gavel className="w-4 h-4" />,
    color: 'bg-amber-100 text-amber-600 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:ring-amber-800',
  },
  filing: {
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-orange-100 text-orange-600 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:ring-orange-800',
  },
  quote_received: {
    icon: <FileText className="w-4 h-4" />,
    color: 'bg-green-100 text-green-600 ring-green-200 dark:bg-green-900/40 dark:text-green-400 dark:ring-green-800',
  },
  quote_accepted: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-emerald-100 text-emerald-600 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:ring-emerald-800',
  },
  resolved: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/40 dark:text-green-400 dark:ring-green-800',
  },
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/40 dark:text-green-400 dark:ring-green-800',
  },
  cancelled: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'bg-red-100 text-red-600 ring-red-200 dark:bg-red-900/40 dark:text-red-400 dark:ring-red-800',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CaseTimeline({ events, compact = false }: CaseTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No events yet</p>
      </div>
    )
  }

  return (
    <div className="relative" role="list" aria-label="Case timeline">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

      <div className={compact ? 'space-y-3' : 'space-y-4'}>
        {events.map((event, idx) => {
          const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.submitted
          const isFirst = idx === 0

          return (
            <div
              key={event.id}
              className="relative flex gap-4"
              role="listitem"
            >
              {/* Icon dot */}
              <div
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ring-4 ring-white dark:ring-gray-800 flex-shrink-0 ${config.color} ${
                  isFirst ? 'scale-110' : ''
                }`}
                aria-hidden="true"
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className={`flex-1 ${compact ? 'pb-2' : 'pb-3'} min-w-0`}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`font-medium text-gray-900 dark:text-gray-100 ${compact ? 'text-sm' : 'text-base'}`}>
                    {event.title}
                  </p>
                  <time className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap" dateTime={event.date}>
                    {compact ? formatDateShort(event.date) : formatDate(event.date)}
                  </time>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {event.description}
                  </p>
                )}
                {event.actor && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    by {event.actor}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CaseTimeline
