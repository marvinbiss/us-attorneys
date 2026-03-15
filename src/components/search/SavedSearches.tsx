'use client'

import { useState } from 'react'
import {
  Bell,
  BellOff,
  Trash2,
  MapPin,
  Briefcase,
  Plus,
  Check,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavedSearch {
  id: string
  name: string
  query?: string
  filters: {
    service?: string
    location?: string
    radius?: number
    minRating?: number
    maxPrice?: number
  }
  frequency: 'instant' | 'daily' | 'weekly' | 'never'
  newResultsCount: number
  lastChecked: string
  createdAt: string
}

interface SavedSearchesProps {
  searches: SavedSearch[]
  onSearch: (search: SavedSearch) => void
  onDelete: (id: string) => void
  onUpdateFrequency: (id: string, frequency: SavedSearch['frequency']) => void
  onCreateNew?: () => void
  className?: string
}

const FREQUENCY_OPTIONS: { value: SavedSearch['frequency']; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
]

export function SavedSearches({
  searches,
  onSearch,
  onDelete,
  onUpdateFrequency,
  onCreateNew,
  className,
}: SavedSearchesProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getFrequencyIcon = (frequency: SavedSearch['frequency']) => {
    return frequency === 'never' ? BellOff : Bell
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Saved searches
        </h3>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            New alert
          </button>
        )}
      </div>

      {searches.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No saved searches
          </p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create an alert
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {searches.map((search) => {
            const FrequencyIcon = getFrequencyIcon(search.frequency)
            const isEditing = editingId === search.id

            return (
              <li key={search.id} className="p-4">
                <div className="flex items-start gap-3">
                  {/* Click to search */}
                  <button
                    onClick={() => onSearch(search)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {search.name}
                      </span>
                      {search.newResultsCount > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                          +{search.newResultsCount}
                        </span>
                      )}
                    </div>

                    {/* Filters summary */}
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {search.filters.service && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {search.filters.service}
                        </span>
                      )}
                      {search.filters.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {search.filters.location}
                          {search.filters.radius && ` (${search.filters.radius}km)`}
                        </span>
                      )}
                    </div>

                    {/* Last checked */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      Checked on {formatDate(search.lastChecked)}
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Frequency dropdown */}
                    {isEditing ? (
                      <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                        {FREQUENCY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              onUpdateFrequency(search.id, option.value)
                              setEditingId(null)
                            }}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1 rounded text-sm',
                              search.frequency === option.value
                                ? 'bg-blue-100 text-blue-700'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                            )}
                          >
                            {search.frequency === option.value && (
                              <Check className="w-3 h-3" />
                            )}
                            {option.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditingId(null)}
                          className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingId(search.id)}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            search.frequency !== 'never'
                              ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                          title="Edit alerts"
                        >
                          <FrequencyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(search.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default SavedSearches
