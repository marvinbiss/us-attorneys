'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

interface LauncherButtonProps {
  isExpanded: boolean
  shouldWiggle: boolean
  showNotification: boolean
  onClick: () => void
}

export const LauncherButton = memo(function LauncherButton({
  isExpanded,
  shouldWiggle,
  showNotification,
  onClick,
}: LauncherButtonProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={
        shouldWiggle
          ? { scale: 1, opacity: 1, rotate: [0, -6, 6, -4, 4, 0] }
          : { scale: 1, opacity: 1 }
      }
      exit={{ scale: 0, opacity: 0 }}
      transition={
        shouldWiggle
          ? { duration: 0.6, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 260, damping: 20 }
      }
      onClick={onClick}
      aria-label="Ouvrir le chat d'estimation"
      className={
        'relative flex items-center justify-center bg-[#E07040] text-white shadow-lg hover:bg-[#c9603a] focus:outline-none focus:ring-2 focus:ring-[#E07040] focus:ring-offset-2 transition-all duration-500 ' +
        (isExpanded
          ? 'h-12 rounded-full px-5 gap-2.5'
          : 'h-14 w-14 rounded-full')
      }
    >
      {/* Ping ring animation */}
      <span className="absolute inset-0 rounded-full bg-[#E07040] animate-ping opacity-20" />

      {/* Notification badge */}
      {showNotification && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
          1
        </span>
      )}

      {/* Icon */}
      <MessageCircle className={isExpanded ? 'h-5 w-5 shrink-0' : 'h-6 w-6'} />

      {/* Pill text (visible when expanded) */}
      {isExpanded && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          className="text-sm font-semibold whitespace-nowrap overflow-hidden"
        >
          Estimation gratuite
        </motion.span>
      )}
    </motion.button>
  )
})
