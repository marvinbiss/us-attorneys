import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { submitToIndexNow } from '@/lib/seo/indexnow'

const submitSchema = z.object({
  urls: z.array(z.string().max(500)).min(1).max(10000),
  secret: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = submitSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ success: false, error: { message: 'Paramètres invalides' } }, { status: 400 })
    }

    if (result.data.secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ success: false, error: { message: 'Secret invalide' } }, { status: 401 })
    }

    const indexResult = await submitToIndexNow(result.data.urls)

    return NextResponse.json({
      success: indexResult.success,
      submitted: indexResult.submitted,
      now: Date.now(),
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: 'Erreur lors de la soumission IndexNow', details: err instanceof Error ? err.message : String(err) } },
      { status: 500 }
    )
  }
}
