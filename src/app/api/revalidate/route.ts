import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema pour revalidation single path (rétrocompatible)
const revalidateSingleSchema = z.object({
  path: z.string().min(1, 'Path requis'),
  secret: z.string().min(1, 'Secret requis'),
})

// Schema pour revalidation batch
const revalidateBatchSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(50, 'Maximum 50 paths par batch'),
})

const MAX_BATCH_SIZE = 50

export async function POST(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Erreur de configuration serveur' } }, { status: 500 })
    }

    // Vérifier l'auth via Bearer token OU champ secret dans le body
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: { message: 'Données invalides' } }, { status: 400 })
    }

    // Mode batch : { paths: [...] } avec Bearer auth
    const batchResult = revalidateBatchSchema.safeParse(body)
    if (batchResult.success) {
      // Auth via Bearer token obligatoire pour le batch
      if (!bearerToken || bearerToken !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ success: false, error: { message: 'Secret invalide' } }, { status: 401 })
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

      // Notifier IndexNow pour tous les paths revalidés (fire-and-forget)
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

    // Mode single (rétrocompatible) : { path, secret }
    const singleResult = revalidateSingleSchema.safeParse(body)
    if (!singleResult.success) {
      return NextResponse.json({ success: false, error: { message: 'Données invalides — envoyez { path, secret } ou { paths: [...] } avec Bearer auth' } }, { status: 400 })
    }

    const { path, secret } = singleResult.data

    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Secret invalide' } }, { status: 401 })
    }

    // Revalider le chemin
    revalidatePath(path, 'page')

    // Notifier IndexNow (fire-and-forget)
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
      { success: false, error: { message: 'Erreur lors de la revalidation', details: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    )
  }
}

// GET pour revalider plusieurs pages courantes
export async function GET(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Erreur de configuration serveur' } }, { status: 500 })
    }

    const searchParams = request.nextUrl.searchParams
    const secret = searchParams.get('secret')

    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Secret invalide' } }, { status: 401 })
    }

    // Revalider les pages principales
    const paths = [
      '/practice-areas/plombier/paris',
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
      { success: false, error: { message: 'Erreur lors de la revalidation', details: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    )
  }
}
