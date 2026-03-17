'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { X, Sparkles } from 'lucide-react'

interface GreetingBubbleProps {
  message: string
  priceTeaser?: string
  onOpen: () => void
  onDismiss: () => void
}

export const GreetingBubble = memo(function GreetingBubble({
  message,
  priceTeaser,
  onOpen,
  onDismiss,
}: GreetingBubbleProps) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 25 }}
      className="relative max-w-[260px] sm:max-w-[300px] bg-white rounded-2xl rounded-br-sm shadow-xl border border-gray-100 px-4 py-3 cursor-pointer"
      onClick={onOpen}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors shadow-sm"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p className="text-sm text-gray-800 font-medium leading-snug">
        {message}
      </p>
      {/* Price teaser */}
      {priceTeaser && (
        <p className="text-xs text-gray-500 mt-1 italic">
          {priceTeaser}
        </p>
      )}
      <div className="flex items-center mt-1.5">
        <p className="text-xs text-[#E07040] font-semibold flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Free AI estimate
        </p>
      </div>
    </motion.div>
  )
})
