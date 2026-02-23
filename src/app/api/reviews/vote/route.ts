/**
 * Review Vote API - ServicesArtisans
 * Handles "Was this review helpful?" votes
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// POST request schema
const voteSchema = z.object({
  reviewId: z.string().uuid(),
  isHelpful: z.boolean().optional().default(true),
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const body = await request.json()
    const result = voteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request', details: result.error.flatten() }, { status: 400 })
    }
    const { reviewId } = result.data

    // Read current helpful_count
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
    }

    // Increment helpful_count
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ helpful_count: (review.helpful_count ?? 0) + 1 })
      .eq('id', reviewId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Review vote error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
