'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import {
  Plus,
  Image as ImageIcon,
  Video,
  Layers,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { PortfolioCard } from '@/components/portfolio'
import Button from '@/components/ui/Button'
import type { PortfolioItem, MediaType } from '@/types/portfolio'
import AddPortfolioModal from './AddPortfolioModal'
import PortfolioLightbox from './PortfolioLightbox'

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([])
  const [filter, setFilter] = useState<MediaType | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const fetchPortfolio = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/portfolio')
      const data = await response.json()

      if (response.ok) {
        setItems(data.items || [])
      } else if (response.status === 401) {
        window.location.href = '/login?redirect=/attorney-dashboard/portfolio'
        return
      } else {
        setError(data.error || 'Error loading portfolio')
      }
    } catch (err: unknown) {
      logger.error('Error fetching portfolio', err)
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  useEffect(() => {
    if (filter === 'all') {
      setFilteredItems(items)
    } else {
      setFilteredItems(items.filter((item) => item.media_type === filter))
    }
  }, [items, filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return

    try {
      const response = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        const data = await response.json()
        alert(data.error || 'Error deleting item')
      }
    } catch (err: unknown) {
      logger.error('Error deleting item', err)
      alert('Error deleting item')
    }
  }

  const handleToggleVisibility = async (item: PortfolioItem) => {
    try {
      const response = await fetch(`/api/portfolio/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: !item.is_visible }),
      })
      if (response.ok) {
        const data = await response.json()
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? data.item : i))
        )
      }
    } catch (err: unknown) {
      logger.error('Error toggling visibility', err)
    }
  }

  const handleToggleFeatured = async (item: PortfolioItem) => {
    try {
      const response = await fetch(`/api/portfolio/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !item.is_featured }),
      })
      if (response.ok) {
        const data = await response.json()
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? data.item : i))
        )
      }
    } catch (err: unknown) {
      logger.error('Error toggling featured', err)
    }
  }

  const handleItemCreated = (newItem: PortfolioItem) => {
    setItems((prev) => [newItem, ...prev])
    setShowAddModal(false)
  }

  const handleItemUpdated = (updatedItem: PortfolioItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    )
    setEditingItem(null)
  }

  const stats = {
    total: items.length,
    images: items.filter((i) => i.media_type === 'image').length,
    videos: items.filter((i) => i.media_type === 'video').length,
    beforeAfter: items.filter((i) => i.media_type === 'before_after').length,
    featured: items.filter((i) => i.is_featured).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true)
              fetchPortfolio()
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb
            items={[
              { label: 'Attorney Dashboard', href: '/attorney-dashboard' },
              { label: 'Portfolio' },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Portfolio</h1>
              <p className="text-blue-100">
                Manage your work samples and showcase your expertise
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-5 h-5" />}
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AttorneySidebar activePage="portfolio" />

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats summary */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total</span>
                  <span className="font-medium text-gray-900">{stats.total}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Images</span>
                  <span className="font-medium text-gray-900">{stats.images}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Videos</span>
                  <span className="font-medium text-gray-900">{stats.videos}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Before/After</span>
                  <span className="font-medium text-gray-900">{stats.beforeAfter}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Featured</span>
                  <span className="font-medium text-amber-600">{stats.featured}</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-500" />
              <button
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilter('image')}
                aria-pressed={filter === 'image'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Images ({stats.images})
              </button>
              <button
                onClick={() => setFilter('video')}
                aria-pressed={filter === 'video'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Video className="w-4 h-4" />
                Videos ({stats.videos})
              </button>
              <button
                onClick={() => setFilter('before_after')}
                aria-pressed={filter === 'before_after'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'before_after'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Before/After ({stats.beforeAfter})
              </button>
            </div>

            {/* Portfolio grid */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {items.length === 0
                    ? 'No portfolio items'
                    : 'No results for this filter'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {items.length === 0
                    ? 'Add your first work samples to showcase on your profile.'
                    : 'Try a different filter.'}
                </p>
                {items.length === 0 && (
                  <Button
                    variant="primary"
                    leftIcon={<Plus className="w-5 h-5" />}
                    onClick={() => setShowAddModal(true)}
                  >
                    Add First Item
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <PortfolioCard
                    key={item.id}
                    item={item}
                    showActions
                    onClick={() => setLightboxIndex(index)}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDelete(item.id)}
                    onToggleVisibility={() => handleToggleVisibility(item)}
                    onToggleFeatured={() => handleToggleFeatured(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddPortfolioModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleItemCreated}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <AddPortfolioModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onCreated={handleItemUpdated}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PortfolioLightbox
          items={filteredItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
