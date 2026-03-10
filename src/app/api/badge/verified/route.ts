import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Escape XML special characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Generate star polygon points */
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`)
  }
  return points.join(' ')
}

/** Generate SVG stars for rating */
function generateStars(rating: number, x: number, y: number): string {
  const stars: string[] = []
  const gap = 14
  for (let i = 0; i < 5; i++) {
    const cx = x + i * gap + 6
    const cy = y
    const fill = i < Math.floor(rating) ? '#f59e0b' : (i < rating ? `url(#hs${i})` : '#d1d5db')
    if (i < rating && i >= Math.floor(rating)) {
      const pct = Math.round((rating - Math.floor(rating)) * 100)
      stars.push(`<defs><linearGradient id="hs${i}"><stop offset="${pct}%" stop-color="#f59e0b"/><stop offset="${pct}%" stop-color="#d1d5db"/></linearGradient></defs>`)
    }
    stars.push(`<polygon points="${starPoints(cx, cy, 5.5, 2.5)}" fill="${fill}"/>`)
  }
  return stars.join('\n')
}

/** Shield check SVG icon */
function shieldIcon(x: number, y: number, size: number, color: string): string {
  return `<g transform="translate(${x},${y}) scale(${size / 24})">
    <path d="M12 2l7 3.5v5c0 5.25-3 9.5-7 11-4-1.5-7-5.75-7-11v-5L12 2z" fill="${color}" opacity="0.15"/>
    <path d="M12 2l7 3.5v5c0 5.25-3 9.5-7 11-4-1.5-7-5.75-7-11v-5L12 2z" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M9 12l2 2 4-4" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  const id = request.nextUrl.searchParams.get('id')
  const style = request.nextUrl.searchParams.get('style') || 'light'

  if (!slug && !id) {
    return NextResponse.json({ error: 'slug ou id requis' }, { status: 400 })
  }

  const supabase = createAdminClient()

  let query = supabase
    .from('providers')
    .select('name, slug, stable_id, specialty, address_city, is_verified, is_active, rating_average, review_count')

  if (slug) {
    query = query.eq('slug', slug)
  } else {
    query = query.eq('stable_id', id)
  }

  const { data: provider, error } = await query.single()

  if (error || !provider) {
    // Badge "non trouvé" — retourne un SVG générique
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80" viewBox="0 0 300 80">
  <rect width="300" height="80" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
  <text x="150" y="44" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="13" fill="#94a3b8">Artisan non trouve</text>
</svg>`
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  const name = escapeXml((provider.name || 'Artisan').length > 26 ? (provider.name || 'Artisan').slice(0, 24) + '...' : (provider.name || 'Artisan'))
  const specialty = escapeXml((provider.specialty || '').length > 28 ? (provider.specialty || '').slice(0, 26) + '...' : (provider.specialty || ''))
  const city = escapeXml((provider.address_city || '').length > 20 ? (provider.address_city || '').slice(0, 18) + '...' : (provider.address_city || ''))
  const rating = Math.min(5, Math.max(0, provider.rating_average || 0))
  const reviews = provider.review_count || 0
  const isVerified = provider.is_verified === true
  const isActive = provider.is_active !== false

  const isDark = style === 'dark'
  const isMinimal = style === 'minimal'

  const bgColor = isDark ? '#0f172a' : '#ffffff'
  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subtextColor = isDark ? '#94a3b8' : '#64748b'
  const borderColor = isDark ? '#1e293b' : '#e2e8f0'
  const brandColor = '#3464f4'
  const verifiedColor = isVerified ? '#059669' : '#94a3b8'
  const verifiedLabel = isVerified ? 'Verifie' : 'Reference'
  const verifiedBg = isVerified ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#1e293b' : '#f1f5f9')

  let svg: string

  if (isMinimal) {
    // --- MINIMAL: 220x54 ---
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="54" viewBox="0 0 220 54">
  <rect width="220" height="54" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
  ${shieldIcon(8, 12, 28, verifiedColor)}
  <text x="42" y="22" font-family="system-ui,-apple-system,sans-serif" font-size="12" font-weight="700" fill="${textColor}">${name}</text>
  <text x="42" y="38" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="${subtextColor}">${verifiedLabel} sur ServicesArtisans</text>
  <rect x="42" y="44" width="35" height="1" rx="0.5" fill="${brandColor}" opacity="0.3"/>
</svg>`
  } else {
    // --- STANDARD: 320x110 ---
    const w = 320
    const h = 110
    const hasRating = rating > 0 && reviews > 0
    const locationLine = specialty && city ? `${specialty} - ${city}` : specialty || city || ''

    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="shadow" x="-4%" y="-4%" width="108%" height="116%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.06"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" rx="10" fill="${bgColor}" stroke="${borderColor}" stroke-width="1" filter="url(#shadow)"/>

  <!-- Shield icon -->
  ${shieldIcon(14, 16, 36, verifiedColor)}

  <!-- Verified badge pill -->
  <rect x="55" y="14" width="${isVerified ? 66 : 74}" height="20" rx="10" fill="${verifiedBg}"/>
  <circle cx="67" cy="24" r="4" fill="${verifiedColor}"/>
  <path d="M65.5 24l1 1 2.5-2.5" fill="none" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="76" y="28" font-family="system-ui,-apple-system,sans-serif" font-size="10" font-weight="600" fill="${verifiedColor}">${verifiedLabel}</text>

  <!-- Name -->
  <text x="55" y="52" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="700" fill="${textColor}">${name}</text>

  <!-- Specialty + City -->
  <text x="55" y="68" font-family="system-ui,-apple-system,sans-serif" font-size="11" fill="${subtextColor}">${escapeXml(locationLine)}</text>

  <!-- Stars + Reviews -->
  ${hasRating ? `
  ${generateStars(rating, 55, 86)}
  <text x="${55 + 5 * 14 + 8}" y="90" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="${subtextColor}">${rating.toFixed(1)} (${reviews} avis)</text>
  ` : `
  <text x="55" y="90" font-family="system-ui,-apple-system,sans-serif" font-size="10" fill="${subtextColor}">${isActive ? 'Artisan actif sur ServicesArtisans.fr' : 'Fiche sur ServicesArtisans.fr'}</text>
  `}

  <!-- Brand -->
  <text x="${w - 15}" y="${h - 10}" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="8" font-weight="600" fill="${brandColor}" opacity="0.6">ServicesArtisans.fr</text>
</svg>`
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  })
}
