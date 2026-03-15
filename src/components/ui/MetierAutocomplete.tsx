'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Wrench, Zap, Key, Flame, Hammer, Home, Wind } from 'lucide-react'
import { services } from '@/lib/data/usa'

interface ServiceItem {
  slug: string
  name: string
  icon: string
  color: string
}

interface MetierAutocompleteProps {
  value?: string
  placeholder?: string
  onSelect: (service: ServiceItem) => void
  onClear?: () => void
  showIcon?: boolean
  showAllOnFocus?: boolean
  className?: string
  inputClassName?: string
  disabled?: boolean
  maxSuggestions?: number
}

// Icon mapping for Lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Zap,
  Key,
  Flame,
  Hammer,
  Home,
  Wind,
  // Fallback for icons we don't have imported
}

// Get icon component by name
function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return iconMap[iconName] || Wrench
}

// Normalize text for search (remove accents, lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
}

// Fuzzy match score (higher is better)
function fuzzyMatch(query: string, target: string): number {
  const normalizedQuery = normalizeText(query)
  const normalizedTarget = normalizeText(target)

  // Exact match
  if (normalizedTarget === normalizedQuery) return 100

  // Starts with
  if (normalizedTarget.startsWith(normalizedQuery)) return 90

  // Contains
  if (normalizedTarget.includes(normalizedQuery)) return 70

  // Fuzzy character match
  let score = 0
  let queryIndex = 0

  for (let i = 0; i < normalizedTarget.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedTarget[i] === normalizedQuery[queryIndex]) {
      score += 10
      queryIndex++
    }
  }

  // Check if all query characters were found
  if (queryIndex === normalizedQuery.length) {
    return Math.min(60, score)
  }

  return 0
}

// Popular services for quick access
const popularServices = ['plombier', 'electricien', 'serrurier', 'chauffagiste', 'peintre-en-batiment']

export function MetierAutocomplete({
  value = '',
  placeholder = 'Quel type d\'artisan cherchez-vous ?',
  onSelect,
  onClear,
  showIcon = true,
  showAllOnFocus = true,
  className = '',
  inputClassName = '',
  disabled = false,
  maxSuggestions = 8
}: MetierAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with external value
  useEffect(() => {
    setQuery(value)
    if (value) {
      const found = services.find(s => s.name === value || s.slug === value)
      if (found) setSelectedService(found)
    }
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter and sort services
  const filteredServices = useMemo(() => {
    if (!query.trim()) {
      // Show popular services when empty
      if (showAllOnFocus) {
        const popular = services.filter(s => popularServices.includes(s.slug))
        const others = services.filter(s => !popularServices.includes(s.slug))
        return [...popular, ...others].slice(0, maxSuggestions)
      }
      return []
    }

    // Score and sort by relevance
    const scored = services
      .map(service => ({
        service,
        score: Math.max(
          fuzzyMatch(query, service.name),
          fuzzyMatch(query, service.slug)
        )
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions)

    return scored.map(item => item.service)
  }, [query, maxSuggestions, showAllOnFocus])

  // Handle selection
  const handleSelect = useCallback((service: ServiceItem) => {
    setQuery(service.name)
    setSelectedService(service)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onSelect(service)
  }, [onSelect])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredServices.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredServices.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredServices.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredServices.length) {
          handleSelect(filteredServices[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('')
    setSelectedService(null)
    setIsOpen(false)
    inputRef.current?.focus()
    onClear?.()
  }, [onClear])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    setSelectedService(null)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  // Handle focus
  const handleFocus = () => {
    if (showAllOnFocus || query.length > 0) {
      setIsOpen(true)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Container */}
      <div className="relative">
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-12 py-3.5
            bg-white border-2 border-gray-200 rounded-xl
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20
            placeholder:text-gray-400 text-gray-900
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-all
            ${selectedService ? 'border-green-500' : ''}
            ${inputClassName}
          `}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {/* Left Icon */}
        {showIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {selectedService ? (
              <div className={`
                p-1 rounded-lg bg-gradient-to-br ${selectedService.color}
              `}>
                {(() => {
                  const IconComponent = getIcon(selectedService.icon)
                  return <IconComponent className="w-4 h-4 text-white" />
                })()}
              </div>
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Effacer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && filteredServices.length > 0 && (
        <ul
          className="
            absolute z-50 w-full mt-2
            bg-white border border-gray-200 rounded-xl
            shadow-xl max-h-80 overflow-y-auto
            animate-in fade-in slide-in-from-top-2 duration-200
          "
          role="listbox"
        >
          {/* Header when showing all */}
          {!query && showAllOnFocus && (
            <li className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
              Services populaires
            </li>
          )}

          {filteredServices.map((service, index) => {
            const IconComponent = getIcon(service.icon)
            const isPopular = popularServices.includes(service.slug)

            return (
              <li
                key={service.slug}
                onClick={() => handleSelect(service)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-4 py-3 cursor-pointer
                  flex items-center gap-3
                  transition-colors
                  ${index === highlightedIndex
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                  }
                  ${index === 0 && query ? 'rounded-t-xl' : ''}
                  ${index === filteredServices.length - 1 ? 'rounded-b-xl' : ''}
                `}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {/* Icon with gradient background */}
                <div className={`
                  p-2 rounded-lg bg-gradient-to-br ${service.color}
                  shadow-sm
                `}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>

                {/* Service info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`
                      font-medium
                      ${index === highlightedIndex ? 'text-blue-900' : 'text-gray-900'}
                    `}>
                      {service.name}
                    </span>
                    {isPopular && !query && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded-full">
                        Populaire
                      </span>
                    )}
                  </div>
                </div>

                {/* Keyboard hint on highlighted */}
                {index === highlightedIndex && (
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Entrée ↵
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* No results message */}
      {isOpen && query && filteredServices.length === 0 && (
        <div className="
          absolute z-50 w-full mt-2
          bg-white border border-gray-200 rounded-xl
          shadow-lg p-4 text-center
        ">
          <div className="text-gray-500">
            Aucun métier trouvé pour "{query}"
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Essayez : plombier, électricien, serrurier...
          </div>
        </div>
      )}
    </div>
  )
}
