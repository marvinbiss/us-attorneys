'use client'

import { Heart } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  attorneyId: string
  attorneyName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { button: 'w-9 h-9 min-w-[44px] min-h-[44px]', icon: 'w-4 h-4' },
  md: { button: 'w-10 h-10 min-w-[44px] min-h-[44px]', icon: 'w-4.5 h-4.5' },
  lg: { button: 'w-11 h-11 min-w-[44px] min-h-[44px]', icon: 'w-5 h-5' },
}

export function FavoriteButton({
  attorneyId,
  attorneyName,
  size = 'md',
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [animating, setAnimating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const favorited = isFavorite(attorneyId)
  const { button: btnSize, icon: iconSize } = sizeMap[size]

  // Clear toast after 2 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const willBeFavorite = !favorited
      toggleFavorite(attorneyId)

      // Trigger bounce animation
      setAnimating(true)
      setTimeout(() => setAnimating(false), 300)

      // Show toast
      setToast(
        willBeFavorite
          ? `${attorneyName} added to favorites`
          : `${attorneyName} removed from favorites`
      )
    },
    [favorited, toggleFavorite, attorneyId, attorneyName]
  )

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          favorited ? `Remove ${attorneyName} from favorites` : `Add ${attorneyName} to favorites`
        }
        className={cn(
          btnSize,
          'flex items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform duration-200 hover:scale-110',
          animating && 'animate-[favoriteScale_0.3s_ease-in-out]'
        )}
      >
        <Heart
          className={cn(
            iconSize,
            'transition-colors duration-200',
            favorited ? 'fill-red-500 text-red-500' : 'text-slate-600 hover:text-red-400'
          )}
        />
      </button>

      {/* Toast notification */}
      {toast && (
        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2">
          <div className="animate-[toastFadeIn_0.2s_ease-out] whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
