import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Temporary diagnostic endpoint to debug provider detail lookups.
 * Tests both anon and admin clients with various column sets.
 * DELETE THIS FILE after the 404 issue is resolved.
 *
 * Usage: /api/debug/provider-lookup?slug=pierre-azoulay-333705036
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'Missing ?slug= parameter' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const anon = createClient(supabaseUrl, anonKey)

  const results: Record<string, unknown> = {
    slug,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    hasAnonKey: !!anonKey,
    hasServiceKey: !!serviceKey,
  }

  // Test 1: Minimal select with anon (same as PROVIDER_LIST_SELECT)
  try {
    const { data, error } = await anon
      .from('providers')
      .select('id, slug, stable_id, name, specialty, is_active')
      .eq('slug', slug)
      .single()
    results.test1_minimal_anon = { success: !!data, error: error?.message, data: data ? { id: data.id, slug: data.slug, stable_id: data.stable_id, name: data.name } : null }
  } catch (e) {
    results.test1_minimal_anon = { success: false, error: String(e) }
  }

  // Test 2: Same but by stable_id
  try {
    const { data, error } = await anon
      .from('providers')
      .select('id, slug, stable_id, name, specialty, is_active')
      .eq('stable_id', slug)
      .single()
    results.test2_stable_id_anon = { success: !!data, error: error?.message, data: data ? { id: data.id, slug: data.slug, stable_id: data.stable_id } : null }
  } catch (e) {
    results.test2_stable_id_anon = { success: false, error: String(e) }
  }

  // Test 3: Full PROVIDER_DETAIL_SELECT (26 cols) with anon
  const DETAIL_SELECT = 'id, stable_id, name, slug, specialty, email, phone, siret, siren, description, meta_description, address_street, address_city, address_postal_code, address_region, is_verified, is_active, noindex, rating_average, review_count, legal_form_code, website, latitude, longitude, created_at, updated_at'
  try {
    const { data, error } = await anon
      .from('providers')
      .select(DETAIL_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    results.test3_detail_anon = { success: !!data, error: error?.message, id: data?.id, name: data?.name }
  } catch (e) {
    results.test3_detail_anon = { success: false, error: String(e) }
  }

  // Test 4: Test each suspect column individually
  const suspectCols = ['address_department', 'user_id', 'claimed_at', 'code_naf', 'libelle_naf']
  for (const col of suspectCols) {
    try {
      const { data, error } = await anon
        .from('providers')
        .select(`id, ${col}`)
        .eq('is_active', true)
        .limit(1)
        .single()
      results[`test_col_${col}`] = { exists: !!data, error: error?.message }
    } catch (e) {
      results[`test_col_${col}`] = { exists: false, error: String(e) }
    }
  }

  // Test 5: Admin client (if available)
  if (serviceKey) {
    try {
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { data, error } = await admin
        .from('providers')
        .select(DETAIL_SELECT)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      results.test5_detail_admin = { success: !!data, error: error?.message, id: data?.id, name: data?.name }
    } catch (e) {
      results.test5_detail_admin = { success: false, error: String(e) }
    }
  } else {
    results.test5_detail_admin = { skipped: true, reason: 'No SUPABASE_SERVICE_ROLE_KEY' }
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
