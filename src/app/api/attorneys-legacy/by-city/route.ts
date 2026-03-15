/**
 * API to retrieve attorneys by city
 * Used to display markers on the map
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getCityValues } from '@/lib/insee-resolver'

const byCityQuerySchema = z.object({
  city: z.string().min(1, 'City parameter is required').max(200),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const revalidate = 3600 // ISR - revalidate every hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryValidation = byCityQuerySchema.safeParse({
      city: searchParams.get('city') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: queryValidation.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      )
    }

    const { city, limit } = queryValidation.data

    const supabase = createAdminClient()

    const { data: providers, error } = await supabase
      .from('attorneys')
      .select('id, name, slug, latitude, longitude, rating_average, review_count, specialty, address_city')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      // Use .in() with INSEE codes instead of ILIKE to avoid full table scan on 750K rows
      .in('address_city', getCityValues(city))
      .order('rating_average', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching providers by city:', error)
      return NextResponse.json(
        { error: 'Failed to fetch providers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      providers: providers || [],
      count: providers?.length || 0
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })

  } catch (error) {
    logger.error('Error in providers by city API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
