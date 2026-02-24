import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const revalidateSchema = z.object({
  path: z.string().min(1, 'Path requis'),
  secret: z.string().min(1, 'Secret requis'),
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Erreur de configuration serveur' } }, { status: 500 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: { message: 'Données invalides' } }, { status: 400 })
    }

    const result = revalidateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Données invalides' } }, { status: 400 })
    }

    const { path, secret } = result.data

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
      '/services/plombier/paris',
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
