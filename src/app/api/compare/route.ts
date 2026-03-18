/**
 * GET /api/compare?slugs=slug1,slug2,slug3,slug4
 * Fetch multiple attorneys by slugs for side-by-side comparison.
 * Max 4 attorneys per request.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const revalidate = 300

const slugsSchema = z
  .string()
  .min(1, 'At least one slug is required')
  .transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean))
  .pipe(
    z
      .array(z.string().min(1).max(255).regex(/^[a-zA-Z0-9-]+$/, 'Invalid slug format'))
      .min(1, 'At least one slug is required')
      .max(4, 'Maximum 4 attorneys per comparison')
  )

export interface CompareAttorney {
  id: string
  name: string
  slug: string
  address_city: string | null
  address_state: string | null
  address_county: string | null
  is_verified: boolean | null
  rating_average: number | null
  review_count: number | null
  phone: string | null
  bar_number: string | null
  bar_state: string | null
  years_experience: number | null
  consultation_fee: number | null
  languages: string[] | null
  response_time_hours: number | null
  firm_name: string | null
  latitude: number | null
  longitude: number | null
  created_at: string | null
  specialty_name: string | null
  win_rate: number | null
  cases_handled: number | null
  practice_areas: { slug: string; name: string }[]
  bar_admissions: { state: string; bar_number: string; status: string }[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawSlugs = searchParams.get('slugs')

    if (!rawSlugs) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing slugs parameter' } },
        { status: 400 }
      )
    }

    const parsed = slugsSchema.safeParse(rawSlugs)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid slugs' } },
        { status: 400 }
      )
    }

    const slugs = parsed.data
    const supabase = createAdminClient()

    // Fetch attorneys by slugs
    const { data: attorneys, error } = await supabase
      .from('attorneys')
      .select(`
        id, name, slug, address_city, address_state, address_county,
        is_verified, rating_average, review_count, phone, bar_number, bar_state,
        years_experience, consultation_fee, languages, response_time_hours,
        firm_name, latitude, longitude, created_at, win_rate, cases_handled,
        primary_specialty:specialties!attorneys_primary_specialty_id_fkey(slug, name)
      `)
      .in('slug', slugs)
      .eq('is_active', true)
      .limit(4)

    if (error) {
      logger.error('Compare API: Supabase query error', { error: error.message })
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch attorneys' } },
        { status: 500 }
      )
    }

    if (!attorneys || attorneys.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No attorneys found' } },
        { status: 404 }
      )
    }

    const attorneyIds = attorneys.map((a) => a.id)

    // Fetch practice areas for all attorneys in one query
    const { data: attorneySpecialties } = await supabase
      .from('attorney_specialties')
      .select('attorney_id, specialty:specialties(slug, name)')
      .in('attorney_id', attorneyIds)

    // Fetch bar admissions for all attorneys in one query
    const { data: barAdmissions } = await supabase
      .from('bar_admissions')
      .select('attorney_id, state, bar_number, status')
      .in('attorney_id', attorneyIds)

    // Build lookup maps
    const practiceAreasMap = new Map<string, { slug: string; name: string }[]>()
    const barAdmissionsMap = new Map<string, { state: string; bar_number: string; status: string }[]>()

    for (const as of attorneySpecialties || []) {
      const existing = practiceAreasMap.get(as.attorney_id) || []
      if (as.specialty) {
        const spec = as.specialty as unknown as { slug: string; name: string }
        existing.push({ slug: spec.slug, name: spec.name })
      }
      practiceAreasMap.set(as.attorney_id, existing)
    }

    for (const ba of barAdmissions || []) {
      const existing = barAdmissionsMap.get(ba.attorney_id) || []
      existing.push({ state: ba.state, bar_number: ba.bar_number, status: ba.status })
      barAdmissionsMap.set(ba.attorney_id, existing)
    }

    // Assemble comparison data, preserving the order of the requested slugs
    const slugOrder = new Map(slugs.map((s, i) => [s, i]))
    const result: CompareAttorney[] = attorneys
      .map((a) => {
        const primarySpec = a.primary_specialty as unknown as { slug: string; name: string } | null
        return {
          id: a.id,
          name: a.name,
          slug: a.slug,
          address_city: a.address_city,
          address_state: a.address_state,
          address_county: a.address_county,
          is_verified: a.is_verified,
          rating_average: a.rating_average,
          review_count: a.review_count,
          phone: a.phone,
          bar_number: a.bar_number,
          bar_state: a.bar_state,
          years_experience: a.years_experience,
          consultation_fee: a.consultation_fee,
          languages: a.languages,
          response_time_hours: a.response_time_hours,
          firm_name: a.firm_name,
          latitude: a.latitude,
          longitude: a.longitude,
          created_at: a.created_at,
          specialty_name: primarySpec?.name || null,
          win_rate: a.win_rate ?? null,
          cases_handled: a.cases_handled ?? null,
          practice_areas: practiceAreasMap.get(a.id) || [],
          bar_admissions: barAdmissionsMap.get(a.id) || [],
        }
      })
      .sort((a, b) => (slugOrder.get(a.slug) ?? 99) - (slugOrder.get(b.slug) ?? 99))

    const response = NextResponse.json({ success: true, attorneys: result })
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (err) {
    logger.error('Compare API: unexpected error', { error: String(err) })
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
