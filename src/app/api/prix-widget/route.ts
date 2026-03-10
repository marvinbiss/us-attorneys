import { NextRequest, NextResponse } from 'next/server'
import { getTradeContent, tradeContent } from '@/lib/data/trade-content'
import { getVilleBySlug } from '@/lib/data/france'
import { getRegionalMultiplier } from '@/lib/seo/location-content'
import { servicePricings } from '@/lib/data/barometre'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
}

// ---------------------------------------------------------------------------
// OPTIONS (CORS preflight)
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ---------------------------------------------------------------------------
// GET /api/prix-widget?service=plombier&ville=lyon&format=json|html
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const serviceSlug = searchParams.get('service')?.toLowerCase().trim()
  const villeSlug = searchParams.get('ville')?.toLowerCase().trim()
  const format = searchParams.get('format')?.toLowerCase().trim()

  // --- Validate service ---
  if (!serviceSlug) {
    return errorResponse('Paramètre "service" manquant. Exemple : ?service=plombier&ville=paris', format)
  }

  const trade = getTradeContent(serviceSlug)
  if (!trade) {
    const availableSlugs = Object.keys(tradeContent).slice(0, 10).join(', ')
    return errorResponse(
      `Service "${escapeHtml(serviceSlug)}" non trouvé. Services disponibles : ${availableSlugs}…`,
      format,
    )
  }

  // --- Validate ville ---
  if (!villeSlug) {
    return errorResponse('Paramètre "ville" manquant. Exemple : ?service=plombier&ville=paris', format)
  }

  const ville = getVilleBySlug(villeSlug)
  if (!ville) {
    return errorResponse(
      `Ville "${escapeHtml(villeSlug)}" non trouvée. Utilisez le slug de la ville (ex: paris, lyon, marseille).`,
      format,
    )
  }

  // --- Compute prices ---
  const multiplier = getRegionalMultiplier(ville.region)

  // Use barometre data if available for richer data, fallback to trade priceRange
  const barometreService = servicePricings.find((s) => s.service === serviceSlug)

  let priceMin: number
  let priceMax: number
  let unit: string
  let interventions: { name: string; prixMin: number; prixMax: number; unite: string }[] | undefined

  if (barometreService) {
    // Compute overall range from all interventions
    const allMin = barometreService.interventions.map((i) => i.prixMin)
    const allMax = barometreService.interventions.map((i) => i.prixMax)
    priceMin = Math.round(Math.min(...allMin) * multiplier)
    priceMax = Math.round(Math.max(...allMax) * multiplier)
    unit = 'intervention'
    interventions = barometreService.interventions.map((i) => ({
      name: i.name,
      prixMin: Math.round(i.prixMin * multiplier),
      prixMax: Math.round(i.prixMax * multiplier),
      unite: i.unite,
    }))
  } else {
    priceMin = Math.round(trade.priceRange.min * multiplier)
    priceMax = Math.round(trade.priceRange.max * multiplier)
    unit = trade.priceRange.unit
  }

  const sourceUrl = `https://servicesartisans.fr/${serviceSlug}/${villeSlug}`

  // --- JSON response ---
  if (format === 'json') {
    return NextResponse.json(
      {
        service: serviceSlug,
        serviceName: trade.name,
        ville: villeSlug,
        villeName: ville.name,
        region: ville.region,
        priceMin,
        priceMax,
        unit,
        multiplier,
        ...(interventions && { interventions }),
        source: 'ServicesArtisans.fr',
        sourceUrl,
      },
      {
        headers: { ...CORS_HEADERS, ...CACHE_HEADERS },
      },
    )
  }

  // --- HTML widget response ---
  const html = buildWidgetHtml({
    serviceName: trade.name,
    villeName: ville.name,
    region: ville.region,
    priceMin,
    priceMax,
    unit,
    interventions,
    sourceUrl,
  })

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...CORS_HEADERS,
      ...CACHE_HEADERS,
    },
  })
}

// ---------------------------------------------------------------------------
// Error response (HTML or JSON depending on format)
// ---------------------------------------------------------------------------

function errorResponse(message: string, format?: string | null) {
  if (format === 'json') {
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;background:#fef2f2;color:#991b1b;font-size:14px;border-radius:8px;">
  <p style="margin:0"><strong>Erreur :</strong> ${message}</p>
  <p style="margin:8px 0 0;font-size:12px;color:#b91c1c">
    <a href="https://servicesartisans.fr/widget-prix" style="color:#b91c1c" target="_blank" rel="noopener">Documentation du widget</a>
  </p>
</body>
</html>`

  return new NextResponse(html, {
    status: 400,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...CORS_HEADERS,
    },
  })
}

// ---------------------------------------------------------------------------
// Build self-contained HTML widget
// ---------------------------------------------------------------------------

interface WidgetData {
  serviceName: string
  villeName: string
  region: string
  priceMin: number
  priceMax: number
  unit: string
  interventions?: { name: string; prixMin: number; prixMax: number; unite: string }[]
  sourceUrl: string
}

function buildWidgetHtml(data: WidgetData): string {
  const {
    serviceName,
    villeName,
    region,
    priceMin,
    priceMax,
    unit,
    interventions,
    sourceUrl,
  } = data

  const safeServiceName = escapeHtml(serviceName)
  const safeVilleName = escapeHtml(villeName)
  const safeRegion = escapeHtml(region)
  const safeSourceUrl = escapeHtml(sourceUrl)

  // Build intervention rows if available
  let interventionRows = ''
  if (interventions && interventions.length > 0) {
    interventionRows = interventions
      .slice(0, 5)
      .map(
        (i) => `
      <tr>
        <td style="padding:6px 8px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6">${escapeHtml(i.name)}</td>
        <td style="padding:6px 8px;font-size:13px;color:#1d4ed8;font-weight:600;text-align:right;white-space:nowrap;border-bottom:1px solid #f3f4f6">${i.prixMin} – ${i.prixMax} €<span style="font-weight:400;color:#6b7280;font-size:11px">/${escapeHtml(i.unite)}</span></td>
      </tr>`,
      )
      .join('')
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:transparent;color:#1f2937}
    .widget{background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;max-width:480px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#1e40af,#3b82f6);padding:14px 16px;display:flex;align-items:center;gap:10px}
    .header-icon{width:32px;height:32px;background:rgba(255,255,255,.2);border-radius:8px;display:flex;align-items:center;justify-content:center}
    .header-icon svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .header-text h2{font-size:15px;font-weight:700;color:#fff;line-height:1.2}
    .header-text p{font-size:12px;color:rgba(255,255,255,.85);margin-top:2px}
    .price-bar{padding:14px 16px;background:#eff6ff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .price-label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:600}
    .price-range{font-size:22px;font-weight:800;color:#1e40af}
    .price-unit{font-size:12px;font-weight:400;color:#6b7280}
    .region-badge{font-size:11px;background:#dbeafe;color:#1e40af;padding:3px 8px;border-radius:20px;font-weight:500}
    .interventions{padding:0 16px}
    .interventions table{width:100%;border-collapse:collapse}
    .footer{padding:10px 16px;background:#f9fafb;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .footer a{color:#2563eb;text-decoration:none;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px}
    .footer a:hover{text-decoration:underline}
    .footer-source{font-size:10px;color:#9ca3af}
    @media(max-width:360px){.price-range{font-size:18px}.header-text h2{font-size:13px}}
  </style>
</head>
<body>
  <div class="widget">
    <div class="header">
      <div class="header-icon">
        <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      </div>
      <div class="header-text">
        <h2>Prix ${safeServiceName} à ${safeVilleName}</h2>
        <p>${safeRegion}</p>
      </div>
    </div>

    <div class="price-bar">
      <div>
        <div class="price-label">Fourchette de prix</div>
        <div class="price-range">${priceMin} – ${priceMax} € <span class="price-unit">/ ${escapeHtml(unit)}</span></div>
      </div>
      <div class="region-badge">${safeRegion}</div>
    </div>

    ${
      interventionRows
        ? `<div class="interventions">
      <table>${interventionRows}</table>
    </div>`
        : ''
    }

    <div class="footer">
      <a href="${safeSourceUrl}" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Powered by ServicesArtisans.fr
      </a>
      <span class="footer-source">Tarifs indicatifs 2026</span>
    </div>
  </div>
</body>
</html>`
}
