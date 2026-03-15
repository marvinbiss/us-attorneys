'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface DateRangePickerProps {
  startDate?: string
  endDate?: string
  onChange: (start: string | undefined, end: string | undefined) => void
  placeholder?: string
  presets?: { label: string; days: number }[]
}

const DEFAULT_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  placeholder = 'Select a date range',
  presets = DEFAULT_PRESETS,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingEnd, setSelectingEnd] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }
    if (startDate) {
      return `From ${formatDate(startDate)}`
    }
    return placeholder
  }

  const handlePreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)

    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
    setIsOpen(false)
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]

    if (!startDate || selectingEnd) {
      if (!startDate) {
        onChange(dateStr, undefined)
        setSelectingEnd(true)
      } else {
        // Ensure end date is after start date
        if (new Date(dateStr) < new Date(startDate)) {
          onChange(dateStr, startDate)
        } else {
          onChange(startDate, dateStr)
        }
        setSelectingEnd(false)
        setIsOpen(false)
      }
    } else {
      onChange(dateStr, undefined)
      setSelectingEnd(true)
    }
  }

  const handleClear = () => {
    onChange(undefined, undefined)
    setSelectingEnd(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < (startingDay === 0 ? 6 : startingDay - 1); i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false
    const start = new Date(startDate)
    const end = new Date(endDate)
    return date >= start && date <= end
  }

  const isSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === startDate || dateStr === endDate
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select a date range"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className={startDate ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="ml-1 text-gray-400 hover:text-gray-600"
            aria-label="Clear date range"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 right-0">
          <div className="flex gap-4">
            {/* Presets */}
            <div className="border-r border-gray-100 pr-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Presets</p>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.days}
                    onClick={() => handlePreset(preset.days)}
                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="min-w-[280px]">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="font-medium text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="w-8 h-8" />
                  }

                  const selected = isSelected(date)
                  const inRange = isInRange(date)
                  const today = isToday(date)

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateClick(date)}
                      className={`w-8 h-8 rounded text-sm transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : inRange
                          ? 'bg-blue-100 text-blue-700'
                          : today
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              {/* Selection hint */}
              {startDate && !endDate && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Select end date
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
