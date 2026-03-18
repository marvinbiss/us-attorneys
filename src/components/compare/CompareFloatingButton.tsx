'use client'

import { useRouter } from 'next/navigation'
import { Scale, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompare } from '@/components/compare/CompareProvider'

/**
 * Floating "Compare (N)" button shown when 2+ attorneys are in the comparison list.
 * Clicking navigates to the /compare-attorneys page with selected attorney slugs.
 * Rendered globally (typically in layout) -- only visible when needed.
 */
export function CompareFloatingButton() {
  const { compareList, count, clearCompare, getCompareUrl } = useCompare()
  const router = useRouter()

  if (count < 2) return null

  const handleCompare = () => {
    router.push(getCompareUrl())
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50',
        'flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in duration-300'
      )}
    >
      {/* Clear button */}
      <button
        type="button"
        onClick={clearCompare}
        className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all"
        aria-label="Clear comparison list"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Compare button */}
      <button
        type="button"
        onClick={handleCompare}
        className={cn(
          'flex items-center gap-2 px-5 py-3 rounded-full shadow-xl',
          'bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm',
          'transition-all hover:shadow-2xl hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
        )}
        aria-label={`Compare ${count} attorneys`}
      >
        <Scale className="w-5 h-5" />
        <span>Compare ({count})</span>
        {/* Mini avatars */}
        <div className="flex -space-x-2 ml-1">
          {compareList.slice(0, 3).map((p) => {
            const initials = p.name
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()
            return (
              <div
                key={p.id}
                className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold"
                title={p.name}
              >
                {initials}
              </div>
            )
          })}
          {count > 3 && (
            <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold">
              +{count - 3}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

export default CompareFloatingButton
