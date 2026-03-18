'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LucideIcon, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface OnboardingStepProps {
  stepNumber: number
  totalSteps: number
  title: string
  description: string
  icon: LucideIcon
  children: ReactNode
  onNext: () => void
  onBack?: () => void
  onSkip?: () => void
  isFirst?: boolean
  isLast?: boolean
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
  skippable?: boolean
  direction?: 'forward' | 'backward'
}

const stepVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -60 : 60,
    opacity: 0,
  }),
}

export default function OnboardingStep({
  stepNumber,
  totalSteps: _totalSteps,
  title,
  description,
  icon: Icon,
  children,
  onNext,
  onBack,
  onSkip,
  isFirst = false,
  isLast = false,
  nextLabel,
  nextDisabled = false,
  nextLoading = false,
  skippable = false,
  direction = 'forward',
}: OnboardingStepProps) {
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepNumber}
        custom={direction}
        variants={reducedMotion ? undefined : stepVariants}
        initial={reducedMotion ? false : 'enter'}
        animate="center"
        exit={reducedMotion ? undefined : 'exit'}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
        className="w-full"
      >
        {/* Step header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
            <Icon className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            {description}
          </p>
        </div>

        {/* Step content */}
        <div className="mb-8">
          {children}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            {!isFirst && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {skippable && onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
              >
                <SkipForward className="w-4 h-4" aria-hidden="true" />
                Skip for now
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || nextLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {nextLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {nextLabel || (isLast ? 'Complete Setup' : 'Continue')}
                  {!isLast && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
