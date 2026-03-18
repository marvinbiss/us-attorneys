'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { ConsultationRequestFlow } from './ConsultationRequestFlow'
import type { ConsultationAttorney } from './ConsultationRequestFlow'

interface ConsultationModalProps {
  isOpen: boolean
  onClose: () => void
  attorney: ConsultationAttorney
}

/**
 * Modal wrapper for the 3-step consultation request flow.
 * Mobile: full-screen overlay. Desktop: centered modal.
 * Accessible: focus trap, Escape to close, aria attributes.
 */
export function ConsultationModal({ isOpen, onClose, attorney }: ConsultationModalProps) {
  const reducedMotion = useReducedMotion()
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Focus the modal container when it opens
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timer = setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea'
        )
        firstFocusable?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Click outside backdrop
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const backdropVariants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 },
      }

  const modalVariants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.98 },
      }

  // Mobile: full-screen slide up
  const mobileVariants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: '100%' },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
      }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label={`Request consultation with ${attorney.name}`}
        >
          {/* Desktop modal */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="hidden sm:flex flex-col w-full max-w-lg max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close consultation modal"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            <ConsultationRequestFlow
              attorney={attorney}
              onClose={onClose}
              className="shadow-2xl max-h-[90vh] overflow-y-auto"
            />
          </motion.div>

          {/* Mobile full-screen */}
          <motion.div
            ref={!modalRef.current ? modalRef : undefined}
            variants={mobileVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: reducedMotion ? 0 : 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="sm:hidden flex flex-col w-full h-full bg-white dark:bg-gray-800 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile close bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Consultation Request
              </span>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ConsultationRequestFlow
                attorney={attorney}
                onClose={onClose}
                className="rounded-none shadow-none min-h-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
