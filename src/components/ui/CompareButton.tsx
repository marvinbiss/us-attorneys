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
        size === 'sm' && 'px-2.5 py-1.5 text-xs',
        size === 'md' && 'px-3 py-2 text-sm',
        active
          ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300',
        className,
      )}
      aria-label={active ? `Remove ${provider.name} from comparison` : `Add ${provider.name} to comparison`}
      aria-pressed={active}
    >
      <Scale className={clsx('flex-shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      <span>{active ? 'Added' : 'Compare'}</span>
    </button>
  )
}

export default CompareButton
