'use client'

import { useState } from 'react'
import { X, Scale } from 'lucide-react'
import { clsx } from 'clsx'
import { useCompare } from '@/components/compare/CompareProvider'
import { CompareView } from './CompareView'

function ProviderInitial({ name, index }: { name: string; index: number }) {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
  ]
  return (
    <div
      className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm',
        colors[index % colors.length],
      )}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare()
  const [showModal, setShowModal] = useState(false)

  if (compareList.length === 0) return null

  return (
    <>
      {/* Fixed bottom bar */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg',
          'transform transition-transform duration-300 ease-out',
          'md:bottom-0',
          // On mobile, account for bottom nav (~64px)
          'pb-16 md:pb-0',
        )}
        role="region"
        aria-label="Comparison bar"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Selected providers */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Scale className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {compareList.map((provider, index) => (
                  <div key={provider.id} className="flex items-center gap-1 group">
                    <ProviderInitial name={provider.name} index={index} />
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {provider.name}
                    </span>
                    <button
                      onClick={() => removeFromCompare(provider.id)}
                      className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Remove ${provider.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {compareList.length < 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                    +
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clearCompare}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
              >
                Clear
              </button>
              <button
                onClick={() => setShowModal(true)}
                disabled={compareList.length < 2}
                className={clsx(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                  compareList.length >= 2
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
              >
                <Scale className="w-4 h-4" />
                Compare ({compareList.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compare modal */}
      {showModal && (
        <CompareView onClose={() => setShowModal(false)} />
      )}
    </>
  )
}

export default CompareBar
