'use client'

import { useState } from 'react'
import {
  Loader2,
  AlertCircle,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'

interface AuditLog {
  id: string
  action: string
  user_id: string | null
  resource_type: string | null
  resource_id: string | null
  new_value: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const actionLabels: Record<string, string> = {
  'create_provider': 'Cr\u00e9ation artisan',
  'update_provider': 'Modification artisan',
  'delete_provider': 'Suppression artisan',
  'create_review': 'Cr\u00e9ation avis',
  'update_review': 'Modification avis',
  'delete_review': 'Suppression avis',
  'ban_user': 'Bannissement utilisateur',
  'unban_user': 'D\u00e9bannissement utilisateur',
  'create_service': 'Cr\u00e9ation service',
  'update_service': 'Modification service',
  'delete_service': 'Suppression service',
  'create_user': 'Cr\u00e9ation utilisateur',
  'update_user': 'Modification utilisateur',
  'delete_user': 'Suppression utilisateur',
  'verify_provider': 'V\u00e9rification artisan',
  'suspend_provider': 'Suspension artisan',
  'activate_provider': 'R\u00e9activation artisan',
  'resolve_report': 'R\u00e9solution signalement',
  'dismiss_report': 'Rejet signalement',
  'update_settings': 'Modification param\u00e8tres',
}

interface JournalResponse {
  logs: AuditLog[]
  total: number
}

export default function AdminJournalPage() {
  const [page, setPage] = useState(1)
  const pageSize = 50

  const { data, isLoading, error, mutate } = useAdminFetch<JournalResponse>(
    `/api/admin/journal?page=${page}`
  )

  const logs = data?.logs || []
  const total = data?.total || 0

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const actionColor = (action: string) => {
    if (action.includes('create') || action.includes('insert')) return 'text-green-700 bg-green-100'
    if (action.includes('update') || action.includes('edit')) return 'text-blue-700 bg-blue-100'
    if (action.includes('delete') || action.includes('remove')) return 'text-red-700 bg-red-100'
    if (action.includes('dispatch') || action.includes('assign')) return 'text-blue-700 bg-blue-100'
    if (action.includes('verify') || action.includes('approve')) return 'text-green-700 bg-green-100'
    return 'text-gray-700 bg-gray-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-gray-400" />
              Journal Admin
            </h1>
            <p className="text-gray-500 mt-1">
              Journal immuable — {total} entrées au total
            </p>
          </div>
          <button
            onClick={() => mutate()}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Rafraîchir
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune entrée dans le journal</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] sm:min-w-[700px] text-sm" aria-label="Journal des actions administrateur">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th scope="col" className="px-4 py-3 font-medium">Date</th>
                      <th scope="col" className="px-4 py-3 font-medium">Action</th>
                      <th scope="col" className="px-4 py-3 font-medium">Ressource</th>
                      <th scope="col" className="px-4 py-3 font-medium">Admin</th>
                      <th scope="col" className="px-4 py-3 font-medium">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(log.created_at).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {log.resource_type && (
                            <span>
                              {log.resource_type}
                              {log.resource_id && (
                                <span className="text-gray-400 ml-1">
                                  ({log.resource_id.slice(0, 8)}...)
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {log.user_id ? log.user_id.slice(0, 8) + '...' : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                          {log.new_value
                            ? JSON.stringify(log.new_value).slice(0, 80)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Préc.
                </button>
                <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border disabled:opacity-40"
                >
                  Suiv. <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
