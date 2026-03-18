'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Scale,
  Share2,
  Trash2,
  Plus,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompare } from '@/components/compare/CompareProvider'
import { ComparisonTable } from '@/components/compare/ComparisonTable'
import { ComparisonCard } from '@/components/compare/ComparisonCard'
import type { CompareAttorney } from '@/app/api/compare/route'

// ── Search overlay to add more attorneys ─────────────────────────────
function AddAttorneySearch({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; name: string; slug: string; address_city: string | null; address_state: string | null; is_verified: boolean | null }>>([])
  const [loading, setLoading] = useState(false)
  const { addToCompare, isInCompare, isFull } = useCompare()

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=8`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.attorneys || data.results || [])
        }
      } catch {
        // ignore abort
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by attorney name..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 outline-none text-base"
              autoFocus
            />
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No attorneys found for &quot;{query}&quot;
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-2">
              {results.map((attorney) => {
                const inCompare = isInCompare(attorney.id)
                const location = [attorney.address_city, attorney.address_state].filter(Boolean).join(', ')
                return (
                  <li key={attorney.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!inCompare && !isFull) {
                          addToCompare({
                            id: attorney.id,
                            name: attorney.name,
                            slug: attorney.slug,
                            address_city: attorney.address_city,
                            address_state: attorney.address_state,
                            is_verified: attorney.is_verified,
                          })
                        }
                      }}
                      disabled={inCompare || isFull}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                        inCompare
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : isFull
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {attorney.name}
                        </div>
                        {location && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {location}
                          </div>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs font-medium px-2.5 py-1 rounded-full',
                        inCompare
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      )}>
                        {inCompare ? 'Added' : 'Add'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page content ────────────────────────────────────────────────
function CompareAttorneysContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { compareList, removeFromCompare, clearCompare } = useCompare()

  const [attorneys, setAttorneys] = useState<CompareAttorney[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [copied, setCopied] = useState(false)

  // Get slugs from URL params OR from local compare list
  const urlIds = searchParams.get('ids')

  const fetchAttorneys = useCallback(async (slugs: string[]) => {
    if (slugs.length === 0) {
      setAttorneys([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/compare?slugs=${slugs.join(',')}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Failed to fetch attorneys')
      }
      const data = await res.json()
      setAttorneys(data.attorneys || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch attorneys from URL params on initial load
  useEffect(() => {
    if (urlIds) {
      const slugs = urlIds.split(',').filter(Boolean).slice(0, 4)
      fetchAttorneys(slugs)
    } else if (compareList.length > 0) {
      const slugs = compareList.map((p) => p.slug)
      fetchAttorneys(slugs)
    } else {
      setLoading(false)
    }
  }, [urlIds, fetchAttorneys]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when compareList changes and no URL params
  useEffect(() => {
    if (!urlIds && compareList.length > 0) {
      const slugs = compareList.map((p) => p.slug)
      fetchAttorneys(slugs)
    } else if (!urlIds && compareList.length === 0) {
      setAttorneys([])
    }
  }, [compareList, urlIds, fetchAttorneys])

  const handleRemove = (slug: string) => {
    // Find by slug in the attorneys array to get the ID for context removal
    const attorney = attorneys.find((a) => a.slug === slug)
    if (attorney) {
      removeFromCompare(attorney.id)
    }
    // Remove from local display
    setAttorneys((prev) => prev.filter((a) => a.slug !== slug))

    // Update URL if present
    if (urlIds) {
      const remaining = urlIds.split(',').filter((s) => s !== slug)
      if (remaining.length > 0) {
        router.replace(`/compare-attorneys?ids=${remaining.join(',')}`, { scroll: false })
      } else {
        router.replace('/compare-attorneys', { scroll: false })
      }
    }
  }

  const handleShare = async () => {
    const slugs = attorneys.map((a) => a.slug).join(',')
    const url = `${window.location.origin}/compare-attorneys?ids=${slugs}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Attorney Comparison - US Attorneys',
          text: `Compare ${attorneys.map((a) => a.name).join(' vs ')}`,
          url,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleClearAll = () => {
    clearCompare()
    setAttorneys([])
    router.replace('/compare-attorneys', { scroll: false })
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">Compare Attorneys</span>
            </div>
          </div>
        </div>

        {/* Title bar */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Scale className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-heading">
                    Compare Attorneys
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {attorneys.length > 0
                      ? `Comparing ${attorneys.length} attorney${attorneys.length !== 1 ? 's' : ''} side by side`
                      : 'Add attorneys to start comparing'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {attorneys.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Share'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear all
                    </button>
                  </>
                )}
                {attorneys.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setShowSearch(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add attorney
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading attorney data...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Failed to load comparison
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
                {error}
              </p>
              <Link
                href="/practice-areas"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Browse attorneys
              </Link>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Desktop: full comparison table */}
              <div className="hidden md:block">
                <ComparisonTable attorneys={attorneys} onRemove={handleRemove} />
              </div>
              {/* Mobile: swipeable card view */}
              <div className="md:hidden">
                <ComparisonCard attorneys={attorneys} onRemove={handleRemove} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add attorney search overlay */}
      <AddAttorneySearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </>
  )
}

// ── Page wrapper with Suspense for useSearchParams ───────────────────
export default function CompareAttorneysPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <CompareAttorneysContent />
    </Suspense>
  )
}
