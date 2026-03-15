/**
 * Professional Logger - ServicesArtisans
 * Centralized logging with environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  bookingId?: string
  attorneyId?: string
  action?: string
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

// Only log warnings and errors in production
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL]
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const contextStr = context ? ` ${JSON.stringify(context)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
}

interface AppLogger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: unknown, context?: LogContext): void
  child(defaultContext: LogContext): AppLogger
  api: {
    request(route: string, method: string, context?: LogContext): void
    success(route: string, context?: LogContext): void
    error(route: string, error: unknown, context?: LogContext): void
  }
}

function createLogger(defaultContext?: LogContext): AppLogger {
  const mergeContext = (context?: LogContext): LogContext | undefined => {
    if (!defaultContext && !context) return undefined
    return { ...defaultContext, ...context }
  }

  const instance: AppLogger = {
    debug(message: string, context?: LogContext): void {
      if (shouldLog('debug')) {
        console.log(formatMessage('debug', message, mergeContext(context)))
      }
    },

    info(message: string, context?: LogContext): void {
      if (shouldLog('info')) {
        console.log(formatMessage('info', message, mergeContext(context)))
      }
    },

    warn(message: string, context?: LogContext): void {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message, mergeContext(context)))
      }
    },

    error(message: string, error?: unknown, context?: LogContext): void {
      if (shouldLog('error')) {
        const errorDetails = error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error
        console.error(formatMessage('error', message, { ...mergeContext(context), error: errorDetails }))
      }
    },

    child(childContext: LogContext): AppLogger {
      return createLogger({ ...defaultContext, ...childContext })
    },

    api: {
      request(route: string, method: string, context?: LogContext): void {
        instance.debug(`API ${method} ${route}`, context)
      },

      success(route: string, context?: LogContext): void {
        instance.info(`API success: ${route}`, context)
      },

      error(route: string, error: unknown, context?: LogContext): void {
        instance.error(`API error: ${route}`, error, context)
      },
    },
  }

  return instance
}

export const logger = createLogger()

// Named child loggers for specific subsystems
export const apiLogger = logger.child({ component: 'api' })
export const dbLogger = logger.child({ component: 'database' })
export const authLogger = logger.child({ component: 'auth' })
export const paymentLogger = logger.child({ component: 'payment' })

export default logger
