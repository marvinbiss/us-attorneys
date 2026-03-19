/**
 * Alerting System — US Attorneys
 *
 * Unified alerting with multi-channel support (Slack webhook, email via Resend).
 * Rate-limited to prevent alert spam (max 1 alert per key per 5 minutes).
 * Environment-aware: skips all alerts in development.
 *
 * Usage:
 *   import { sendAlert } from '@/lib/monitoring/alerts'
 *   await sendAlert({
 *     level: 'critical',
 *     title: 'Database connection failed',
 *     message: 'Supabase returned 503 for 3 consecutive health checks',
 *     source: 'health-check',
 *     metadata: { latency: 12000 },
 *   })
 */

import { logger } from '@/lib/logger'

// ─── Types ───────────────────────────────────────────────────────────

export type AlertLevel = 'info' | 'warning' | 'critical'

export interface AlertPayload {
  /** Severity level — determines channel routing and formatting */
  level: AlertLevel
  /** Short title (displayed as header in Slack/email) */
  title: string
  /** Detailed description */
  message: string
  /** Originating system (e.g., 'cron:data-quality', 'health-check') */
  source: string
  /** Optional structured metadata attached to the alert */
  metadata?: Record<string, unknown>
  /** Override rate-limit key (defaults to `${source}:${title}`) */
  dedupeKey?: string
}

interface AlertResult {
  sent: boolean
  channels: string[]
  rateLimited: boolean
}

// ─── Rate Limiting ───────────────────────────────────────────────────

/** In-memory rate limit store: key -> last sent timestamp (ms) */
const rateLimitMap = new Map<string, number>()

/** Minimum interval between alerts with the same key (5 minutes) */
const RATE_LIMIT_MS = 5 * 60 * 1000

/** Max entries in rate limit map to prevent unbounded growth */
const RATE_LIMIT_MAX_ENTRIES = 500

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const lastSent = rateLimitMap.get(key)

  if (lastSent && now - lastSent < RATE_LIMIT_MS) {
    return true
  }

  // Evict old entries if map is too large
  if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) {
    const cutoff = now - RATE_LIMIT_MS
    const entries = Array.from(rateLimitMap.entries())
    for (const entry of entries) {
      if (entry[1] < cutoff) rateLimitMap.delete(entry[0])
    }
  }

  rateLimitMap.set(key, now)
  return false
}

// ─── Slack Channel ───────────────────────────────────────────────────

const SLACK_EMOJI: Record<AlertLevel, string> = {
  info: ':information_source:',
  warning: ':warning:',
  critical: ':rotating_light:',
}

const SLACK_COLOR: Record<AlertLevel, string> = {
  info: '#36a64f',
  warning: '#ff9900',
  critical: '#ff0000',
}

async function sendSlack(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return false

  try {
    const fields: Array<{ title: string; value: string; short: boolean }> = [
      { title: 'Source', value: payload.source, short: true },
      { title: 'Level', value: payload.level.toUpperCase(), short: true },
    ]

    if (payload.metadata) {
      for (const [key, value] of Object.entries(payload.metadata)) {
        fields.push({
          title: key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          short: true,
        })
      }
    }

    const slackPayload = {
      text: `${SLACK_EMOJI[payload.level]} *[${payload.level.toUpperCase()}]* ${payload.title}`,
      attachments: [
        {
          color: SLACK_COLOR[payload.level],
          text: payload.message,
          fields,
          footer: 'US Attorneys Monitoring',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
      signal: AbortSignal.timeout(5000),
    })

    return res.ok
  } catch (err) {
    logger.error('[Alert] Slack delivery failed', err as Error)
    return false
  }
}

// ─── Email Channel (Resend fallback) ─────────────────────────────────

async function sendEmailAlert(payload: AlertPayload): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY
  const alertEmail = process.env.ALERT_EMAIL || process.env.ADMIN_EMAILS?.split(',')[0]?.trim()

  if (!resendApiKey || !alertEmail) return false

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'US Attorneys Alerts <alerts@lawtendr.com>',
        to: [alertEmail],
        subject: `[${payload.level.toUpperCase()}] ${payload.title}`,
        html: `
          <h2 style="color: ${SLACK_COLOR[payload.level]}">[${payload.level.toUpperCase()}] ${payload.title}</h2>
          <p><strong>Source:</strong> ${payload.source}</p>
          <p>${payload.message}</p>
          ${payload.metadata ? `<pre>${JSON.stringify(payload.metadata, null, 2)}</pre>` : ''}
          <hr>
          <p style="color: #999; font-size: 12px">US Attorneys Monitoring — ${new Date().toISOString()}</p>
        `,
        text: `[${payload.level.toUpperCase()}] ${payload.title}\n\nSource: ${payload.source}\n\n${payload.message}${payload.metadata ? '\n\nMetadata:\n' + JSON.stringify(payload.metadata, null, 2) : ''}`,
      }),
      signal: AbortSignal.timeout(5000),
    })

    return res.ok
  } catch (err) {
    logger.error('[Alert] Email delivery failed', err as Error)
    return false
  }
}

// ─── Main Alert Function ─────────────────────────────────────────────

/**
 * Send an alert to all configured channels.
 *
 * - Skips in development (NODE_ENV !== 'production')
 * - Rate-limited: max 1 alert per dedupeKey per 5 minutes
 * - Channels: Slack (primary), Email (fallback for critical only)
 */
export async function sendAlert(payload: AlertPayload): Promise<AlertResult> {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[Alert][DEV] ${payload.level.toUpperCase()}: ${payload.title}`, {
      source: payload.source,
      message: payload.message,
    })
    return { sent: false, channels: [], rateLimited: false }
  }

  // Rate limiting
  const dedupeKey = payload.dedupeKey || `${payload.source}:${payload.title}`
  if (isRateLimited(dedupeKey)) {
    logger.info(`[Alert] Rate-limited: ${dedupeKey}`)
    return { sent: false, channels: [], rateLimited: true }
  }

  const channels: string[] = []

  // Primary: Slack
  const slackSent = await sendSlack(payload)
  if (slackSent) channels.push('slack')

  // Fallback: Email for critical alerts, or if Slack failed
  if (payload.level === 'critical' || !slackSent) {
    const emailSent = await sendEmailAlert(payload)
    if (emailSent) channels.push('email')
  }

  // Always log the alert
  const logMethod = payload.level === 'critical' ? 'error' : payload.level === 'warning' ? 'warn' : 'info'
  if (logMethod === 'error') {
    logger.error(`[Alert] ${payload.title}: ${payload.message}`, new Error(payload.message), {
      source: payload.source,
      channels: channels.join(','),
    })
  } else {
    logger[logMethod](`[Alert] ${payload.title}: ${payload.message}`, {
      source: payload.source,
      channels: channels.join(','),
    })
  }

  return { sent: channels.length > 0, channels, rateLimited: false }
}

/**
 * Convenience: send a critical alert (always attempts both channels)
 */
export async function alertCritical(
  title: string,
  message: string,
  source: string,
  metadata?: Record<string, unknown>
): Promise<AlertResult> {
  return sendAlert({ level: 'critical', title, message, source, metadata })
}

/**
 * Convenience: send a warning alert
 */
export async function alertWarning(
  title: string,
  message: string,
  source: string,
  metadata?: Record<string, unknown>
): Promise<AlertResult> {
  return sendAlert({ level: 'warning', title, message, source, metadata })
}

/**
 * For testing: clear rate limit state
 */
export function _clearRateLimits(): void {
  rateLimitMap.clear()
}
