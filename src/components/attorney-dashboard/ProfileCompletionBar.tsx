'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  CheckCircle2,
  Circle,
  UserCircle,
  Shield,
  Scale,
  Clock,
  CreditCard,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface CompletionItem {
  key: string
  label: string
  icon: typeof UserCircle
  completed: boolean
  stepUrl: string
}

interface ProfileCompletionBarProps {
  className?: string
}

interface OnboardingProgress {
  currentStep: number
  completedAt: string | null
  profileCompletionPct: number
  stepsCompleted: Record<string, boolean>
}

export default function ProfileCompletionBar({ className = '' }: ProfileCompletionBarProps) {
  const reducedMotion = useReducedMotion()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/attorney/onboarding')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then(result => {
        if (result.success) setProgress(result.data)
      })
      .catch(() => {
        // Silently fail - don't show the bar if API unavailable
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !progress || progress.completedAt) return null

  const pct = progress.profileCompletionPct

  const items: CompletionItem[] = [
    {
      key: 'welcome',
      label: 'Welcome step',
      icon: Sparkles,
      completed: progress.stepsCompleted.welcome ?? false,
      stepUrl: '/attorney-dashboard/onboarding?step=1',
    },
    {
      key: 'bar_verification',
      label: 'Bar verification',
      icon: Shield,
      completed: progress.stepsCompleted.bar_verification ?? false,
      stepUrl: '/attorney-dashboard/onboarding?step=2',
    },
    {
      key: 'profile_basics',
      label: 'Profile basics',
      icon: UserCircle,
      completed: progress.stepsCompleted.profile_basics ?? false,
      stepUrl: '/attorney-dashboard/onboarding?step=3',
    },
    {
      key: 'practice_areas',
      label: 'Practice areas',
      icon: Scale,
      completed: progress.stepsCompleted.practice_areas ?? false,
      stepUrl: '/attorney-dashboard/onboarding?step=4',
    },
    {
      key: 'availability',
      label: 'Availability',
      icon: Clock,
      completed: progress.stepsCompleted.availability ?? false,
      stepUrl: '/attorney-dashboard/onboarding?step=5',
    },
    {
      key: 'choose_plan',
      label: 'Choose a plan',
      icon: CreditCard,
      completed: progress.stepsCompleted.choose_plan ?? false,
      stepUrl: '/attorney-dashboard/onboarding?step=6',
    },
  ]

  const completedCount = items.filter(i => i.completed).length

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Complete your profile
        </h3>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
          initial={reducedMotion ? { width: `${pct}%` } : { width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Subtitle */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {completedCount} of {items.length} steps completed
      </p>

      {/* Checklist items */}
      <ul className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.key}>
              <Link
                href={item.stepUrl}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors group ${
                  item.completed
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" aria-hidden="true" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" aria-hidden="true" />
                )}
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className={item.completed ? 'line-through' : 'font-medium'}>
                  {item.label}
                </span>
                {!item.completed && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" aria-hidden="true" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* CTA button */}
      {completedCount < items.length && (
        <Link
          href="/attorney-dashboard/onboarding"
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Continue Setup
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
