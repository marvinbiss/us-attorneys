'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ContactTypeBadge } from '@/components/admin/prospection/StatsCards'
import { Upload, Plus, Search, Users, AlertCircle } from 'lucide-react'
import type { ProspectionContact } from '@/types/prospection'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ProspectionContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search input
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 300)
  }

  const fetchContacts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        type: typeFilter,
        search: debouncedSearch,
      })
      const res = await fetch(`/api/admin/prospection/contacts?${params}`, { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setContacts(data.data)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, debouncedSearch])

  useEffect(() => {
    const controller = new AbortController()
    fetchContacts(controller.signal)
    return () => controller.abort()
  }, [fetchContacts])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-gray-500 mt-1">Contact management</p>
        </div>
        <div className="flex gap-2">
          <button disabled title="Feature not available" className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg opacity-50 cursor-not-allowed">
            <Users className="w-4 h-4" /> Sync attorneys
          </button>
          <Link href="/admin/prospection/contacts/import" className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Upload className="w-4 h-4" /> Import CSV
          </Link>
        </div>
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search by name, email, city"
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          aria-label="Filter by contact type"
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="attorney">Attorneys</option>
          <option value="client">Clients</option>
          <option value="municipality">Municipalities</option>
        </select>
      </div>

      {/* Total */}
      <p className="text-sm text-gray-500 mb-3">{total.toLocaleString('en-US')} contacts</p>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm" aria-label="Prospection contacts list">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">City</th>
              <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No contacts. Import a CSV to get started.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/prospection/contacts/${contact.id}`} className="font-medium text-blue-600 hover:underline">
                      {contact.contact_name || contact.company_name || '-'}
                    </Link>
                    {contact.company_name && contact.contact_name && (
                      <div className="text-xs text-gray-400">{contact.company_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><ContactTypeBadge type={contact.contact_type} /></td>
                  <td className="px-4 py-3 text-gray-600">{contact.email || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.phone || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.city || '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{contact.source}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
