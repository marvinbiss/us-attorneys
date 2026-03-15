'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, X, ArrowRight } from 'lucide-react'

const STORAGE_KEY = 'sa:recent-searches'
const MAX_ITEMS = 5

export interface RecentSearch {
  type: 'service' | 'service-city' | 'fees' | 'emergency' | 'consultation'
  label: string
  href: string
  timestamp: number
}

/** Record a page visit for personalization */
export function recordSearch(search: Omit<RecentSearch, 'timestamp'>) {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const items: RecentSearch[] = stored ? JSON.parse(stored) : []
    // Remove duplicate by href
    const filtered = items.filter((s) => s.href !== search.href)
    // Add to front
    filtered.unshift({ ...search, timestamp: Date.now() })
    // Keep max items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)))
  } catch {}
}

export default function RecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items: RecentSearch[] = JSON.parse(stored)
        // Only show items from last 7 days
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        setSearches(items.filter((s) => s.timestamp > weekAgo).slice(0, MAX_ITEMS))
      }
    } catch {}
  }, [])

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSearches([])
  }

  if (searches.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Your recent searches</h3>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear history"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {searches.map((search) => (
          <Link
            key={search.href}
            href={search.href}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 transition-colors group"
          >
            <span className="text-sm text-gray-700 group-hover:text-blue-700">{search.label}</span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
