import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createApiHandler } from '@/lib/api/handler'

export const GET = createApiHandler(async ({ request }) => {
  const q = new URL(request.url).searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Sanitize: only allow alphanumeric, spaces, hyphens, apostrophes
  const safeQ = q.replace(/[^a-zA-Z0-9\s'-]/g, '')
  if (!safeQ || safeQ.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attorneys')
    .select('name, slug, stable_id, address_city, is_verified, rating_average, review_count, specialty:specialties!primary_specialty_id(name, slug)')
    .or(`name.ilike.%${safeQ}%,slug.ilike.%${safeQ}%`)
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ results: [] })
  }

  return NextResponse.json({
    results: (data || []).map((p) => ({
      name: p.name,
      slug: p.slug,
      stable_id: p.stable_id,
      specialty: (p.specialty as { name?: string } | null)?.name || null,
      city: p.address_city,
      is_verified: p.is_verified === true,
      rating: p.rating_average,
      reviews: p.review_count,
    })),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  })
}, {})
