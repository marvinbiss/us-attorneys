import { NextRequest, NextResponse } from 'next/server'

/** Escape XML special characters to prevent XSS in SVG output */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Generate SVG star icons for the given rating */
function generateStars(rating: number, x: number, y: number, color: string): string {
  const stars: string[] = []
  const starSize = 12
  const gap = 15

  for (let i = 0; i < 5; i++) {
    const cx = x + i * gap + starSize / 2
    const cy = y
    const fill = i < Math.floor(rating) ? color : (i < rating ? `url(#halfStar${i})` : '#cbd5e1')

    if (i < rating && i >= Math.floor(rating)) {
      // Partial star — use a gradient
      const pct = Math.round((rating - Math.floor(rating)) * 100)
      stars.push(
        `<defs><linearGradient id="halfStar${i}"><stop offset="${pct}%" stop-color="${color}"/><stop offset="${pct}%" stop-color="#cbd5e1"/></linearGradient></defs>`
      )
    }

    stars.push(
      `<polygon points="${starPoints(cx, cy, 6, 3)}" fill="${fill}"/>`
    )
  }

  return stars.join('\n    ')
}

/** Calculate star polygon points centered at (cx, cy) */
function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    points.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`)
  }
  return points.join(' ')
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || 'Artisan'
  const service = request.nextUrl.searchParams.get('service') || ''
  const rating = request.nextUrl.searchParams.get('rating') || '4.5'
  const reviews = request.nextUrl.searchParams.get('reviews') || '0'
  const style = request.nextUrl.searchParams.get('style') || 'light'

  // Clamp rating between 0 and 5
  const ratingNum = Math.min(5, Math.max(0, parseFloat(rating) || 4.5))

  const isMinimal = style === 'minimal'
  const bgColor = style === 'dark' ? '#1e293b' : '#ffffff'
  const textColor = style === 'dark' ? '#ffffff' : '#1e293b'
  const subtextColor = style === 'dark' ? '#94a3b8' : '#64748b'
  const borderColor = style === 'dark' ? '#334155' : '#e2e8f0'
  const accentColor = '#2563eb'
  const starColor = '#f59e0b'

  const escapedName = escapeXml(name.length > 28 ? name.slice(0, 26) + '...' : name)
  const escapedService = escapeXml(service.length > 30 ? service.slice(0, 28) + '...' : service)

  let svg: string

  if (isMinimal) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50">
  <rect width="200" height="50" rx="6" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
  <text x="12" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="${accentColor}">ServicesArtisans.fr</text>
  <text x="12" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${textColor}">${escapedName}</text>
  <g transform="translate(165, 10)">
    <rect width="24" height="24" rx="5" fill="#dcfce7"/>
    <text x="12" y="17" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#16a34a">&#x2713;</text>
  </g>
  <text x="177" y="46" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="7" font-weight="600" fill="#16a34a">Certifie</text>
</svg>`
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">
  <rect width="300" height="100" rx="8" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
  <text x="15" y="25" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="${accentColor}">ServicesArtisans.fr</text>
  <text x="15" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="${textColor}">${escapedName}</text>
  <text x="15" y="62" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="${subtextColor}">${escapedService}</text>
  ${generateStars(ratingNum, 15, 80, starColor)}
  <text x="92" y="84" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="${subtextColor}">${ratingNum.toFixed(1)}/5 (${escapeXml(reviews)} avis)</text>
  <g transform="translate(255, 15)">
    <rect width="30" height="30" rx="6" fill="#dcfce7"/>
    <text x="15" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#16a34a">&#x2713;</text>
  </g>
  <text x="270" y="58" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="600" fill="#16a34a">Verifie</text>
</svg>`
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
