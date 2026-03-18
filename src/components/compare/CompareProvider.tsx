'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

const MAX_COMPARE = 4
const STORAGE_KEY = 'us-attorneys-compare'

export interface CompareProvider {
  id: string
  name: string
  slug: string
  stable_id?: string
  specialty?: string
  specialty_name?: string | null
  address_city?: string | null
  address_state?: string | null
  address_zip?: string
  is_verified?: boolean | null
  rating_average?: number | null
  review_count?: number | null
  phone?: string | null
  bar_number?: string | null
  years_experience?: number | null
  consultation_fee?: number | null
  languages?: string[] | null
  response_time_hours?: number | null
  practice_areas?: { slug: string; name: string }[] | null
  distance_miles?: number | null
}

interface CompareContextType {
  compareList: CompareProvider[]
  addToCompare: (provider: CompareProvider) => void
  removeFromCompare: (attorneyId: string) => void
  isInCompare: (attorneyId: string) => boolean
  clearCompare: () => void
  getCompareUrl: () => string
  count: number
  isFull: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProviderWrapper({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<CompareProvider[]>([])
  const { toasts, removeToast, warning, success, info } = useToast()

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CompareProvider[]
        if (Array.isArray(parsed)) {
          setCompareList(parsed.slice(0, MAX_COMPARE))
        }
      }
    } catch {
      // ignore corrupt data
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList))
    } catch {
      // ignore storage errors
    }
  }, [compareList])

  const addToCompare = useCallback(
    (provider: CompareProvider) => {
      setCompareList((prev) => {
        if (prev.some((p) => p.id === provider.id)) return prev
        if (prev.length >= MAX_COMPARE) {
          setTimeout(() => warning(`Maximum ${MAX_COMPARE} attorneys to compare`), 0)
          return prev
        }
        setTimeout(() => success(`${provider.name} added to comparison`), 0)
        return [...prev, provider]
      })
    },
    [warning, success],
  )

  const removeFromCompare = useCallback((attorneyId: string) => {
    setCompareList((prev) => {
      const removed = prev.find((p) => p.id === attorneyId)
      if (removed) {
        setTimeout(() => info(`${removed.name} removed from comparison`), 0)
      }
      return prev.filter((p) => p.id !== attorneyId)
    })
  }, [info])

  const isInCompare = useCallback(
    (attorneyId: string) => compareList.some((p) => p.id === attorneyId),
    [compareList],
  )

  const clearCompare = useCallback(() => {
    setCompareList([])
  }, [])

  const getCompareUrl = useCallback(() => {
    const slugs = compareList.map((p) => p.slug).join(',')
    return `/compare-attorneys?ids=${slugs}`
  }, [compareList])

  const value = useMemo(
    () => ({
      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
      getCompareUrl,
      count: compareList.length,
      isFull: compareList.length >= MAX_COMPARE,
    }),
    [compareList, addToCompare, removeFromCompare, isInCompare, clearCompare, getCompareUrl],
  )

  return (
    <CompareContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </CompareContext.Provider>
  )
}

const noopContext: CompareContextType = {
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  isInCompare: () => false,
  clearCompare: () => {},
  getCompareUrl: () => '/compare-attorneys',
  count: 0,
  isFull: false,
}

export function useCompare() {
  const context = useContext(CompareContext)
  // Return noop context during SSR or if provider is not yet mounted
  if (context === undefined) return noopContext
  return context
}
