'use client'

import { useState } from 'react'
import { Inbox, Eye, CheckCircle, Trophy, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { LeadCard, type LeadCardData } from './LeadCard'

// ─── Column Config ──────────────────────────────────────────────────────────

interface PipelineColumn {
  key: string
  label: string
  icon: React.ReactNode
  colorBg: string
  colorBorder: string
  colorText: string
  colorDot: string
  emptyMessage: string
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    key: 'pending',
    label: 'New',
    icon: <Inbox className="w-4 h-4" />,
    colorBg: 'bg-blue-50 dark:bg-blue-900/20',
    colorBorder: 'border-blue-200 dark:border-blue-800',
    colorText: 'text-blue-700 dark:text-blue-300',
    colorDot: 'bg-blue-500',
    emptyMessage: 'No new leads. They will appear here when assigned.',
  },
  {
    key: 'viewed',
    label: 'Contacted',
    icon: <Eye className="w-4 h-4" />,
    colorBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    colorBorder: 'border-yellow-200 dark:border-yellow-800',
    colorText: 'text-yellow-700 dark:text-yellow-300',
    colorDot: 'bg-yellow-500',
    emptyMessage: 'No contacted leads yet.',
  },
  {
    key: 'quoted',
    label: 'Qualified',
    icon: <CheckCircle className="w-4 h-4" />,
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    colorBorder: 'border-green-200 dark:border-green-800',
    colorText: 'text-green-700 dark:text-green-300',
    colorDot: 'bg-green-500',
    emptyMessage: 'No qualified leads yet. Send quotes to move leads here.',
  },
  {
    key: 'accepted',
    label: 'Converted',
    icon: <Trophy className="w-4 h-4" />,
    colorBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    colorBorder: 'border-emerald-200 dark:border-emerald-800',
    colorText: 'text-emerald-700 dark:text-emerald-300',
    colorDot: 'bg-emerald-500',
    emptyMessage: 'No converted leads yet. Keep following up!',
  },
  {
    key: 'declined',
    label: 'Lost',
    icon: <XCircle className="w-4 h-4" />,
    colorBg: 'bg-gray-50 dark:bg-gray-800/50',
    colorBorder: 'border-gray-200 dark:border-gray-700',
    colorText: 'text-gray-500 dark:text-gray-400',
    colorDot: 'bg-gray-400',
    emptyMessage: 'No lost leads.',
  },
]

// ─── Props ──────────────────────────────────────────────────────────────────

interface LeadPipelineProps {
  leads: LeadCardData[]
  onStatusChange: (assignmentId: string, newStatus: string) => void
  updatingIds: Set<string>
}

// ─── Mobile Accordion Column ────────────────────────────────────────────────

function MobileColumnAccordion({
  column,
  leads,
  onStatusChange,
  updatingIds,
}: {
  column: PipelineColumn
  leads: LeadCardData[]
  onStatusChange: (assignmentId: string, newStatus: string) => void
  updatingIds: Set<string>
}) {
  const [expanded, setExpanded] = useState(column.key === 'pending')

  return (
    <div className={`rounded-xl border ${column.colorBorder} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className={`w-full flex items-center justify-between px-4 py-3 ${column.colorBg} transition-colors`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`${column.colorText}`}>{column.icon}</span>
          <span className={`font-semibold text-sm ${column.colorText}`}>{column.label}</span>
          <span
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${column.colorBg} ${column.colorText} border ${column.colorBorder}`}
          >
            {leads.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className={`w-4 h-4 ${column.colorText}`} aria-hidden="true" />
        ) : (
          <ChevronRight className={`w-4 h-4 ${column.colorText}`} aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className="p-3 space-y-3 bg-white dark:bg-gray-900">
          {leads.length === 0 ? (
            <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
              {column.emptyMessage}
            </p>
          ) : (
            leads.map((assignment) => (
              <LeadCard
                key={assignment.id}
                assignment={assignment}
                onStatusChange={onStatusChange}
                isUpdating={updatingIds.has(assignment.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Pipeline Component ────────────────────────────────────────────────

export function LeadPipeline({ leads, onStatusChange, updatingIds }: LeadPipelineProps) {
  // Group leads by status
  const groupedLeads: Record<string, LeadCardData[]> = {}
  for (const col of PIPELINE_COLUMNS) {
    groupedLeads[col.key] = []
  }
  for (const lead of leads) {
    const status = lead.status
    // Map 'won' to 'accepted' column
    const key = status === 'won' ? 'accepted' : status
    if (groupedLeads[key]) {
      groupedLeads[key].push(lead)
    } else {
      // Fallback: put unknown statuses in 'pending'
      groupedLeads['pending'].push(lead)
    }
  }

  return (
    <>
      {/* Desktop: Horizontal columns */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4" role="region" aria-label="Lead pipeline">
        {PIPELINE_COLUMNS.map((column) => {
          const columnLeads = groupedLeads[column.key]
          return (
            <div key={column.key} className="flex flex-col min-h-[400px]">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${column.colorBg} border ${column.colorBorder} border-b-0`}>
                <span className={column.colorText}>{column.icon}</span>
                <span className={`font-semibold text-sm ${column.colorText}`}>{column.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white ${column.colorDot}`}
                >
                  {columnLeads.length}
                </span>
              </div>

              {/* Column body */}
              <div
                className={`flex-1 rounded-b-xl border ${column.colorBorder} border-t-0 bg-gray-50/50 dark:bg-gray-900/30 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]`}
              >
                {columnLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 px-2">
                      {column.emptyMessage}
                    </p>
                  </div>
                ) : (
                  columnLeads.map((assignment) => (
                    <LeadCard
                      key={assignment.id}
                      assignment={assignment}
                      onStatusChange={onStatusChange}
                      isUpdating={updatingIds.has(assignment.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tablet: Horizontal scroll */}
      <div className="hidden md:flex lg:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory" role="region" aria-label="Lead pipeline">
        {PIPELINE_COLUMNS.map((column) => {
          const columnLeads = groupedLeads[column.key]
          return (
            <div key={column.key} className="flex-shrink-0 w-[340px] snap-start flex flex-col">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl ${column.colorBg} border ${column.colorBorder} border-b-0`}>
                <span className={column.colorText}>{column.icon}</span>
                <span className={`font-semibold text-sm ${column.colorText}`}>{column.label}</span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white ${column.colorDot}`}
                >
                  {columnLeads.length}
                </span>
              </div>

              {/* Column body */}
              <div
                className={`flex-1 rounded-b-xl border ${column.colorBorder} border-t-0 bg-gray-50/50 dark:bg-gray-900/30 p-2 space-y-2 overflow-y-auto max-h-[60vh]`}
              >
                {columnLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 px-2">
                      {column.emptyMessage}
                    </p>
                  </div>
                ) : (
                  columnLeads.map((assignment) => (
                    <LeadCard
                      key={assignment.id}
                      assignment={assignment}
                      onStatusChange={onStatusChange}
                      isUpdating={updatingIds.has(assignment.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Accordion */}
      <div className="md:hidden space-y-3" role="region" aria-label="Lead pipeline">
        {PIPELINE_COLUMNS.map((column) => (
          <MobileColumnAccordion
            key={column.key}
            column={column}
            leads={groupedLeads[column.key]}
            onStatusChange={onStatusChange}
            updatingIds={updatingIds}
          />
        ))}
      </div>
    </>
  )
}
