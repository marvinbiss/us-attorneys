/**
 * Tests for search-data utilities (HeroSearch refactor)
 *
 * Covers: normalizeText, formatPopulation, searchCities, recent searches
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeText,
  formatPopulation,
  searchCities,
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  services,
  popularCities,
  fallbackCities,
} from '@/components/search/search-data'

// ── normalizeText ──────────────────────────────────────────────────────────

describe('normalizeText', () => {
  it('lowercases text', () => {
    expect(normalizeText('New York')).toBe('new york')
  })

  it('strips accents', () => {
    expect(normalizeText('café')).toBe('cafe')
    expect(normalizeText('résumé')).toBe('resume')
  })

  it('trims whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello')
  })

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('')
  })

  it('handles mixed case with accents', () => {
    expect(normalizeText('São Paulo')).toBe('sao paulo')
  })
})

// ── formatPopulation ───────────────────────────────────────────────────────

describe('formatPopulation', () => {
  it('formats millions', () => {
    expect(formatPopulation('8300000')).toBe('8.3M pop.')
  })

  it('formats millions with no decimal', () => {
    expect(formatPopulation('2000000')).toBe('2M pop.')
  })

  it('formats thousands', () => {
    expect(formatPopulation('442000')).toBe('442k pop.')
  })

  it('formats small numbers', () => {
    expect(formatPopulation('500')).toBe('500 pop.')
  })

  it('handles spaces in numbers', () => {
    expect(formatPopulation('1 000 000')).toBe('1M pop.')
  })

  it('returns raw value for non-numeric input', () => {
    expect(formatPopulation('unknown')).toBe('unknown')
  })
})

// ── searchCities ───────────────────────────────────────────────────────────

describe('searchCities', () => {
  it('returns empty array for empty query', () => {
    expect(searchCities('')).toEqual([])
  })

  it('returns empty array for single character', () => {
    expect(searchCities('N')).toEqual([])
  })

  it('finds cities by prefix match', () => {
    const results = searchCities('new y', 5)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toContain('new y')
  })

  it('finds cities by state name', () => {
    const results = searchCities('texas', 8)
    expect(results.length).toBeGreaterThan(0)
  })

  it('respects limit parameter', () => {
    const results = searchCities('new', 3)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('prioritizes prefix matches over contains matches', () => {
    const results = searchCities('los', 8)
    if (results.length > 0) {
      // First result should start with 'los'
      expect(normalizeText(results[0].name).startsWith('los')).toBe(true)
    }
  })
})

// ── Recent searches (localStorage) ─────────────────────────────────────────

describe('recent searches', () => {
  beforeEach(() => {
    // Clear localStorage mock
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value }),
      removeItem: vi.fn((key: string) => { delete store[key] }),
    })
  })

  it('returns empty array when no recent searches', () => {
    expect(getRecentSearches()).toEqual([])
  })

  it('adds a recent search', () => {
    addRecentSearch('New York')
    const recent = getRecentSearches()
    expect(recent).toContain('New York')
  })

  it('limits to 5 recent searches', () => {
    addRecentSearch('City 1')
    addRecentSearch('City 2')
    addRecentSearch('City 3')
    addRecentSearch('City 4')
    addRecentSearch('City 5')
    addRecentSearch('City 6')
    const recent = getRecentSearches()
    expect(recent.length).toBeLessThanOrEqual(5)
    expect(recent[0]).toBe('City 6') // most recent first
  })

  it('removes a recent search', () => {
    addRecentSearch('New York')
    addRecentSearch('Los Angeles')
    removeRecentSearch('New York')
    const recent = getRecentSearches()
    expect(recent).not.toContain('New York')
    expect(recent).toContain('Los Angeles')
  })

  it('deduplicates on add', () => {
    addRecentSearch('New York')
    addRecentSearch('Chicago')
    addRecentSearch('New York') // add again
    const recent = getRecentSearches()
    const nyCount = recent.filter((s: string) => s === 'New York').length
    expect(nyCount).toBe(1)
    expect(recent[0]).toBe('New York') // moved to top
  })
})

// ── Static data integrity ──────────────────────────────────────────────────

describe('static data', () => {
  it('has 10 services', () => {
    expect(services).toHaveLength(10)
  })

  it('all services have required fields', () => {
    for (const service of services) {
      expect(service.name).toBeTruthy()
      expect(service.slug).toBeTruthy()
      expect(service.icon).toBeTruthy()
      expect(service.color).toBeTruthy()
      expect(service.searches).toBeTruthy()
      expect(typeof service.urgent).toBe('boolean')
    }
  })

  it('has unique service slugs', () => {
    const slugs = services.map(s => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('has 8 popular cities', () => {
    expect(popularCities).toHaveLength(8)
  })

  it('has 6 fallback cities', () => {
    expect(fallbackCities).toHaveLength(6)
  })
})
