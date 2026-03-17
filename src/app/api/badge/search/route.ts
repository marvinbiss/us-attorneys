import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Sanitize: only allow alphanumeric, spaces, hyphens, apostrophes
  const safeQ = q.replace(/[^a-zA-Z0-9\s'-]/g, '')
  if (!safeQ || safeQ.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('attorneys')
    .select('name, slug, stable_id, specialty, address_city, is_verified, rating_average, review_count')
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
      specialty: p.specialty,
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
}
