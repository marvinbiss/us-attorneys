'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Zap, TrendingUp, Database } from 'lucide-react'

interface MapPerformanceIndicatorProps {
  cacheStats?: {
    hits: number
    misses: number
    size: number
    hitRate: number
  }
  responseTime?: number
  resultsCount?: number
  show?: boolean
}

/**
 * World-class performance indicator for map searches
 * Shows cache hit rate, response time, and results count
 */
export default function MapPerformanceIndicator({
  cacheStats,
  responseTime,
  resultsCount,
  show = false
}: MapPerformanceIndicatorProps) {
  const reducedMotion = useReducedMotion()
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setIsVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [show, cacheStats, responseTime, resultsCount])

  if (!cacheStats && !responseTime && !resultsCount) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
          className="absolute top-20 right-4 z-20 bg-white rounded-xl shadow-lg p-3 min-w-[200px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Performance</span>
          </div>

          <div className="space-y-2">
            {/* Response Time */}
            {responseTime !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Response time
                </span>
                <span className={`font-medium ${
                  responseTime < 500 ? 'text-green-600' : 
                  responseTime < 1000 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {responseTime}ms
                </span>
              </div>
            )}

            {/* Cache Hit Rate */}
            {cacheStats && cacheStats.hits + cacheStats.misses > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Cache
                </span>
                <span className={`font-medium ${
                  cacheStats.hitRate > 70 ? 'text-green-600' : 
                  cacheStats.hitRate > 40 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {cacheStats.hitRate.toFixed(0)}%
                </span>
              </div>
            )}

            {/* Results Count */}
            {resultsCount !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Results</span>
                <span className="font-medium text-blue-600">{resultsCount}</span>
              </div>
            )}
          </div>

          {/* Performance Bar */}
          {responseTime !== undefined && (
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={reducedMotion ? false : { width: 0 }}
                animate={{
                  width: `${Math.min(100, (1000 - responseTime) / 10)}%`
                }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
                className={`h-full ${
                  responseTime < 500 ? 'bg-green-500' : 
                  responseTime < 1000 ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
