'use client'

import { useEffect, useState, useCallback, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ContactTypeBadge } from '@/components/admin/prospection/StatsCards'
import { ArrowLeft, Trash2, Save, UserPlus, AlertCircle, X } from 'lucide-react'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'
import type { ProspectionList, ProspectionContact } from '@/types/prospection'

interface MemberRow {
  list_id: string
  contact_id: string
  added_at: string
  contact: ProspectionContact
}

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [list, setList] = useState<ProspectionList | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMembers, setTotalMembers] = useState(0)

  // Inline editing
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Remove member confirmation
  const [removeMemberModal, setRemoveMemberModal] = useState<{ open: boolean; contactId: string; contactName: string }>({
    open: false,
    contactId: '',
    contactName: '',
  })

  const fetchList = useCallback(async (signal?: AbortSignal) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospection/lists/${id}`, { signal })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error?.message || `Error ${res.status}`)
        return
      }
      const data = await res.json()
      if (data.success && data.data) {
        setList(data.data)
        setEditName(data.data.name)
        setEditDesc(data.data.description || '')
      } else {
        setError(data.error?.message || 'List not found')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Unable to load list')
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchMembers = useCallback(async (signal?: AbortSignal) => {
    setMembersLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      const res = await fetch(`/api/admin/prospection/lists/${id}/members?${params}`, { signal })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setMembers(data.data ?? [])
        setTotalPages(data.pagination?.totalPages ?? 1)
        setTotalMembers(data.pagination?.total ?? 0)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      // Members load failure is non-critical
    } finally {
      setMembersLoading(false)
    }
  }, [id, page])

  useEffect(() => {
    const controller = new AbortController()
    fetchList(controller.signal)
    return () => controller.abort()
  }, [fetchList])

  useEffect(() => {
    if (list && list.list_type === 'static') {
      const controller = new AbortController()
      fetchMembers(controller.signal)
      return () => controller.abort()
    }
  }, [list, fetchMembers])

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    setSavingEdit(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/prospection/lists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Error updating list')
        return
      }
      const data = await res.json()
      if (data.success) {
        setList(data.data)
        setEditingName(false)
      } else {
        setActionError(data.error?.message || 'Error')
      }
    } catch {
      setActionError('Unable to save changes')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/prospection/lists/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Error deleting list')
        setDeleting(false)
        return
      }
      const data = await res.json()
      if (data.success) {
        router.push('/admin/prospection/lists')
      } else {
        setActionError(data.error?.message || 'Error')
        setDeleting(false)
      }
    } catch {
      setActionError('Unable to delete list')
      setDeleting(false)
    }
  }

  const handleRemoveMember = async (contactId: string) => {
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/prospection/lists/${id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_ids: [contactId] }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setActionError(data?.error?.message || 'Error removing contact')
        return
      }
      const data = await res.json()
      if (data.success) {
        fetchMembers()
        fetchList()
      }
    } catch {
      setActionError('Unable to remove contact')
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prospection</h1>
        <ProspectionNav />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/admin/prospection/lists" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to lists
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
        </div>
        <ProspectionNav />
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || 'List not found'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/lists" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to lists
        </Link>

        {editingName ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              aria-label="List name"
              className="text-2xl font-bold text-gray-900 border rounded-lg px-2 py-1 w-full max-w-md"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              placeholder="Description..."
              aria-label="List description"
              className="w-full max-w-md px-3 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-3 h-3" /> {savingEdit ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => { setEditingName(false); setEditName(list.name); setEditDesc(list.description || '') }}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
              onClick={() => setEditingName(true)}
              title="Click to edit"
            >
              {list.name}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              list.list_type === 'static' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {list.list_type === 'static' ? 'Static' : 'Dynamic'}
            </span>
            <span className="text-sm text-gray-500">{list.contact_count.toLocaleString('en-US')} contacts</span>
          </div>
        )}

        {!editingName && list.description && (
          <p className="text-gray-500 mt-1 text-sm">{list.description}</p>
        )}
      </div>

      <ProspectionNav />

      {actionError && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
          <button onClick={() => setActionError(null)} aria-label="Close error message" className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        {!editingName && (
          <button
            onClick={() => setEditingName(true)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
        )}
        {list.list_type === 'static' && (
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-gray-600"
            title="Coming soon"
            disabled
          >
            <UserPlus className="w-3 h-3" /> Add contacts
          </button>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-600 ml-auto"
        >
          <Trash2 className="w-3 h-3" /> Delete list
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 mb-3">
            Are you sure you want to delete the list &laquo; {list.name} &raquo;? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Confirm deletion'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dynamic filter info */}
      {list.list_type === 'dynamic' && list.filter_criteria && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-blue-700 mb-2">Dynamic filter criteria</h3>
          <div className="flex flex-wrap gap-2">
            {list.filter_criteria.contact_type && (
              <span className="text-xs px-2 py-1 bg-white rounded border">
                Type: {list.filter_criteria.contact_type}
              </span>
            )}
            {list.filter_criteria.department && (
              <span className="text-xs px-2 py-1 bg-white rounded border">
                State: {list.filter_criteria.department}
              </span>
            )}
            {list.filter_criteria.region && (
              <span className="text-xs px-2 py-1 bg-white rounded border">
                Region: {list.filter_criteria.region}
              </span>
            )}
            {list.filter_criteria.city && (
              <span className="text-xs px-2 py-1 bg-white rounded border">
                City: {list.filter_criteria.city}
              </span>
            )}
            {list.filter_criteria.source && (
              <span className="text-xs px-2 py-1 bg-white rounded border">
                Source: {list.filter_criteria.source}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Members table (static lists only) */}
      {list.list_type === 'static' && (
        <>
          <p className="text-sm text-gray-500 mb-3">{totalMembers.toLocaleString('en-US')} members</p>

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm" aria-label="List members">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                  <th scope="col" className="text-left px-4 py-3 font-medium text-gray-500">Added on</th>
                  <th scope="col" className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {membersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No members in this list.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.contact_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/prospection/contacts/${member.contact_id}`} className="font-medium text-blue-600 hover:underline">
                          {member.contact?.contact_name || member.contact?.company_name || '-'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {member.contact?.contact_type && <ContactTypeBadge type={member.contact.contact_type} />}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{member.contact?.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{member.contact?.phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(member.added_at).toLocaleDateString('en-US')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setRemoveMemberModal({
                            open: true,
                            contactId: member.contact_id,
                            contactName: member.contact?.contact_name || member.contact?.company_name || 'this contact',
                          })}
                          className="text-red-500 hover:text-red-700 text-xs"
                          title="Remove from list"
                          aria-label={`Remove ${member.contact?.contact_name || member.contact?.company_name || 'this contact'} from list`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
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
        </>
      )}

      <ConfirmationModal
        isOpen={removeMemberModal.open}
        onClose={() => setRemoveMemberModal({ open: false, contactId: '', contactName: '' })}
        onConfirm={() => { setRemoveMemberModal({ open: false, contactId: '', contactName: '' }); handleRemoveMember(removeMemberModal.contactId) }}
        title="Remove contact"
        message={`Are you sure you want to remove "${removeMemberModal.contactName}" from the list?`}
        confirmText="Remove"
        variant="warning"
      />
    </div>
  )
}
