'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  key: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

interface FilterPanelProps {
  filters: FilterGroup[]
  values: Record<string, string | string[]>
  onChange: (key: string, value: string | string[]) => void
  onClear?: () => void
  showClearAll?: boolean
  children?: ReactNode
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onClear,
  showClearAll = true,
  children,
}: FilterPanelProps) {
  const hasActiveFilters = Object.values(values).some((v) =>
    Array.isArray(v) ? v.length > 0 : v && v !== 'all'
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4" role="search" aria-label="Filters">
      <div className="flex flex-col lg:flex-row gap-4">
        {filters.map((filter) => (
          <div key={filter.key} className="flex-shrink-0">
            {filter.multiple ? (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2">{filter.label}:</span>
                {filter.options.map((option) => {
                  const currentValues = (values[filter.key] as string[]) || []
                  const isSelected = currentValues.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const newValues = isSelected
                          ? currentValues.filter((v) => v !== option.value)
                          : [...currentValues, option.value]
                        onChange(filter.key, newValues)
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                      {option.count !== undefined && (
                        <span className="ml-1 opacity-75">({option.count})</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <select
                value={(values[filter.key] as string) || 'all'}
                onChange={(e) => onChange(filter.key, e.target.value)}
                aria-label={filter.label}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.count !== undefined && ` (${option.count})`}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        {children}

        {showClearAll && hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

// Quick filter buttons component
interface QuickFiltersProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

export function QuickFilters({ options, value, onChange }: QuickFiltersProps) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
