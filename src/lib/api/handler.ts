import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  formatErrorResponse,
} from '@/lib/errors'
import { logger } from '@/lib/logger'
import { isTimeoutError } from '@/lib/api/timeout'
import { handleApiError, ApiError as CentralApiError } from '@/lib/api/errors'
import { checkSessionIdle, touchSession } from '@/lib/session-timeout'

interface HandlerContext {
  request: NextRequest
  user?: { id: string; email: string }
  attorney?: { attorney_id: string }
  /** @deprecated Use attorney instead */
  artisan?: { attorney_id: string }
  body?: unknown
  params?: Record<string, string>
}

interface HandlerOptions<T = unknown> {
  bodySchema?: ZodSchema<T>
  requireAuth?: boolean
  requireAttorney?: boolean
  requireAdmin?: boolean
}

type HandlerFunction<T = unknown> = (
  context: HandlerContext & { body: T }
) => Promise<NextResponse>

/**
 * Create a standardized API handler with validation and auth
 */
export function createApiHandler<T = unknown>(
  handler: HandlerFunction<T>,
  options: HandlerOptions<T> = {}
) {
  return async (request: NextRequest, routeContext?: { params?: Record<string, string> }) => {
    try {
      const context: HandlerContext = {
        request,
        params: routeContext?.params,
      }

      // Parse body if needed
      if (options.bodySchema) {
        try {
          const rawBody = await request.json()
          context.body = options.bodySchema.parse(rawBody)
        } catch (error: unknown) {
          if (error instanceof ZodError) {
            const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
            throw new ValidationError(messages.join(', '))
          }
          throw new ValidationError('Invalid request body')
        }
      }

      // Auth check
      if (options.requireAuth || options.requireAttorney || options.requireAdmin) {
        // Session idle timeout check (30 min for regular users, admin routes use requirePermission which has its own 15 min check)
        const sessionCheck = await checkSessionIdle(false)
        if (sessionCheck.expired) {
          throw new AuthenticationError('Session expired due to inactivity. Please sign in again.')
        }

        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new AuthenticationError()
        }

        // Refresh session activity timestamp
        await touchSession()

        context.user = { id: user.id, email: user.email || '' }

        // Attorney check
        if (options.requireAttorney) {
          const { data: attorneyRow } = await supabase
            .from('attorneys')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (!attorneyRow) {
            throw new AuthorizationError('Attorney profile required')
          }

          context.attorney = { attorney_id: attorneyRow.id }
          context.artisan = context.attorney // backward compat
        }

        // Admin check
        if (options.requireAdmin) {
          const { data: admin } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .eq('is_admin', true)
            .single()

          if (!admin) {
            throw new AuthorizationError('Admin access required')
          }
        }
      }

      return await handler(context as HandlerContext & { body: T })
    } catch (error: unknown) {
      // New centralized ApiError instances — use handleApiError directly
      if (error instanceof CentralApiError) {
        return handleApiError(error)
      }

      // Return 504 Gateway Timeout for database timeout errors
      if (isTimeoutError(error)) {
        logger.error('API Timeout', error as Error)
        return handleApiError(error)
      }

      logger.error('API Error', error as Error)

      // Legacy AppError from src/lib/errors.ts
      if (error instanceof AppError) {
        return NextResponse.json(formatErrorResponse(error), {
          status: error.statusCode,
        })
      }

      return NextResponse.json(formatErrorResponse(error), { status: 500 })
    }
  }
}

/**
 * Create a JSON response
 * @deprecated Use apiSuccess() for the standard response format
 */
export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

// ============================================
// Standard API Response Helpers
// ============================================
// All API routes should use these two helpers for consistency:
//   Success: { success: true, data: T }
//   Error:   { success: false, error: { code: string, message: string } }
// ============================================

/**
 * Standard success response
 *
 * @example apiSuccess({ user: { id: '1', name: 'Jane' } })
 * @example apiSuccess({ id: '1' }, 201)
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Standard error response
 *
 * @example apiError('VALIDATION_ERROR', 'Invalid email address', 400)
 * @example apiError('NOT_FOUND', 'Attorney not found', 404)
 */
export function apiError(code: string, message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  )
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  }
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasMore: pagination.page * pagination.limit < pagination.total,
    },
  })
}
