'use client'

import { Scale } from 'lucide-react'
import { clsx } from 'clsx'
import { useCompare } from '@/components/compare/CompareProvider'
import type { CompareProvider } from '@/components/compare/CompareProvider'

interface CompareButtonProps {
  provider: CompareProvider
  size?: 'sm' | 'md'
  className?: string
}

export function CompareButton({ provider, size = 'sm', className }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare()
  const active = isInCompare(provider.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (active) {
      removeFromCompare(provider.id)
    } else {
      addToCompare(provider)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        size === 'sm' && 'min-h-[44px] min-w-[44px] px-3 py-2 text-xs',
        size === 'md' && 'min-h-[44px] min-w-[44px] px-3.5 py-2.5 text-sm',
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700',
        className
      )}
      aria-label={
        active ? `Remove ${provider.name} from comparison` : `Add ${provider.name} to comparison`
      }
      aria-pressed={active}
    >
      <Scale className={clsx('flex-shrink-0', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      <span>{active ? 'Added' : 'Compare'}</span>
    </button>
  )
}

export default CompareButton
