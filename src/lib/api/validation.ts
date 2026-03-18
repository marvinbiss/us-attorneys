/**
 * Request Validation Middleware — US Attorneys
 *
 * Validates request body or query parameters against Zod schemas.
 * Returns proper 400 ValidationError on failure, fully integrated
 * with the centralized error handling in `@/lib/api/errors`.
 *
 * Usage with withErrorHandler:
 *   export const POST = withErrorHandler(async (req) => {
 *     const body = await validateBody(req, createBookingSchema)
 *     // body is fully typed as z.infer<typeof createBookingSchema>
 *     ...
 *   })
 *
 * Usage with createApiHandler:
 *   // Already built-in via bodySchema option — this module is for
 *   // standalone / query-param validation.
 */

import { NextRequest } from 'next/server'
import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '@/lib/api/errors'

/**
 * Format Zod issues into a flat { field: message } map.
 */
function formatZodIssues(zodError: ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of zodError.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root'
    if (!fields[path]) {
      fields[path] = issue.message
    }
  }
  return fields
}

/**
 * Validate the JSON body of a request against a Zod schema.
 *
 * @throws {ValidationError} if the body is missing, malformed JSON, or fails validation
 * @returns The parsed and typed data
 *
 * @example
 *   const data = await validateBody(request, createBookingSchema)
 *   // data: { attorneyId: string, slotId: string, ... }
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<T> {
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    throw new ValidationError('Invalid or missing JSON body')
  }

  try {
    return schema.parse(rawBody)
  } catch (error) {
    if (error instanceof ZodError) {
      const fields = formatZodIssues(error)
      const firstMessage = error.issues[0]?.message ?? 'Invalid data'
      throw new ValidationError(firstMessage, { fields })
    }
    throw new ValidationError('Invalid request body')
  }
}

/**
 * Validate URL search parameters against a Zod schema.
 *
 * Converts `URLSearchParams` to a plain object, then validates.
 * Note: Zod coercion (e.g., `z.coerce.number()`) works naturally.
 *
 * @throws {ValidationError} if validation fails
 * @returns The parsed and typed query params
 *
 * @example
 *   const query = validateQuery(request, searchSchema)
 *   // query: { q?: string, page: number, limit: number, ... }
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): T {
  const { searchParams } = new URL(request.url)

  // Convert URLSearchParams to a plain object.
  // For repeated keys, take the first value (consistent with Next.js).
  const raw: Record<string, string | undefined> = {}
  searchParams.forEach((value, key) => {
    if (!(key in raw)) {
      raw[key] = value
    }
  })

  try {
    return schema.parse(raw)
  } catch (error) {
    if (error instanceof ZodError) {
      const fields = formatZodIssues(error)
      const firstMessage = error.issues[0]?.message ?? 'Invalid query parameters'
      throw new ValidationError(firstMessage, { fields })
    }
    throw new ValidationError('Invalid query parameters')
  }
}
