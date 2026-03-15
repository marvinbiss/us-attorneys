'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, MapPin, Briefcase, User, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchSuggestion {
  id: string
  type: 'service' | 'location' | 'artisan' | 'recent'
  text: string
  metadata?: {
    city?: string
    specialty?: string
    resultCount?: number
  }
}

interface InstantSearchProps {
  onSearch: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  placeholder?: string
  className?: string
}

export function InstantSearch({
  onSearch,
  onSuggestionSelect,
  placeholder = 'Search for an attorney, service, or city...',
  className,
}: InstantSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 200)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch suggestions with AbortController to cancel stale requests
  const fetchSuggestions = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!debouncedQuery.trim()) {
      setSuggestions([])
      return
    }

    // Create new AbortController for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`,
        { signal: controller.signal }
      )
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      // Ignore abort errors - they're expected when cancelling stale requests
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Error fetching suggestions:', error)
    } finally {
      // Only update loading state if this controller wasn't aborted
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [debouncedQuery])

  useEffect(() => {
    fetchSuggestions()

    // Cleanup: abort pending request on unmount or when query changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchSuggestions])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setIsOpen(false)
    onSuggestionSelect?.(suggestion)
    onSearch(suggestion.text)
  }

  const handleSubmit = () => {
    if (query.trim()) {
      setIsOpen(false)
      onSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'service':
        return <Briefcase className="w-4 h-4" />
      case 'location':
        return <MapPin className="w-4 h-4" />
      case 'artisan':
        return <User className="w-4 h-4" />
      case 'recent':
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isLoading ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        ) : query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (query || suggestions.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {suggestions.length === 0 && query && !isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No suggestions for "{query}"
            </div>
          ) : (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        suggestion.type === 'service' && 'bg-blue-100 text-blue-600',
                        suggestion.type === 'location' && 'bg-green-100 text-green-600',
                        suggestion.type === 'artisan' && 'bg-purple-100 text-purple-600',
                        suggestion.type === 'recent' && 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {getIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.metadata && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {suggestion.metadata.specialty && (
                            <span>{suggestion.metadata.specialty}</span>
                          )}
                          {suggestion.metadata.city && (
                            <span> · {suggestion.metadata.city}</span>
                          )}
                          {suggestion.metadata.resultCount && (
                            <span> · {suggestion.metadata.resultCount} results</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Search button */}
          {query && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4" />
                Search "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InstantSearch
