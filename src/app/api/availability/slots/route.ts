/**
 * Availability Slots API - ServicesArtisans
 * Get availability slots for search results (Doctolib-style)
 *
 * Note: Returns empty slots until real availability data is implemented in the database
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET request query params schema
const slotsQuerySchema = z.object({
  artisanIds: z.string().min(1),
  days: z.coerce.number().int().min(1).max(30).optional().default(5),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

interface DayAvailability {
  date: string
  dayName: string
  dayNumber: number
  month: string
  slots: Array<{ time: string; available: boolean }>
}

// GET /api/availability/slots?artisanIds=id1,id2,id3&days=5
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryParams = {
      artisanIds: searchParams.get('artisanIds'),
      days: searchParams.get('days') || '5',
      startDate: searchParams.get('startDate'),
    }
    const result = slotsQuerySchema.safeParse(queryParams)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Requête invalide', details: result.error.flatten() } }, { status: 400 })
    }
    const { artisanIds: artisanIdsParam, days, startDate: startDateParam } = result.data

    const artisanIds = artisanIdsParam.split(',')
    const startDate = startDateParam ? new Date(startDateParam) : new Date()

    // Return empty availability until real scheduling data is implemented
    // TODO: Fetch real availability from database when scheduling feature is built
    const availabilityMap: Record<string, DayAvailability[]> = {}

    for (const artisanId of artisanIds) {
      availabilityMap[artisanId] = [] // No fake slots - return empty
    }

    return NextResponse.json({
      availability: availabilityMap,
      startDate: startDate.toISOString().split('T')[0],
      days,
    })
  } catch (error) {
    logger.error('Availability slots error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors de la récupération des créneaux' } },
      { status: 500 }
    )
  }
}
