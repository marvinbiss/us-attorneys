import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAttorneysByServiceAndLocation } from '@/lib/supabase'

const schema = z.object({
  service: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const revalidate = 3600 // ISR - revalidate every hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = schema.safeParse({
    service: searchParams.get('service'),
    location: searchParams.get('location'),
    offset: searchParams.get('offset'),
    limit: searchParams.get('limit'),
  })

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Paramètres invalides' } }, { status: 400 })
  }

  const { service, location, offset, limit } = parsed.data

  try {
    const providers = await getAttorneysByServiceAndLocation(service, location, { limit, offset })
    return NextResponse.json({ providers: providers || [] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Erreur serveur' } }, { status: 500 })
  }
}
