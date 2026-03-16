/**
 * Tests for Search API
 */

import { describe, it, expect } from 'vitest'

// Search parameter validation logic
function validateSearchParams(params: Record<string, unknown>): {
  valid: boolean
  errors: string[]
  sanitized: Record<string, unknown>
} {
  const errors: string[] = []
  const sanitized: Record<string, unknown> = {}

  // Query validation
  if (params.q !== undefined) {
    if (typeof params.q !== 'string') {
      errors.push('Query must be a string')
    } else if (params.q.length > 200) {
      errors.push('Query must be less than 200 characters')
    } else {
      sanitized.q = params.q.trim()
    }
  }

  // Location validation
  if (params.lat !== undefined && params.lon !== undefined) {
    const lat = Number(params.lat)
    const lon = Number(params.lon)

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Invalid latitude')
    } else if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.push('Invalid longitude')
    } else {
      sanitized.lat = lat
      sanitized.lon = lon
    }
  }

  // Radius validation
  if (params.radius !== undefined) {
    const radius = Number(params.radius)
    if (isNaN(radius) || radius < 1 || radius > 100) {
      errors.push('Radius must be between 1 and 100 km')
    } else {
      sanitized.radius = radius
    }
  } else {
    sanitized.radius = 25 // Default
  }

  // Rating validation
  if (params.minRating !== undefined) {
    const rating = Number(params.minRating)
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('Rating must be between 0 and 5')
    } else {
      sanitized.minRating = rating
    }
  }

  // Price validation
  if (params.minPrice !== undefined) {
    const price = Number(params.minPrice)
    if (isNaN(price) || price < 0) {
      errors.push('Minimum price must be positive')
    } else {
      sanitized.minPrice = price
    }
  }

  if (params.maxPrice !== undefined) {
    const price = Number(params.maxPrice)
    if (isNaN(price) || price < 0) {
      errors.push('Maximum price must be positive')
    } else {
      sanitized.maxPrice = price
    }
  }

  // Sort validation
  const validSorts = ['relevance', 'rating', 'distance', 'price_low', 'price_high']
  if (params.sortBy !== undefined) {
    if (!validSorts.includes(params.sortBy as string)) {
      errors.push('Invalid sort option')
    } else {
      sanitized.sortBy = params.sortBy
    }
  } else {
    sanitized.sortBy = 'relevance' // Default
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

// Distance calculation (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

describe('Search API', () => {
  describe('Parameter Validation', () => {
    it('should accept valid search parameters', () => {
      const result = validateSearchParams({
        q: 'attorney',
        lat: 40.7128,
        lon: -74.006,
        radius: 25,
        minRating: 4,
        sortBy: 'rating'
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.sanitized.q).toBe('attorney')
    })

    it('should reject query longer than 200 characters', () => {
      const result = validateSearchParams({
        q: 'a'.repeat(201)
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Query must be less than 200 characters')
    })

    it('should reject invalid latitude', () => {
      const result = validateSearchParams({
        lat: 91,
        lon: 2.3522
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid latitude')
    })

    it('should reject invalid longitude', () => {
      const result = validateSearchParams({
        lat: 48.8566,
        lon: 181
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid longitude')
    })

    it('should reject radius outside range', () => {
      const result1 = validateSearchParams({ radius: 0 })
      expect(result1.errors).toContain('Radius must be between 1 and 100 km')

      const result2 = validateSearchParams({ radius: 101 })
      expect(result2.errors).toContain('Radius must be between 1 and 100 km')
    })

    it('should reject invalid rating', () => {
      const result = validateSearchParams({ minRating: 6 })
      expect(result.errors).toContain('Rating must be between 0 and 5')
    })

    it('should set default values', () => {
      const result = validateSearchParams({})
      expect(result.sanitized.radius).toBe(25)
      expect(result.sanitized.sortBy).toBe('relevance')
    })

    it('should trim whitespace from query', () => {
      const result = validateSearchParams({ q: '  attorney  ' })
      expect(result.sanitized.q).toBe('attorney')
    })
  })

  describe('Distance Calculation', () => {
    it('should calculate distance between New York and Los Angeles', () => {
      // New York: 40.7128, -74.0060
      // Los Angeles: 34.0522, -118.2437
      const distance = calculateDistance(40.7128, -74.006, 34.0522, -118.2437)
      // Expected: ~3944 km
      expect(distance).toBeGreaterThan(3900)
      expect(distance).toBeLessThan(4000)
    })

    it('should return 0 for same location', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006)
      expect(distance).toBeCloseTo(0)
    })

    it('should handle antipodal points', () => {
      // Approximately opposite sides of Earth
      const distance = calculateDistance(0, 0, 0, 180)
      // Half circumference of Earth ~20,000 km
      expect(distance).toBeGreaterThan(19000)
      expect(distance).toBeLessThan(21000)
    })
  })
})
