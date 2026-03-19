'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import {
  Users,
  Plus,
  X,
  Mail,
  Phone,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
} from 'lucide-react'
import { z } from 'zod'

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  role: z.string().min(1, 'Role is required'),
  phone: z.string().optional(),
  color: z.string().optional(),
})

interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  color: string
  avatar_url?: string
  is_active: boolean
  created_at: string
}

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
]

export default function TeamPage() {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    color: COLORS[0].value,
  })

  // Fetch team members via API route
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/attorney/team')

        if (res.status === 401) {
          router.push('/login')
          return
        }

        if (res.status === 403) {
          router.push('/attorney-dashboard')
          return
        }

        if (!res.ok) {
          setError('Unable to load team')
          setIsLoading(false)
          return
        }

        const data = await res.json()
        setMembers(data.members ?? [])
      } catch (err: unknown) {
        logger.error('Error fetching team', err)
        setError('Unable to load team')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Add or update team member
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSaving(true)
    setError(null)
    setValidationErrors({})

    // Client-side Zod validation
    const result = teamMemberSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setValidationErrors(fieldErrors)
      setIsSaving(false)
      return
    }

    try {
      if (editingMember) {
        // Update existing member
        const res = await fetch(`/api/attorney/team/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            role: formData.role,
            color: formData.color,
          }),
        })

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? 'Error updating member')
        }

        setMembers(members.map((m) => (m.id === editingMember.id ? { ...m, ...formData } : m)))
      } else {
        // Add new member
        const res = await fetch('/api/attorney/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            role: formData.role,
            color: formData.color,
          }),
        })

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? 'Error adding member')
        }

        const body = await res.json()
        setMembers([...members, body.member])
      }

      setShowAddModal(false)
      setEditingMember(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        color: COLORS[0].value,
      })
    } catch (err: unknown) {
      logger.error('Error saving member', err)
      setError('Error saving member')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete team member
  const handleDelete = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return

    try {
      const res = await fetch(`/api/attorney/team/${memberId}`, {
        method: 'DELETE',
      })

      if (!res.ok && res.status !== 204) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error deleting member')
      }

      setMembers(members.filter((m) => m.id !== memberId))
    } catch (err: unknown) {
      logger.error('Error deleting member', err)
      setError('Error deleting member')
    }
  }

  // Toggle member active status
  const toggleActive = async (member: TeamMember) => {
    try {
      const res = await fetch(`/api/attorney/team/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          color: member.color,
          is_active: !member.is_active,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Error updating member')
      }

      setMembers(members.map((m) => (m.id === member.id ? { ...m, is_active: !m.is_active } : m)))
    } catch (err: unknown) {
      logger.error('Error toggling member', err)
    }
  }

  // Open edit modal
  const openEditModal = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      color: member.color,
    })
    setShowAddModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/attorney-dashboard/calendar" className="rounded-lg p-2 hover:bg-white/10">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Team Management</h1>
              <p className="text-blue-100">Manage your team members and their availability</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Add member button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h2>
            <p className="text-sm text-gray-500">Add members to assign them availability slots</p>
          </div>
          <button
            onClick={() => {
              setEditingMember(null)
              setFormData({
                name: '',
                email: '',
                phone: '',
                role: '',
                color: COLORS[0].value,
              })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {/* Team members grid */}
        {members.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No team members yet</h3>
            <p className="mb-6 text-gray-500">Add members to assign them availability slots</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add First Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.id}
                className={`rounded-xl border-l-4 bg-white p-6 shadow-sm ${
                  member.is_active ? '' : 'opacity-60'
                }`}
                style={{ borderLeftColor: member.color }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(member)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span
                    className={`text-sm ${member.is_active ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleActive(member)}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      member.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {member.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">How it works</h4>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>1. Add your team members</li>
            <li>2. Assign them availability slots in the calendar</li>
            <li>3. Clients can choose a specific member when booking</li>
            <li>4. Each member receives their own notifications</li>
          </ul>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMember ? 'Edit Member' : 'Add Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingMember(null)
                }}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setValidationErrors((prev) => {
                      const { name: _, ...rest } = prev
                      return rest
                    })
                  }}
                  className={`w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${validationErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                  required
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setValidationErrors((prev) => {
                      const { email: _, ...rest } = prev
                      return rest
                    })
                  }}
                  className={`w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${validationErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                  required
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role / Specialty *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value })
                    setValidationErrors((prev) => {
                      const { role: _, ...rest } = prev
                      return rest
                    })
                  }}
                  placeholder="E.g.: Senior Associate, Paralegal..."
                  className={`w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${validationErrors.role ? 'border-red-400' : 'border-gray-300'}`}
                  required
                />
                {validationErrors.role && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.role}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Calendar Color
                </label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-8 w-8 rounded-full border-2 ${
                        formData.color === color.value
                          ? 'scale-110 border-gray-900'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingMember(null)
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formData.name || !formData.email || !formData.role}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingMember ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
