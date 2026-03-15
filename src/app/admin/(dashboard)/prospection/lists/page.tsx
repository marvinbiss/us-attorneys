'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { Plus, List, AlertCircle } from 'lucide-react'
import type { ProspectionList, ListType } from '@/types/prospection'

export default function ListsPage() {
  const [lists, setLists] = useState<ProspectionList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | ListType>('all')

  const fetchLists = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/prospection/lists', { signal })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message || `Error ${res.status}`)
        return
      }
      const data = await res.json()
      if (data.success) {
        setLists(data.data)
      } else {
        setError(data.error?.message || 'Unknown error')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Unable to load lists')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchLists(controller.signal)
    return () => controller.abort()
  }, [fetchLists])

  const filteredLists = typeFilter === 'all'
    ? lists
    : lists.filter((l) => l.list_type === typeFilter)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-gray-500 mt-1">Gestion des listes</p>
        </div>
        <Link
          href="/admin/prospection/lists/create"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Nouvelle liste
        </Link>
      </div>

      <ProspectionNav />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'static', 'dynamic'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${typeFilter === t ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            {t === 'all' ? 'Toutes' : t === 'static' ? 'Statiques' : 'Dynamiques'}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm" aria-label="Liste des listes de contacts">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
              <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Contacts</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Cr&eacute;&eacute;e le</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filteredLists.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  {lists.length === 0
                    ? 'No lists. Create your first contact list.'
                    : 'No lists for this filter.'}
                </td>
              </tr>
            ) : (
              filteredLists.map((list) => (
                <tr key={list.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/prospection/lists/${list.id}`} className="font-medium text-blue-600 hover:underline">
                      {list.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      list.list_type === 'static' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {list.list_type === 'static' ? 'Statique' : 'Dynamique'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{list.contact_count.toLocaleString('en-US')}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{list.description || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(list.created_at).toLocaleDateString('en-US')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
