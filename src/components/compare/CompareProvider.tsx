'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

const MAX_COMPARE = 3

export interface CompareProvider {
  id: string
  name: string
  slug: string
  stable_id?: string
  specialty?: string
  address_city?: string
  address_region?: string
  address_postal_code?: string
  is_verified?: boolean
  rating_average?: number
  review_count?: number
  phone?: string
  siret?: string
}

interface CompareContextType {
  compareList: CompareProvider[]
  addToCompare: (provider: CompareProvider) => void
  removeFromCompare: (attorneyId: string) => void
  isInCompare: (attorneyId: string) => boolean
  clearCompare: () => void
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProviderWrapper({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<CompareProvider[]>([])
  const { toasts, removeToast, warning } = useToast()

  const addToCompare = useCallback(
    (provider: CompareProvider) => {
      setCompareList((prev) => {
        if (prev.some((p) => p.id === provider.id)) return prev
        if (prev.length >= MAX_COMPARE) {
          // Toast is scheduled after state update via setTimeout to avoid
          // calling setState (addToast) inside another setState updater
          setTimeout(() => warning('Maximum 3 attorneys to compare'), 0)
          return prev
        }
        return [...prev, provider]
      })
    },
    [warning],
  )

  const removeFromCompare = useCallback((attorneyId: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== attorneyId))
  }, [])

  const isInCompare = useCallback(
    (attorneyId: string) => compareList.some((p) => p.id === attorneyId),
    [compareList],
  )

  const clearCompare = useCallback(() => {
    setCompareList([])
  }, [])

  const value = useMemo(
    () => ({
      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
    }),
    [compareList, addToCompare, removeFromCompare, isInCompare, clearCompare],
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
}

export function useCompare() {
  const context = useContext(CompareContext)
  // Return noop context during SSR or if provider is not yet mounted
  if (context === undefined) return noopContext
  return context
}
