/**
 * Admin Leads API
 * GET: Lead counts + active attorneys for a city x practice area
 * Uses service_role (bypasses RLS)
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { sanitizeSearchQuery } from '@/lib/sanitize'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createApiHandler } from '@/lib/api/handler'

const leadsQuerySchema = z.object({
  city: z.string().max(200).nullable().default(null),
  service: z.string().max(200).nullable().default(null),
})

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ request }) => {
  // Verify admin with services:read permission
  const auth = await requirePermission('services', 'read')
  if (!auth.success || !auth.admin) return auth.error as NextResponse

  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)

  const parsed = leadsQuerySchema.safeParse({
    city: searchParams.get('city') || null,
    service: searchParams.get('service') || null,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid data' } },
      { status: 400 }
    )
  }

  // Sanitize search inputs to prevent ILIKE injection
  const city = parsed.data.city ? sanitizeSearchQuery(parsed.data.city) : null
  const service = parsed.data.service ? sanitizeSearchQuery(parsed.data.service) : null

  // Build all 3 queries
  let leadsQuery = supabase.from('quote_requests').select('id', { count: 'exact', head: true })
  if (city) leadsQuery = leadsQuery.ilike('city', `%${city}%`)
  if (service) leadsQuery = leadsQuery.ilike('service_name', `%${service}%`)

  let assignedQuery = supabase
    .from('lead_assignments')
    .select('id, lead:quote_requests!inner(city, service_name)', { count: 'exact', head: true })
  if (city) assignedQuery = assignedQuery.ilike('lead.city', `%${city}%`)
  if (service) assignedQuery = assignedQuery.ilike('lead.service_name', `%${service}%`)

  let attorneysQuery = supabase
    .from('attorneys')
    .select(
      'id, stable_id, name, slug, address_city, is_verified, specialty:specialties!primary_specialty_id(name, slug)'
    )
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(100)
  if (city) attorneysQuery = attorneysQuery.ilike('address_city', `${city}%`)

  // Execute all 3 queries in parallel (instead of sequential)
  const assignedPromise = assignedQuery.then(
    (res) => res,
    () => ({ count: null as number | null, error: null })
  )

  const [leadsResult, assignedResult, attorneysResult] = await Promise.all([
    leadsQuery,
    assignedPromise,
    attorneysQuery,
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

  const attorneys = attorneysResult.data
  if (attorneysResult.error) {
    logger.warn('Admin leads attorneys query failed', {
      code: attorneysResult.error.code,
      message: attorneysResult.error.message,
    })
  }

  return NextResponse.json({
    leadsCreated: leadsCreated || 0,
    leadsAssigned: leadsAssigned || 0,
    attorneys: attorneys || [],
    attorneyCount: attorneys?.length || 0,
    filters: { city, service },
  })
})
