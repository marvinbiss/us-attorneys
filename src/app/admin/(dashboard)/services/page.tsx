'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Grid,
} from 'lucide-react'
import { ErrorBanner } from '@/components/admin/ErrorBanner'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'

interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parent_id: string | null
  is_active: boolean
  created_at: string
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Modal states
  const [editModal, setEditModal] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null,
  })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; specialtyId: string; specialtyName: string }>({
    open: false,
    specialtyId: '',
    specialtyName: '',
  })
  const [formData, setFormData] = useState({ name: '', description: '', icon: '' })

  useEffect(() => {
    fetchSpecialties()
  }, [search, showInactive])

  const fetchSpecialties = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        search,
        includeInactive: String(showInactive),
      })
      const response = await fetch(`/api/admin/services?${params}`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      } else {
        setError('Error loading services')
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const isNew = !editModal.service
      const url = isNew
        ? '/api/admin/services'
        : `/api/admin/practice-areas/${editModal.service?.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        setError(isNew ? 'Error creating service' : 'Error updating service')
      }

      setEditModal({ open: false, service: null })
      setFormData({ name: '', description: '', icon: '' })
      fetchSpecialties()
    } catch (err) {
      console.error('Failed to save service:', err)
      setError('Connection error')
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/practice-areas/${deleteModal.specialtyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        setError('Error deleting service')
      }

      setDeleteModal({ open: false, specialtyId: '', specialtyName: '' })
      fetchSpecialties()
    } catch (err) {
      console.error('Failed to delete service:', err)
      setError('Connection error')
    }
  }

  const openEditModal = (service: Service | null) => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        icon: service.icon || '',
      })
    } else {
      setFormData({ name: '', description: '', icon: '' })
    }
    setEditModal({ open: true, service })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-500 mt-1">{services.length} services</p>
          </div>
          <button
            onClick={() => openEditModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New service
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                aria-label="Search services"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show inactive</span>
            </label>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
            onRetry={fetchSpecialties}
          />
        )}

        {/* Services Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Grid className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No services found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg ${
                    service.is_active ? 'border-gray-200' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {service.icon && (
                        <span className="text-2xl">{service.icon}</span>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.slug}</p>
                      </div>
                    </div>
                    <StatusBadge variant={service.is_active ? 'success' : 'error'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </div>
                  {service.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(service)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteModal({
                        open: true,
                        specialtyId: service.id,
                        specialtyName: service.name,
                      })}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setEditModal({ open: false, service: null })} />
            <div role="dialog" aria-modal="true" aria-labelledby="edit-service-title" className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 id="edit-service-title" className="text-lg font-semibold text-gray-900 mb-4">
                {editModal.service ? 'Edit service' : 'New service'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Personal Injury"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Service description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 🔧"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditModal({ open: false, service: null })}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editModal.service ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, specialtyId: '', specialtyName: '' })}
        onConfirm={handleDelete}
        title="Delete service"
        message={`Are you sure you want to deactivate "${deleteModal.specialtyName}"?`}
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  )
}
