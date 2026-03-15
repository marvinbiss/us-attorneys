import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { geocoder, reverseGeocode, autocompleteVille, autocompleteAdresse } from '@/lib/api/adresse'
import { z } from 'zod'

// Query schemas for each action
const geocodeSchema = z.object({
  action: z.literal('geocode'),
  address: z.string().min(1).max(500),
})

const reverseSchema = z.object({
  action: z.literal('reverse'),
  lon: z.coerce.number().min(-180).max(180),
  lat: z.coerce.number().min(-90).max(90),
})

const citiesSchema = z.object({
  action: z.literal('cities'),
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

const addressesSchema = z.object({
  action: z.literal('addresses'),
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(100).optional().default(5),
  postcode: z.string().max(10).optional().nullable(),
})

/**
 * API Route for server-side geocoding
 * Useful for SSR or batch operations
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  try {
    switch (action) {
      // Geocoding: Address → GPS
      case 'geocode': {
        const queryParams = {
          action: 'geocode' as const,
          address: searchParams.get('address'),
        }
        const result = geocodeSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'Address required', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const data = await geocoder(result.data.address)
        return NextResponse.json({ success: true, data })
      }

      // Reverse geocoding : GPS → Adresse
      case 'reverse': {
        const queryParams = {
          action: 'reverse' as const,
          lon: searchParams.get('lon'),
          lat: searchParams.get('lat'),
        }
        const result = reverseSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'Valid lon and lat coordinates required', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const data = await reverseGeocode(result.data.lon, result.data.lat)
        return NextResponse.json({ success: true, data })
      }

      // Autocomplete cities
      case 'cities': {
        const queryParams = {
          action: 'cities' as const,
          q: searchParams.get('q'),
          limit: searchParams.get('limit') || '10',
        }
        const result = citiesSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'Query required', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const results = await autocompleteVille(result.data.q, result.data.limit)
        return NextResponse.json({ success: true, data: results })
      }

      // Autocomplete adresses
      case 'addresses': {
        const queryParams = {
          action: 'addresses' as const,
          q: searchParams.get('q'),
          limit: searchParams.get('limit') || '5',
          postcode: searchParams.get('postcode'),
        }
        const result = addressesSchema.safeParse(queryParams)
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: { message: 'Query required', details: result.error.flatten() } },
            { status: 400 }
          )
        }
        const results = await autocompleteAdresse(result.data.q, {
          limit: result.data.limit,
          postcode: result.data.postcode || undefined
        })
        return NextResponse.json({ success: true, data: results })
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Invalid action. Use: geocode, reverse, cities, addresses' } },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Geocode API error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
