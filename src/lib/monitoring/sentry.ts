/**
 * Sentry Error Monitoring Integration
 * Production-grade error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'

// Initialize Sentry (called in instrumentation.ts)
export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!dsn) {
    logger.warn('Sentry DSN not configured - error monitoring disabled')
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.telegramhook.com/',
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'http://loading.retry.widdit.com/',
      'atomicFindClose',
      // Facebook
      'fb_xd_fragment',
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'NetworkError',
      // User aborted
      'AbortError',
      'cancelled',
      // Safari
      'The operation was aborted',
    ],

    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
      // Analytics
      /google-analytics\.com/i,
      /googletagmanager\.com/i,
    ],

    // Before send hook for custom filtering
    beforeSend(event, _hint) {
      // Filter out non-error events in development
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        platform: 'us-attorneys',
      }

      return event
    },

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  })
}

/**
 * Capture an error with context
 */
export function captureError(
  error: Error | string,
  context?: {
    tags?: Record<string, string>
    extra?: Record<string, unknown>
    user?: { id: string; email?: string }
    level?: 'fatal' | 'error' | 'warning' | 'info'
  }
) {
  const { tags, extra, user, level = 'error' } = context || {}

  if (user) {
    Sentry.setUser(user)
  }

  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      Sentry.setTag(key, value)
    })
  }

  if (typeof error === 'string') {
    Sentry.captureMessage(error, level)
  } else {
    Sentry.captureException(error, { extra })
  }
}

/**
 * Capture a message with context
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (user) {
    Sentry.setUser(user)
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string
  message: string
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  data?: Record<string, unknown>
}) {
  Sentry.addBreadcrumb({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, string | number | boolean>
) {
  return Sentry.startSpan({ name, op, attributes: data }, () => {})
}

/**
 * Measure a function's performance
 */
export async function measurePerformance<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    { name, op: operation },
    async () => {
      return await fn()
    }
  )
}

/**
 * Create a custom scope for grouped errors
 */
export function withScope(
  callback: (scope: Sentry.Scope) => void
) {
  Sentry.withScope(callback)
}

/**
 * Flush pending events (useful before process exit)
 */
export async function flush(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout)
}

// Export Sentry for advanced usage
export { Sentry }
