import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * CSP Violation Report Endpoint
 *
 * Receives Content-Security-Policy violation reports from browsers.
 * The CSP-Report-Only header in middleware.ts directs browsers to POST
 * violation reports here as JSON with Content-Type: application/csp-report.
 *
 * Reports are logged for analysis. In production, consider forwarding
 * to Sentry or a dedicated CSP monitoring service (e.g., report-uri.com).
 */

// Rate limit: max 100 reports per IP per minute to prevent report flooding
const reportCounts = new Map<string, { count: number; resetTime: number }>()
const MAX_REPORTS_PER_MINUTE = 100

// Validate CSP report structure (loose: browsers send inconsistent fields)
const cspReportInnerSchema = z
  .object({
    'blocked-uri': z.string().max(2048).optional(),
    'violated-directive': z.string().max(500).optional(),
    'document-uri': z.string().max(2048).optional(),
    'source-file': z.string().max(2048).optional(),
    'line-number': z.number().int().optional(),
    'column-number': z.number().int().optional(),
    'original-policy': z.string().max(5000).optional(),
  })
  .passthrough()

const cspReportSchema = z
  .object({
    'csp-report': cspReportInnerSchema.optional(),
  })
  .passthrough()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = reportCounts.get(ip)

  // Clean up old entries periodically
  if (reportCounts.size > 5000) {
    reportCounts.forEach((val, key) => {
      if (now > val.resetTime) reportCounts.delete(key)
    })
  }

  if (!record || now > record.resetTime) {
    reportCounts.set(ip, { count: 1, resetTime: now + 60_000 })
    return false
  }

  if (record.count >= MAX_REPORTS_PER_MINUTE) return true

  record.count++
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (isRateLimited(ip)) {
      return new NextResponse(null, { status: 429 })
    }

    const contentType = request.headers.get('content-type') || ''

    // Browsers send CSP reports as application/csp-report or application/json
    if (
      !contentType.includes('application/csp-report') &&
      !contentType.includes('application/json')
    ) {
      return new NextResponse(null, { status: 400 })
    }

    const body = await request.json()

    // Validate the report structure
    const validation = cspReportSchema.safeParse(body)
    if (!validation.success) {
      // Silently discard malformed reports
      return new NextResponse(null, { status: 204 })
    }

    // Extract the report — browsers wrap it in a "csp-report" key
    // Use Record<string, unknown> since browsers send inconsistent field names
    const report = (validation.data['csp-report'] || validation.data) as Record<string, unknown>

    // Log key fields only (avoid logging full document-uri which may contain sensitive paths)
    logger.warn('CSP violation report', {
      blockedUri: report['blocked-uri'] || report['blockedURL'],
      violatedDirective: report['violated-directive'] || report['effectiveDirective'],
      documentUri: report['document-uri'] || report['documentURL'],
      sourceFile: report['source-file'] || report['sourceFile'],
      lineNumber: report['line-number'] || report['lineNumber'],
      columnNumber: report['column-number'] || report['columnNumber'],
      originalPolicy:
        typeof report['original-policy'] === 'string'
          ? report['original-policy'].substring(0, 200)
          : undefined,
      ip,
    })

    // 204 No Content — acknowledge receipt without sending a body
    return new NextResponse(null, { status: 204 })
  } catch {
    // Never fail on malformed reports — just discard
    return new NextResponse(null, { status: 204 })
  }
}

// Reject non-POST methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
