'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'sa_favorites'
const FAVORITES_EVENT = 'sa_favorites_changed'

function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeFavorites(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    // Dispatch custom event so other components/tabs stay in sync
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: ids }))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    setFavorites(readFavorites())
  }, [])

  // Listen for changes from other components or tabs
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<string[]>).detail
      setFavorites(detail)
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFavorites(readFavorites())
      }
    }

    window.addEventListener(FAVORITES_EVENT, handleCustomEvent)
    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleCustomEvent)
      window.removeEventListener('storage', handleStorageEvent)
    }
  }, [])

  const isFavorite = useCallback(
    (attorneyId: string) => favorites.includes(attorneyId),
    [favorites],
  )

  const toggleFavorite = useCallback((attorneyId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(attorneyId)
        ? prev.filter((id) => id !== attorneyId)
        : [...prev, attorneyId]
      writeFavorites(next)
      return next
    })
  }, [])

  const clearFavorites = useCallback(() => {
    setFavorites([])
    writeFavorites([])
  }, [])

  return {
    favorites,
    count: favorites.length,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  }
}
