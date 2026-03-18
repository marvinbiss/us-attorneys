'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Phone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Eye,
  Send,
  Archive,
  ChevronDown,
  Flame,
  Zap,
  Snowflake,
  Lock,
} from 'lucide-react'
import { URGENCY_META, STATUS_META } from '@/types/leads'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LeadCardData {
  id: string
  status: string
  score: number | null
  assigned_at: string
  viewed_at: string | null
  responded_at: string | null
  lead: {
    id: string
    service_name: string
    city: string | null
    postal_code: string | null
    description: string
    urgency: string
    client_name: string
    client_phone: string
    client_email: string | null
    created_at: string
    status: string
    _blurred?: boolean
  } | null
  quote: {
    id: string
    amount: number
    status: string
  } | null
}

interface LeadCardProps {
  assignment: LeadCardData
  onStatusChange: (assignmentId: string, newStatus: string) => void
  isUpdating?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getResponseDeadlineMinutes(assignedAt: string): number {
  const assigned = new Date(assignedAt).getTime()
  const deadline = assigned + 2 * 60 * 60 * 1000 // 2 hours
  const now = Date.now()
  return Math.max(0, Math.floor((deadline - now) / 60000))
}

function getPriorityInfo(urgency: string, assignedAt: string): {
  label: string
  icon: React.ReactNode
  cls: string
} {
  const minutesLeft = getResponseDeadlineMinutes(assignedAt)
  const isRecent = minutesLeft > 0

  if (urgency === 'very_urgent' || urgency === 'emergency' || (urgency === 'high' && isRecent)) {
    return {
      label: 'Hot',
      icon: <Flame className="w-3.5 h-3.5" aria-hidden="true" />,
      cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    }
  }
  if (urgency === 'urgent' || urgency === 'high' || (urgency === 'medium' && isRecent)) {
    return {
      label: 'Warm',
      icon: <Zap className="w-3.5 h-3.5" aria-hidden="true" />,
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    }
  }
  return {
    label: 'Cold',
    icon: <Snowflake className="w-3.5 h-3.5" aria-hidden="true" />,
    cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ─── Status Dropdown ────────────────────────────────────────────────────────

function StatusDropdown({
  currentStatus,
  onSelect,
  disabled,
}: {
  currentStatus: string
  onSelect: (status: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    },
    []
  )

  const st = STATUS_META[currentStatus] || STATUS_META.pending

  const statusOptions = [
    { value: 'pending', label: 'New' },
    { value: 'viewed', label: 'Contacted' },
    { value: 'quoted', label: 'Qualified' },
    { value: 'accepted', label: 'Converted' },
    { value: 'declined', label: 'Lost' },
  ]

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${st.cls} hover:opacity-80 disabled:opacity-50`}
      >
        {st.label}
        <ChevronDown className="w-3 h-3" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Change lead status"
          className="absolute right-0 top-full mt-1 z-30 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in slide-in-from-top-1"
        >
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={currentStatus === opt.value}
              onClick={() => {
                onSelect(opt.value)
                setOpen(false)
              }}
              disabled={currentStatus === opt.value}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                currentStatus === opt.value
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              } disabled:cursor-default`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function LeadCard({ assignment, onStatusChange, isUpdating }: LeadCardProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const lead = assignment.lead

  if (!lead) return null

  const isBlurred = lead._blurred
  const priorityInfo = getPriorityInfo(lead.urgency, assignment.assigned_at)
  const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
  const isNew = assignment.status === 'pending'
  const responseMinutes = getResponseDeadlineMinutes(assignment.assigned_at)
  const showCountdown = isNew && responseMinutes > 0 && responseMinutes <= 120

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border transition-all group ${
        isNew
          ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/50'
          : 'border-gray-200 dark:border-gray-700'
      } ${isUpdating ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <div className="p-4">
        {/* Top row: avatar + name + badges + status dropdown */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <span className="text-white text-sm font-semibold">
              {getInitials(lead.client_name)}
            </span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {isNew && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0" aria-label="New lead" />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                  {lead.client_name}
                </h3>
              </div>
              <StatusDropdown
                currentStatus={assignment.status}
                onSelect={(s) => onStatusChange(assignment.id, s)}
                disabled={isUpdating || isBlurred}
              />
            </div>

            {/* Practice area badge + priority indicator */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {lead.service_name}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priorityInfo.cls}`}>
                {priorityInfo.icon}
                {priorityInfo.label}
              </span>
              {urg.label !== 'Normal' && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                  {urg.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description preview */}
        {lead.description && (
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-2.5 line-clamp-2 ml-[52px]">
            {lead.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 ml-[52px] text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formatRelative(lead.created_at)}
          </span>
          {lead.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {lead.city}
              {lead.postal_code ? ` (${lead.postal_code})` : ''}
            </span>
          )}
          {assignment.score != null && (
            <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
              Score: {Math.round(assignment.score)}
            </span>
          )}
        </div>

        {/* Response countdown */}
        {showCountdown && (
          <div className="mt-2.5 ml-[52px]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Respond within {responseMinutes < 60 ? `${responseMinutes}m` : `${Math.floor(responseMinutes / 60)}h ${responseMinutes % 60}m`} for best conversion
            </div>
          </div>
        )}

        {/* Contact buttons + quick actions */}
        <div className="flex items-center justify-between mt-3 ml-[52px]">
          {/* Contact buttons */}
          <div className="flex items-center gap-2">
            {isBlurred ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs">
                <Lock className="w-3 h-3" aria-hidden="true" />
                Upgrade to unlock contact
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPhoneRevealed(!phoneRevealed)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                  aria-label={phoneRevealed ? 'Hide phone number' : 'Reveal phone number'}
                >
                  <Phone className="w-3 h-3" aria-hidden="true" />
                  {phoneRevealed ? lead.client_phone : 'Call'}
                </button>
                {lead.client_email && (
                  <a
                    href={`mailto:${lead.client_email}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    aria-label={`Email ${lead.client_name}`}
                  >
                    <Mail className="w-3 h-3" aria-hidden="true" />
                    Email
                  </a>
                )}
                <Link
                  href={`/attorney-dashboard/leads/${assignment.id}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label={`Message ${lead.client_name}`}
                >
                  <MessageSquare className="w-3 h-3" aria-hidden="true" />
                  Message
                </Link>
              </>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            {isNew && !isBlurred && (
              <button
                type="button"
                onClick={() => onStatusChange(assignment.id, 'viewed')}
                disabled={isUpdating}
                className="p-1.5 rounded-md text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:text-yellow-400 dark:hover:bg-yellow-900/30 transition-colors"
                aria-label="Mark as contacted"
                title="Mark as contacted"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
            {!isBlurred && assignment.status !== 'quoted' && (
              <button
                type="button"
                onClick={() => onStatusChange(assignment.id, 'quoted')}
                disabled={isUpdating}
                className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/30 transition-colors"
                aria-label="Send quote"
                title="Send quote"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
            {!isBlurred && (
              <button
                type="button"
                onClick={() => onStatusChange(assignment.id, 'declined')}
                disabled={isUpdating}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                aria-label="Archive lead"
                title="Archive"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
