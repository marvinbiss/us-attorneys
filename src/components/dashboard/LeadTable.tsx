import Link from 'next/link'
import { Clock, MapPin, ChevronRight } from 'lucide-react'
import { URGENCY_META, STATUS_META } from '@/types/leads'
import type { LeadAssignment } from '@/types/leads'

interface LeadTableProps {
  assignments: LeadAssignment[]
  basePath: string
  showProvider?: boolean
  attorneyNames?: Record<string, string>
}

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
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export function LeadTable({ assignments, basePath, showProvider, attorneyNames }: LeadTableProps) {
  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">No leads</p>
        <p className="text-sm text-gray-400 mt-1">New leads will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Service
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Location
              </th>
              {showProvider && (
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Attorney
                </th>
              )}
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Urgency
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                Date
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((a) => {
              const lead = a.lead
              const urg = URGENCY_META[lead.urgency] || URGENCY_META.normal
              const st = STATUS_META[a.status] || STATUS_META.pending

              return (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <Link
                      href={`${basePath}/${a.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {lead.service_name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {lead.client_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {lead.city ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {lead.city} {lead.postal_code && `(${lead.postal_code})`}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {showProvider && attorneyNames && (
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {attorneyNames[a.attorney_id] || a.attorney_id.slice(0, 8)}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${urg.cls}`}>
                      {urg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatRelative(a.assigned_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`${basePath}/${a.id}`}>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
