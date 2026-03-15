'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { services, cities, type City } from '@/lib/data/usa'

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function searchServices(query: string, limit = 6): typeof services {
  if (!query || query.length < 1) return []
  const n = normalizeText(query)
  const prefix: typeof services = []
  const contains: typeof services = []
  for (const s of services) {
    const sn = normalizeText(s.name)
    if (sn.startsWith(n)) prefix.push(s)
    else if (sn.includes(n)) contains.push(s)
  }
  return [...prefix, ...contains].slice(0, limit)
}

function searchCities(query: string, limit = 6): City[] {
  if (!query || query.length < 1) return []
  const n = normalizeText(query)
  const prefix: City[] = []
  const contains: City[] = []
  const postal: City[] = []
  for (const v of cities) {
    const vn = normalizeText(v.name)
    if (vn.startsWith(n)) prefix.push(v)
    else if (vn.includes(n)) contains.push(v)
    else if (v.zipCode.startsWith(query.trim())) postal.push(v)
  }
  const sortByPop = (a: City, b: City) => {
    const pa = parseInt(a.population.replace(/\s/g, ''), 10) || 0
    const pb = parseInt(b.population.replace(/\s/g, ''), 10) || 0
    return pb - pa
  }
  prefix.sort(sortByPop)
  contains.sort(sortByPop)
  postal.sort(sortByPop)
  return [...prefix, ...contains, ...postal].slice(0, limit)
}

export function ClayHeroSearch() {
  const router = useRouter()
  const [service, setService] = useState('')
  const [ville, setVille] = useState('')
  const [serviceSuggestions, setServiceSuggestions] = useState<typeof services>([])
  const [citySuggestions, setCitySuggestions] = useState<City[]>([])
  const [activeField, setActiveField] = useState<'service' | 'city' | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [selectedServiceSlug, setSelectedServiceSlug] = useState('')
  const [selectedCitySlug, setSelectedCitySlug] = useState('')
  const serviceRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  const serviceInputRef = useRef<HTMLInputElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)

  const currentSuggestions = activeField === 'service' ? serviceSuggestions : citySuggestions
  const hasDropdown = activeField !== null && currentSuggestions.length > 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        serviceRef.current && !serviceRef.current.contains(e.target as Node) &&
        cityRef.current && !cityRef.current.contains(e.target as Node)
      ) {
        setActiveField(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleServiceChange = useCallback((value: string) => {
    setService(value)
    setSelectedServiceSlug('')
    setHighlightedIndex(-1)
    setServiceSuggestions(searchServices(value))
  }, [])

  const handleCityChange = useCallback((value: string) => {
    setVille(value)
    setSelectedCitySlug('')
    setHighlightedIndex(-1)
    setCitySuggestions(searchCities(value))
  }, [])

  function selectService(s: typeof services[0]) {
    setService(s.name)
    setSelectedServiceSlug(s.slug)
    setServiceSuggestions([])
    setActiveField(null)
    setHighlightedIndex(-1)
    cityInputRef.current?.focus()
  }

  function selectCity(v: City) {
    setVille(v.name)
    setSelectedCitySlug(v.slug)
    setCitySuggestions([])
    setActiveField(null)
    setHighlightedIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!hasDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(i => Math.min(i + 1, currentSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      if (activeField === 'service') selectService(serviceSuggestions[highlightedIndex])
      else selectCity(citySuggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setActiveField(null)
      setHighlightedIndex(-1)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const slug = selectedServiceSlug || serviceSuggestions[0]?.slug
    const citySlug = selectedCitySlug || citySuggestions[0]?.slug
    if (slug && citySlug) {
      router.push(`/practice-areas/${slug}/${citySlug}`)
    } else if (slug) {
      router.push(`/practice-areas/${slug}`)
    } else {
      const params = new URLSearchParams()
      if (service) params.set('q', service)
      if (ville) params.set('location', ville)
      router.push(`/services${params.toString() ? `?${params.toString()}` : ''}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3" role="search" aria-label="Search for an attorney" onKeyDown={handleKeyDown}>
      {/* Service input */}
      <div ref={serviceRef} className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2.5 bg-white border border-stone-200 rounded-2xl px-4 h-[48px] md:h-[60px] focus-within:border-clay-400 focus-within:ring-2 focus-within:ring-clay-400/20 transition-all">
          <svg className="w-5 h-5 text-clay-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
          </svg>
          <input
            ref={serviceInputRef}
            type="text"
            value={service}
            onChange={e => handleServiceChange(e.target.value)}
            onFocus={() => { setActiveField('service'); setHighlightedIndex(-1); setServiceSuggestions(searchServices(service)) }}
            placeholder="What service?"
            className="w-0 flex-1 bg-transparent text-stone-800 placeholder-stone-400 text-base outline-none"
            role="combobox"
            aria-expanded={activeField === 'service' && serviceSuggestions.length > 0}
            aria-autocomplete="list"
            aria-controls="service-suggestions"
            autoComplete="off"
          />
        </div>
        {activeField === 'service' && serviceSuggestions.length > 0 && (
          <ul id="service-suggestions" role="listbox" aria-label="Suggested services" className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden max-h-64 overflow-y-auto">
            {serviceSuggestions.map((s, i) => (
              <li
                key={s.slug}
                role="option"
                aria-selected={i === highlightedIndex}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-clay-50 text-clay-600' : 'text-stone-700 hover:bg-stone-50'}`}
                onMouseDown={(e) => { e.preventDefault(); selectService(s) }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                <span className="w-5 h-5 rounded-md bg-clay-50 flex items-center justify-center text-clay-400 text-xs shrink-0">⚒</span>
                <span className="font-medium">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* City input */}
      <div ref={cityRef} className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2.5 bg-white border border-stone-200 rounded-2xl px-4 h-[48px] md:h-[60px] focus-within:border-clay-400 focus-within:ring-2 focus-within:ring-clay-400/20 transition-all">
          <svg className="w-5 h-5 text-clay-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
          </svg>
          <input
            ref={cityInputRef}
            type="text"
            value={ville}
            onChange={e => handleCityChange(e.target.value)}
            onFocus={() => { setActiveField('city'); setHighlightedIndex(-1); setCitySuggestions(searchCities(ville)) }}
            placeholder="City or ZIP code"
            className="w-0 flex-1 bg-transparent text-stone-800 placeholder-stone-400 text-base outline-none"
            role="combobox"
            aria-expanded={activeField === 'city' && citySuggestions.length > 0}
            aria-autocomplete="list"
            aria-controls="city-suggestions"
            autoComplete="off"
          />
        </div>
        {activeField === 'city' && citySuggestions.length > 0 && (
          <ul id="city-suggestions" role="listbox" aria-label="Suggested cities" className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden max-h-64 overflow-y-auto">
            {citySuggestions.map((v, i) => (
              <li
                key={v.slug}
                role="option"
                aria-selected={i === highlightedIndex}
                className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-clay-50 text-clay-600' : 'text-stone-700 hover:bg-stone-50'}`}
                onMouseDown={(e) => { e.preventDefault(); selectCity(v) }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-clay-50 flex items-center justify-center text-clay-400 text-xs shrink-0">📍</span>
                  <span className="font-medium">{v.name}</span>
                </div>
                <span className="text-xs text-stone-400">{v.stateCode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        aria-label="Search for an attorney"
        className="bg-clay-400 hover:bg-clay-600 text-white font-bold text-base px-7 h-[48px] md:h-[60px] rounded-2xl shrink-0 transition-colors duration-200 w-full md:w-auto"
      >
        Search
      </button>
    </form>
  )
}
