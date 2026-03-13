'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Wrench, X } from 'lucide-react'
import { services, villes, type Ville } from '@/lib/data/france'

// ── Normalize text (strip accents, lowercase) ───────────────────────
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// ── Format population for display ───────────────────────────────────
function formatPopulation(pop: string): string {
  const cleaned = pop.replace(/\s/g, '')
  const num = parseInt(cleaned, 10)
  if (isNaN(num)) return pop
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.0', '')} M hab.`
  if (num >= 1_000) return `${Math.round(num / 1_000).toLocaleString('fr-FR')} k hab.`
  return `${num.toLocaleString('fr-FR')} hab.`
}

// ── Fuzzy city search with prioritized matching ─────────────────────
function searchCities(query: string, limit = 5): Ville[] {
  if (!query || query.length < 1) return []

  const normalized = normalizeText(query)

  const prefixMatches: Ville[] = []
  const containsMatches: Ville[] = []
  const postalMatches: Ville[] = []

  for (const v of villes) {
    const normalizedName = normalizeText(v.name)

    if (normalizedName.startsWith(normalized)) {
      prefixMatches.push(v)
    } else if (normalizedName.includes(normalized)) {
      containsMatches.push(v)
    } else if (v.codePostal.startsWith(query.trim())) {
      postalMatches.push(v)
    }
  }

  const sortByPop = (a: Ville, b: Ville) => {
    const popA = parseInt(a.population.replace(/\s/g, ''), 10) || 0
    const popB = parseInt(b.population.replace(/\s/g, ''), 10) || 0
    return popB - popA
  }

  prefixMatches.sort(sortByPop)
  containsMatches.sort(sortByPop)
  postalMatches.sort(sortByPop)

  return [...prefixMatches, ...containsMatches, ...postalMatches].slice(0, limit)
}

// ── Search services ─────────────────────────────────────────────────
function searchServices(query: string, limit = 5): typeof services {
  if (!query || query.length < 1) return []

  const normalized = normalizeText(query)

  const prefixMatches: typeof services = []
  const containsMatches: typeof services = []

  for (const s of services) {
    const normalizedName = normalizeText(s.name)
    if (normalizedName.startsWith(normalized)) {
      prefixMatches.push(s)
    } else if (normalizedName.includes(normalized)) {
      containsMatches.push(s)
    }
  }

  return [...prefixMatches, ...containsMatches].slice(0, limit)
}

// ── Types for suggestion items ──────────────────────────────────────
type SuggestionType = 'service' | 'city' | 'combined'

interface Suggestion {
  type: SuggestionType
  label: string
  serviceSlug?: string
  serviceName?: string
  citySlug?: string
  cityName?: string
  cityDept?: string
  cityPop?: string
}

// ── Build suggestions from input ────────────────────────────────────
function buildSuggestions(input: string): Suggestion[] {
  if (!input || input.trim().length < 1) return []

  const trimmed = input.trim()
  const results: Suggestion[] = []

  // 1) Try to split input into service + city parts
  //    Check each possible split point: "Plombier Paris" -> ["Plombier", "Paris"]
  //    Also handle "Plombier a Paris", "Plombier à Paris"
  const words = trimmed.split(/\s+/)

  let bestServiceMatch: typeof services[0] | null = null
  let bestSplitIndex = -1

  // Try progressively longer service prefixes
  for (let i = 1; i <= words.length; i++) {
    const serviceCandidate = words.slice(0, i).join(' ')
    const normalizedCandidate = normalizeText(serviceCandidate)

    // Check for exact service match
    const exactMatch = services.find(
      s => normalizeText(s.name) === normalizedCandidate
    )
    if (exactMatch) {
      bestServiceMatch = exactMatch
      bestSplitIndex = i
    }
  }

  // If we found a service match, check what remains for city
  if (bestServiceMatch && bestSplitIndex < words.length) {
    let remainingWords = words.slice(bestSplitIndex)

    // Strip common French prepositions "a", "à", "de", "en"
    if (remainingWords.length > 0 && /^(a|à|de|en)$/i.test(remainingWords[0])) {
      remainingWords = remainingWords.slice(1)
    }

    const cityPart = remainingWords.join(' ')
    if (cityPart.length >= 1) {
      const matchingCities = searchCities(cityPart, 5)
      for (const city of matchingCities) {
        results.push({
          type: 'combined',
          label: `${bestServiceMatch.name} à ${city.name}`,
          serviceSlug: bestServiceMatch.slug,
          serviceName: bestServiceMatch.name,
          citySlug: city.slug,
          cityName: city.name,
          cityDept: `${city.departement} (${city.departementCode})`,
          cityPop: formatPopulation(city.population),
        })
      }
    }

    // If no city part remaining, but service matched exactly with trailing space
    if (cityPart.length === 0 && input.endsWith(' ')) {
      // Show top cities for this service
      const topCities = [...villes]
        .sort((a, b) => {
          const popA = parseInt(a.population.replace(/\s/g, ''), 10) || 0
          const popB = parseInt(b.population.replace(/\s/g, ''), 10) || 0
          return popB - popA
        })
        .slice(0, 5)

      for (const city of topCities) {
        results.push({
          type: 'combined',
          label: `${bestServiceMatch.name} à ${city.name}`,
          serviceSlug: bestServiceMatch.slug,
          serviceName: bestServiceMatch.name,
          citySlug: city.slug,
          cityName: city.name,
          cityDept: `${city.departement} (${city.departementCode})`,
          cityPop: formatPopulation(city.population),
        })
      }
    }
  }

  // If we found combined results, return them first but also add pure service/city matches
  if (results.length > 0) {
    // Also add the pure service match as first item
    if (bestServiceMatch) {
      results.unshift({
        type: 'service',
        label: bestServiceMatch.name,
        serviceSlug: bestServiceMatch.slug,
        serviceName: bestServiceMatch.name,
      })
    }
    return results.slice(0, 8)
  }

  // 2) No combined match found. Show service matches and city matches separately.

  // Service matches
  const serviceMatches = searchServices(trimmed, 4)
  for (const s of serviceMatches) {
    results.push({
      type: 'service',
      label: s.name,
      serviceSlug: s.slug,
      serviceName: s.name,
    })
  }

  // City matches
  const cityMatches = searchCities(trimmed, 4)
  for (const c of cityMatches) {
    results.push({
      type: 'city',
      label: c.name,
      citySlug: c.slug,
      cityName: c.name,
      cityDept: `${c.departement} (${c.departementCode})`,
      cityPop: formatPopulation(c.population),
    })
  }

  // 3) Also try partial service prefix + city for partial matches
  //    e.g., "Plomb Par" -> try "Plomb" as partial service, "Par" as partial city
  if (results.length === 0 && words.length >= 2) {
    for (let i = 1; i < words.length; i++) {
      const serviceCandidate = words.slice(0, i).join(' ')
      const normalizedCandidate = normalizeText(serviceCandidate)

      // Find services that START with this partial
      const partialServiceMatches = services.filter(s =>
        normalizeText(s.name).startsWith(normalizedCandidate)
      )

      if (partialServiceMatches.length > 0) {
        let remainingWords = words.slice(i)
        // Strip prepositions
        if (remainingWords.length > 0 && /^(a|à|de|en)$/i.test(remainingWords[0])) {
          remainingWords = remainingWords.slice(1)
        }
        const cityPart = remainingWords.join(' ')
        if (cityPart.length >= 1) {
          const matchingCities = searchCities(cityPart, 4)
          for (const service of partialServiceMatches.slice(0, 2)) {
            for (const city of matchingCities.slice(0, 3)) {
              results.push({
                type: 'combined',
                label: `${service.name} à ${city.name}`,
                serviceSlug: service.slug,
                serviceName: service.name,
                citySlug: city.slug,
                cityName: city.name,
                cityDept: `${city.departement} (${city.departementCode})`,
                cityPop: formatPopulation(city.population),
              })
            }
          }
        }
      }

      if (results.length > 0) break
    }
  }

  return results.slice(0, 8)
}

// ── Highlight matching text ─────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 1) return <>{text}</>

  const normalizedQuery = normalizeText(query)
  const normalizedText = normalizeText(text)
  const matchIndex = normalizedText.indexOf(normalizedQuery)

  if (matchIndex === -1) return <>{text}</>

  const before = text.slice(0, matchIndex)
  const match = text.slice(matchIndex, matchIndex + query.length)
  const after = text.slice(matchIndex + query.length)

  return (
    <>
      {before}
      <span className="font-bold text-blue-600">{match}</span>
      {after}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════
// QUICK SEARCH COMPONENT
// ═════════════════════════════════════════════════════════════════════
export default function QuickSearch() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build suggestions
  const suggestions = useMemo(() => buildSuggestions(input), [input])

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [suggestions.length, input])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-suggestion-item]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navigate based on suggestion type
  const navigateToSuggestion = useCallback((suggestion: Suggestion) => {
    setShowDropdown(false)
    setInput('')

    if (suggestion.type === 'combined' && suggestion.serviceSlug && suggestion.citySlug) {
      router.push(`/services/${suggestion.serviceSlug}/${suggestion.citySlug}`)
    } else if (suggestion.type === 'service' && suggestion.serviceSlug) {
      router.push(`/services/${suggestion.serviceSlug}`)
    } else if (suggestion.type === 'city' && suggestion.citySlug) {
      router.push(`/villes/${suggestion.citySlug}`)
    }
  }, [router])

  // Handle form submit (navigate to first suggestion or search page)
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      navigateToSuggestion(suggestions[highlightedIndex])
    } else if (suggestions.length > 0) {
      navigateToSuggestion(suggestions[0])
    } else {
      // Fallback: go to search page with query
      router.push(`/recherche?q=${encodeURIComponent(input.trim())}`)
      setShowDropdown(false)
      setInput('')
    }
  }, [input, highlightedIndex, suggestions, navigateToSuggestion, router])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault()
        setShowDropdown(true)
        setHighlightedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          navigateToSuggestion(suggestions[highlightedIndex])
        } else {
          handleSubmit()
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        inputRef.current?.blur()
        break
      case 'Tab':
        setShowDropdown(false)
        break
    }
  }, [showDropdown, suggestions, highlightedIndex, navigateToSuggestion, handleSubmit])

  // Determine the "query" part to highlight in suggestions
  // For a combined suggestion, highlight the city portion from the input
  const getHighlightQuery = (suggestion: Suggestion): string => {
    if (suggestion.type === 'service') return input.trim()
    if (suggestion.type === 'city') return input.trim()
    // For combined, we don't highlight the label directly
    return ''
  }

  // Icon for suggestion type
  const SuggestionIcon = ({ type }: { type: SuggestionType }) => {
    if (type === 'service') {
      return <Wrench className="w-4 h-4 text-blue-500" />
    }
    if (type === 'city') {
      return <MapPin className="w-4 h-4 text-rose-500" />
    }
    // combined
    return <Search className="w-4 h-4 text-emerald-500" />
  }

  return (
    <div ref={containerRef} className="w-full relative">
      <form onSubmit={handleSubmit} role="search" aria-label="Recherche rapide">
        <div className="relative flex items-center">
          {/* Search icon */}
          <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => {
              if (input.trim().length > 0) {
                setShowDropdown(true)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un artisan, un service, une ville..."
            autoComplete="off"
            aria-label="Recherche rapide"
            aria-expanded={showDropdown && suggestions.length > 0}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            className="w-full rounded-full bg-gray-50 border border-gray-200 pl-10 pr-10 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 hover:shadow-sm focus:border-blue-400 focus:bg-white focus:shadow-md focus:ring-2 focus:ring-blue-100"
          />

          {/* Clear button */}
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('')
                setShowDropdown(false)
                inputRef.current?.focus()
              }}
              className="absolute right-10 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              aria-label="Effacer"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="absolute right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:scale-105"
            aria-label="Rechercher"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          role="listbox"
          aria-label="Suggestions"
        >
          <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {suggestions.map((suggestion, idx) => {
              const isHighlighted = idx === highlightedIndex
              const highlightQuery = getHighlightQuery(suggestion)

              return (
                <button
                  key={`${suggestion.type}-${suggestion.label}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  data-suggestion-item
                  onClick={() => navigateToSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all duration-100
                    ${isHighlighted
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isHighlighted
                      ? suggestion.type === 'service'
                        ? 'bg-blue-100'
                        : suggestion.type === 'city'
                          ? 'bg-rose-100'
                          : 'bg-emerald-100'
                      : 'bg-gray-100'
                  }`}>
                    <SuggestionIcon type={suggestion.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate transition-colors ${
                      isHighlighted ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {suggestion.type === 'combined' ? (
                        <span>{suggestion.label}</span>
                      ) : (
                        <HighlightMatch text={suggestion.label} query={highlightQuery} />
                      )}
                    </div>

                    {/* Meta info */}
                    {suggestion.type === 'service' && (
                      <div className="text-xs text-gray-400 truncate">Service artisan</div>
                    )}
                    {suggestion.type === 'city' && suggestion.cityDept && (
                      <div className="text-xs text-gray-400 truncate">
                        {suggestion.cityDept}
                        {suggestion.cityPop ? ` · ${suggestion.cityPop}` : ''}
                      </div>
                    )}
                    {suggestion.type === 'combined' && suggestion.cityDept && (
                      <div className="text-xs text-gray-400 truncate">
                        {suggestion.cityDept}
                        {suggestion.cityPop ? ` · ${suggestion.cityPop}` : ''}
                      </div>
                    )}
                  </div>

                  {/* Type badge */}
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    suggestion.type === 'service'
                      ? 'bg-blue-50 text-blue-600'
                      : suggestion.type === 'city'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {suggestion.type === 'service' ? 'Service' : suggestion.type === 'city' ? 'Ville' : 'Service + Ville'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Keyboard hints */}
          <div className="hidden md:flex items-center gap-3 px-3.5 py-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">&#8593;&#8595;</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">Entr&eacute;e</kbd>
              valider
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white rounded border border-gray-200 font-mono">&Eacute;chap</kbd>
              fermer
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
