'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Zap, ChevronRight, Wrench } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { iconMap, dropdownVariants, type Service } from './search-data'


interface ServiceDropdownProps {
  isOpen: boolean
  filteredServices: Service[]
  query: string
  highlightedIndex: number
  onHighlight: (index: number) => void
  onSelect: (service: Service) => void
}

export function ServiceDropdown({
  isOpen,
  filteredServices,
  query,
  highlightedIndex,
  onHighlight,
  onSelect,
}: ServiceDropdownProps) {
  const reducedMotion = useReducedMotion()
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-service-item]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const handleEmergencyClick = useCallback(() => {
    router.push('/emergency')
  }, [router])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={reducedMotion ? undefined : dropdownVariants}
          initial={reducedMotion ? false : "initial"}
          animate="animate"
          exit="exit"
          transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden max-h-[420px] overflow-y-auto"
          role="listbox"
          aria-label="Available services"
        >
          {/* Emergency Banner */}
          <div className="p-3 bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="font-medium text-sm">24/7 Emergency?</span>
              <button
                type="button"
                onClick={handleEmergencyClick}
                className="ml-auto text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors backdrop-blur-sm"
              >
                Find now
                <ChevronRight className="w-3 h-3 inline ml-0.5" />
              </button>
            </div>
          </div>

          {/* Services List */}
          <div className="p-2" ref={listRef}>
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 font-medium">
              <TrendingUp className="w-3 h-3" />
              {query ? `Results for "${query}"` : 'Popular services'}
            </div>
            {filteredServices.length === 0 && (
              <div className="px-3 py-6 text-center text-slate-400 text-sm">
                No service found. Try another term.
              </div>
            )}
            {filteredServices.map((service, idx) => {
              const IconComponent = iconMap[service.icon] || Wrench
              const isHighlighted = idx === highlightedIndex
              return (
                <button
                  key={service.slug}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  data-service-item
                  onClick={() => onSelect(service)}
                  onMouseEnter={() => onHighlight(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group min-h-[48px] ${
                    isHighlighted
                      ? 'bg-blue-50 shadow-sm'
                      : 'hover:bg-blue-50/60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center shadow-sm transition-transform duration-150 ${
                    isHighlighted ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium transition-colors duration-150 ${
                      isHighlighted ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {service.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {service.searches} searches
                    </div>
                  </div>
                  {service.urgent && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      24h Emergency
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 transition-all duration-150 ${
                    isHighlighted ? 'text-blue-400 translate-x-0.5' : 'text-slate-300'
                  }`} />
                </button>
              )
            })}
          </div>

          {/* Keyboard hint */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Arrows</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Enter</kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10px]">Esc</kbd>
              close
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
