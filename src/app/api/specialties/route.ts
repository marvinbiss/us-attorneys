/**
 * Public Specialties API
 * GET: Returns all active specialties (practice areas) for selection
 * Cached for 24 hours — these rarely change
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('specialties')
      .select('id, name, slug, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      logger.error('Specialties API error', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch specialties' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: data ?? [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch (err) {
    logger.error('Specialties API unexpected error', err as Error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
