'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  value?: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
}

export function SearchBar({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(controlledValue || '')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChange = (newValue: string) => {
    setInternalValue(newValue)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new debounced timeout
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, debounceMs)
  }

  const handleClear = () => {
    setInternalValue('')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
