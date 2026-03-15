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
  sm: { button: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
  md: { button: 'w-8 h-8', icon: 'w-4 h-4' },
  lg: { button: 'w-10 h-10', icon: 'w-5 h-5' },
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
          ? `${attorneyName} ajouté aux favoris`
          : `${attorneyName} retiré des favoris`,
      )
    },
    [favorited, toggleFavorite, attorneyId, attorneyName],
  )

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          favorited
            ? `Retirer ${attorneyName} des favoris`
            : `Ajouter ${attorneyName} aux favoris`
        }
        className={cn(
          btnSize,
          'bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110',
          animating && 'animate-[favoriteScale_0.3s_ease-in-out]',
        )}
      >
        <Heart
          className={cn(
            iconSize,
            'transition-colors duration-200',
            favorited
              ? 'text-red-500 fill-red-500'
              : 'text-slate-600 hover:text-red-400',
          )}
        />
      </button>

      {/* Toast notification */}
      {toast && (
        <div className="absolute top-full right-0 mt-2 z-50 pointer-events-none">
          <div className="whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg animate-[toastFadeIn_0.2s_ease-out]">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
