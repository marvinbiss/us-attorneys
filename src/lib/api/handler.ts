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

interface HandlerContext {
  request: NextRequest
  user?: { id: string; email: string }
  artisan?: { attorney_id: string } // legacy name -- matches profile.role='artisan' in DB
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
        } catch (error) {
          if (error instanceof ZodError) {
            const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
            throw new ValidationError(messages.join(', '))
          }
          throw new ValidationError('Invalid request body')
        }
      }

      // Auth check
      if (options.requireAuth || options.requireAttorney || options.requireAdmin) {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new AuthenticationError()
        }

        context.user = { id: user.id, email: user.email || '' }

        // Artisan check
        if (options.requireAttorney) {
          const { data: artisan } = await supabase
            .from('attorneys')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (!artisan) {
            throw new AuthorizationError('Attorney profile required')
          }

          context.artisan = { attorney_id: artisan.id }
        }

        // Admin check
        if (options.requireAdmin) {
          const { data: admin } = await supabase
            .from('admin_users')
            .select('id')
            .eq('id', user.id)
            .single()

          if (!admin) {
            throw new AuthorizationError('Admin access required')
          }
        }
      }

      return await handler(context as HandlerContext & { body: T })
    } catch (error) {
      logger.error('API Error', error as Error)

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
 */
export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
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
