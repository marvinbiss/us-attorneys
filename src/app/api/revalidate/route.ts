import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for single path revalidation (backward-compatible)
const revalidateSingleSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  secret: z.string().min(1, 'Secret is required'),
})

// Schema for batch revalidation
const revalidateBatchSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(50, 'Maximum 50 paths per batch'),
})

const MAX_BATCH_SIZE = 50

export async function POST(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Server configuration error' } }, { status: 500 })
    }

    // Verify auth via Bearer token OR secret field in body
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: { message: 'Invalid data' } }, { status: 400 })
    }

    // Batch mode: { paths: [...] } with Bearer auth
    const batchResult = revalidateBatchSchema.safeParse(body)
    if (batchResult.success) {
      // Bearer token auth required for batch mode
      if (!bearerToken || bearerToken !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ success: false, error: { message: 'Invalid secret' } }, { status: 401 })
      }

      const { paths } = batchResult.data
      const revalidated: string[] = []
      const errors: string[] = []

      for (const path of paths.slice(0, MAX_BATCH_SIZE)) {
        try {
          revalidatePath(path, 'page')
          revalidated.push(path)
        } catch {
          errors.push(path)
        }
      }

      // Notify IndexNow for all revalidated paths (fire-and-forget)
      if (revalidated.length > 0) {
        import('@/lib/seo/indexnow')
          .then(({ submitToIndexNow }) => submitToIndexNow(revalidated))
          .catch(() => {})
      }

      return NextResponse.json({
        revalidated: true,
        paths: revalidated,
        errors: errors.length > 0 ? errors : undefined,
        now: Date.now(),
      })
    }

    // Single mode (backward-compatible): { path, secret }
    const singleResult = revalidateSingleSchema.safeParse(body)
    if (!singleResult.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid data — send { path, secret } or { paths: [...] } with Bearer auth' } }, { status: 400 })
    }

    const { path, secret } = singleResult.data

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Invalid secret' } }, { status: 401 })
    }

    // Revalidate the path
    revalidatePath(path, 'page')

    // Notify IndexNow (fire-and-forget)
    import('@/lib/seo/indexnow')
      .then(({ submitToIndexNow }) => submitToIndexNow([path]))
      .catch(() => {})

    return NextResponse.json({
      revalidated: true,
      path,
      now: Date.now(),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: 'Error during revalidation', details: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    )
  }
}

// GET to revalidate common pages
export async function GET(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Server configuration error' } }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const secret = searchParams.get('secret')

    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Invalid secret' } }, { status: 401 })
    }

    // Revalidate main pages
    const paths = [
      '/practice-areas/personal-injury/new-york',
      '/services',
      '/',
    ]

    for (const path of paths) {
      revalidatePath(path, 'page')
    }

    return NextResponse.json({
      revalidated: true,
      paths,
      now: Date.now(),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: 'Error during revalidation', details: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    )
  }
}
