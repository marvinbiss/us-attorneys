'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RadiusSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

const PRESETS = [5, 10, 25, 50, 100]

export function RadiusSlider({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  className,
}: RadiusSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              value === preset
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {preset} mi
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">{min} mi</span>
          <div className="flex items-center gap-1 font-medium text-blue-600">
            <MapPin className="w-4 h-4" />
            {value} mi
          </div>
          <span className="text-gray-500 dark:text-gray-400">{max} mi</span>
        </div>

        <div className="relative h-2">
          {/* Track background */}
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />

          {/* Filled track */}
          <div
            className="absolute inset-y-0 left-0 bg-blue-600 rounded-full"
            style={{ width: `${percentage}%` }}
          />

          {/* Input range */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {/* Thumb */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow transition-transform',
              isDragging && 'scale-125'
            )}
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        </div>

        {/* Radius visualization */}
        <div className="flex justify-center pt-4">
          <div className="relative">
            <div
              className={cn(
                'rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 transition-all',
              )}
              style={{
                width: `${Math.min(150, value * 1.5)}px`,
                height: `${Math.min(150, value * 1.5)}px`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadiusSlider
