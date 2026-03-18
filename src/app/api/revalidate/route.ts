import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const revalidateLogger = logger.child({ component: 'revalidate' })

// ── Schemas ──────────────────────────────────────────────────

/** Legacy single-path mode (backward-compatible) */
const revalidateSingleSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  secret: z.string().min(1, 'Secret is required'),
})

/** Enhanced batch mode: paths and/or tags */
const revalidateBatchSchema = z.object({
  paths: z.array(z.string().min(1)).max(100, 'Maximum 100 paths per request').optional(),
  tags: z.array(z.string().min(1)).max(50, 'Maximum 50 tags per request').optional(),
}).refine(
  (data) => (data.paths && data.paths.length > 0) || (data.tags && data.tags.length > 0),
  { message: 'At least one path or tag is required' }
)

const MAX_PATHS = 100
const MAX_TAGS = 50

// ── Helpers ──────────────────────────────────────────────────

function verifySecret(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return bearerToken === secret
}

function missingSecretResponse() {
  return NextResponse.json(
    { success: false, error: { message: 'Server configuration error' } },
    { status: 500 }
  )
}

function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: { message: 'Invalid secret' } },
    { status: 401 }
  )
}

// ── POST /api/revalidate ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return missingSecretResponse()
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid JSON body' } },
        { status: 400 }
      )
    }

    // ── Try enhanced batch mode first: { paths?: [...], tags?: [...] } with Bearer auth
    const batchResult = revalidateBatchSchema.safeParse(body)
    if (batchResult.success) {
      if (!verifySecret(request)) {
        return unauthorizedResponse()
      }

      const { paths, tags } = batchResult.data
      const revalidatedPaths: string[] = []
      const revalidatedTags: string[] = []
      const errors: Array<{ item: string; type: 'path' | 'tag'; error: string }> = []

      // Revalidate paths
      if (paths) {
        for (const path of paths.slice(0, MAX_PATHS)) {
          try {
            revalidatePath(path, 'page')
            revalidatedPaths.push(path)
            revalidateLogger.info('Path revalidated', { action: 'revalidate-path', path } as Record<string, unknown>)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push({ item: path, type: 'path', error: msg })
            revalidateLogger.warn('Path revalidation failed', { action: 'revalidate-path', path, error: msg } as Record<string, unknown>)
          }
        }
      }

      // Revalidate tags
      if (tags) {
        for (const tag of tags.slice(0, MAX_TAGS)) {
          try {
            revalidateTag(tag)
            revalidatedTags.push(tag)
            revalidateLogger.info('Tag revalidated', { action: 'revalidate-tag', tag } as Record<string, unknown>)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push({ item: tag, type: 'tag', error: msg })
            revalidateLogger.warn('Tag revalidation failed', { action: 'revalidate-tag', tag, error: msg } as Record<string, unknown>)
          }
        }
      }

      // Notify IndexNow for revalidated paths (fire-and-forget)
      if (revalidatedPaths.length > 0) {
        import('@/lib/seo/indexnow')
          .then(({ submitToIndexNow }) => submitToIndexNow(revalidatedPaths))
          .catch(() => {})
      }

      const totalRevalidated = revalidatedPaths.length + revalidatedTags.length
      revalidateLogger.info('Batch revalidation complete', {
        action: 'revalidate-batch',
        pathCount: revalidatedPaths.length,
        tagCount: revalidatedTags.length,
        errorCount: errors.length,
      } as Record<string, unknown>)

      return NextResponse.json({
        success: true,
        revalidated: totalRevalidated,
        paths: revalidatedPaths.length > 0 ? revalidatedPaths : undefined,
        tags: revalidatedTags.length > 0 ? revalidatedTags : undefined,
        errors: errors.length > 0 ? errors : undefined,
        now: Date.now(),
      })
    }

    // ── Legacy single mode: { path, secret }
    const singleResult = revalidateSingleSchema.safeParse(body)
    if (!singleResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid data — send { paths: [...], tags: [...] } with Bearer auth, or { path, secret } for single revalidation',
          },
        },
        { status: 400 }
      )
    }

    const { path, secret } = singleResult.data

    if (secret !== process.env.REVALIDATE_SECRET) {
      return unauthorizedResponse()
    }

    revalidatePath(path, 'page')
    revalidateLogger.info('Path revalidated (legacy)', { action: 'revalidate-single', path } as Record<string, unknown>)

    // Notify IndexNow (fire-and-forget)
    import('@/lib/seo/indexnow')
      .then(({ submitToIndexNow }) => submitToIndexNow([path]))
      .catch(() => {})

    return NextResponse.json({
      success: true,
      revalidated: 1,
      path,
      now: Date.now(),
    })
  } catch (err: unknown) {
    revalidateLogger.error('Revalidation error', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Error during revalidation',
          details: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    )
  }
}

// ── GET /api/revalidate?secret=XXX&path=/some/path ───────────

export async function GET(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return missingSecretResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const secret = searchParams.get('secret')
    const path = searchParams.get('path')
    const tag = searchParams.get('tag')

    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return unauthorizedResponse()
    }

    // If a specific path is provided, revalidate just that path
    if (path) {
      revalidatePath(path, 'page')
      revalidateLogger.info('Path revalidated via GET', { action: 'revalidate-get', path } as Record<string, unknown>)

      // Notify IndexNow (fire-and-forget)
      import('@/lib/seo/indexnow')
        .then(({ submitToIndexNow }) => submitToIndexNow([path]))
        .catch(() => {})

      return NextResponse.json({
        success: true,
        revalidated: 1,
        path,
        now: Date.now(),
      })
    }

    // If a specific tag is provided, revalidate that tag
    if (tag) {
      revalidateTag(tag)
      revalidateLogger.info('Tag revalidated via GET', { action: 'revalidate-get', tag } as Record<string, unknown>)

      return NextResponse.json({
        success: true,
        revalidated: 1,
        tag,
        now: Date.now(),
      })
    }

    // No path or tag specified — revalidate common pages
    const commonPaths = [
      '/',
      '/practice-areas',
      '/states',
    ]

    for (const p of commonPaths) {
      revalidatePath(p, 'page')
    }

    revalidateLogger.info('Common pages revalidated via GET', { action: 'revalidate-common', paths: commonPaths } as Record<string, unknown>)

    return NextResponse.json({
      success: true,
      revalidated: commonPaths.length,
      paths: commonPaths,
      now: Date.now(),
    })
  } catch (err: unknown) {
    revalidateLogger.error('Revalidation GET error', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Error during revalidation',
          details: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    )
  }
}
