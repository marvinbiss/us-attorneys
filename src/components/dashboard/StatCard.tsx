'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; isPositive: boolean }
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'indigo' | 'purple' | 'gray'
  delay?: number
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600',
}

function AnimatedValue({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) => Math.round(v).toLocaleString('en-US'))

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

export function StatCard({ title, value, subtitle, trend, icon, color = 'blue', delay = 0 }: StatCardProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { delay, duration: 0.3, ease: 'easeOut' }}
      whileHover={reducedMotion ? undefined : { y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
    >
      <div className="bg-white rounded-xl border border-gray-200 p-5 transition-shadow">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.isPositive
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {typeof value === 'number' ? <AnimatedValue value={value} reducedMotion={reducedMotion} /> : value}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  )
}
