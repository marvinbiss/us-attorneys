/**
 * Admin Leads API
 * GET: Lead counts + active artisans for a city x metier
 * Uses service_role (bypasses RLS)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const leadsQuerySchema = z.object({
  city: z.string().max(200).nullable().default(null),
  service: z.string().max(200).nullable().default(null),
})

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Verify admin with services:read permission
    const auth = await requirePermission('services', 'read')
    if (!auth.success || !auth.admin) return auth.error!

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const parsed = leadsQuerySchema.safeParse({
      city: searchParams.get('city') || null,
      service: searchParams.get('service') || null,
    })

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Données invalides' } }, { status: 400 })
    }

    // Sanitize search inputs to prevent ILIKE injection
    const city = parsed.data.city ? sanitizeSearchQuery(parsed.data.city) : null
    const service = parsed.data.service ? sanitizeSearchQuery(parsed.data.service) : null

    // Build all 3 queries
    let leadsQuery = supabase
      .from('devis_requests')
      .select('id', { count: 'exact', head: true })
    if (city) leadsQuery = leadsQuery.ilike('city', `%${city}%`)
    if (service) leadsQuery = leadsQuery.ilike('service_name', `%${service}%`)

    let assignedQuery = supabase
      .from('lead_assignments')
      .select('id, lead:devis_requests!inner(city, service_name)', { count: 'exact', head: true })
    if (city) assignedQuery = assignedQuery.ilike('lead.city', `%${city}%`)
    if (service) assignedQuery = assignedQuery.ilike('lead.service_name', `%${service}%`)

    let artisansQuery = supabase
      .from('providers')
      .select('id, stable_id, name, slug, specialty, address_city, is_verified')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(100)
    if (city) artisansQuery = artisansQuery.ilike('address_city', `${city}%`)
    if (service) artisansQuery = artisansQuery.ilike('specialty', `${service}%`)

    // Execute all 3 queries in parallel (instead of sequential)
    const assignedPromise = assignedQuery.then(
      (res) => res,
      () => ({ count: null as number | null, error: null })
    )

    const [leadsResult, assignedResult, artisansResult] = await Promise.all([
      leadsQuery,
      assignedPromise,
      artisansQuery,
    ])

    const leadsCreated = leadsResult.count
    let leadsAssigned = assignedResult.count
    // Fallback if FK join failed
    if (leadsAssigned === null || leadsAssigned === undefined) {
      const { count: fallbackCount } = await supabase
        .from('lead_assignments')
        .select('id', { count: 'exact', head: true })
      leadsAssigned = fallbackCount
    }

    const artisans = artisansResult.data
    if (artisansResult.error) {
      logger.warn('Admin leads artisans query failed', { code: artisansResult.error.code, message: artisansResult.error.message })
    }

    return NextResponse.json({
      leadsCreated: leadsCreated || 0,
      leadsAssigned: leadsAssigned || 0,
      artisans: artisans || [],
      artisanCount: artisans?.length || 0,
      filters: { city, service },
    })
  } catch (error) {
    logger.error('Admin leads GET error', error)
    return NextResponse.json({
      leadsCreated: 0,
      leadsAssigned: 0,
      artisans: [],
      artisanCount: 0,
      filters: { city: null, service: null },
    })
  }
}
