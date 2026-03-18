'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type TrendDirection = 'up' | 'down' | 'flat'
export type KPIVariant = 'green' | 'red' | 'gray'

interface KPICardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: {
    direction: TrendDirection
    value: number
    label?: string
  }
  comparison?: string
  variant?: KPIVariant
  delay?: number
  format?: 'number' | 'percent' | 'decimal' | 'string'
}

const variantStyles: Record<KPIVariant, { bg: string; text: string; border: string }> = {
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-100 dark:border-green-900/50',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-900/50',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-100 dark:border-gray-700/50',
  },
}

const trendColors: Record<TrendDirection, string> = {
  up: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  down: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  flat: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const TrendIcon = ({ direction }: { direction: TrendDirection }) => {
  switch (direction) {
    case 'up':
      return <TrendingUp className="w-3 h-3" />
    case 'down':
      return <TrendingDown className="w-3 h-3" />
    case 'flat':
      return <Minus className="w-3 h-3" />
  }
}

function AnimatedNumber({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => {
    if (Number.isInteger(value)) return Math.round(v).toLocaleString('en-US')
    return v.toFixed(1)
  })

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value)
      return
    }
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: 'easeOut',
    })
    return controls.stop
  }, [motionValue, value, reducedMotion])

  return <motion.span>{display}</motion.span>
}

export function KPICard({
  icon,
  value,
  label,
  trend,
  comparison,
  variant = 'gray',
  delay = 0,
  format = 'string',
}: KPICardProps) {
  const reducedMotion = useReducedMotion()
  const styles = variantStyles[variant]

  const renderValue = () => {
    if (typeof value === 'string') return value
    if (format === 'percent') {
      return (
        <>
          <AnimatedNumber value={value} reducedMotion={reducedMotion} />%
        </>
      )
    }
    if (format === 'decimal') {
      return <AnimatedNumber value={value} reducedMotion={reducedMotion} />
    }
    return <AnimatedNumber value={value} reducedMotion={reducedMotion} />
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.35, ease: 'easeOut' }}
      whileHover={reducedMotion ? undefined : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
      className="group"
    >
      <div
        className={`relative overflow-hidden rounded-xl border p-5 transition-shadow bg-white dark:bg-gray-900 ${styles.border}`}
      >
        {/* Subtle gradient accent */}
        <div className={`absolute inset-0 opacity-[0.03] ${styles.bg}`} />

        <div className="relative">
          {/* Top row: icon + trend badge */}
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${styles.bg}`}>
              <div className={styles.text}>{icon}</div>
            </div>
            {trend && (
              <div
                className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendColors[trend.direction]}`}
              >
                <TrendIcon direction={trend.direction} />
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '' : ''}
                {trend.value}%
              </div>
            )}
          </div>

          {/* Value */}
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {renderValue()}
          </p>

          {/* Label */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>

          {/* Trend label */}
          {trend?.label && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trend.label}</p>
          )}

          {/* Comparison */}
          {comparison && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
              {comparison}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
