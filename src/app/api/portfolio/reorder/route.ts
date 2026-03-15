/**
 * Portfolio Reorder API
 * PUT: Update display_order for multiple portfolio items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().min(0),
    })
  ).min(1).max(100),
})

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Verify user is an artisan
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'artisan') {
      return NextResponse.json(
        { error: 'Accès réservé aux artisans' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const result = reorderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { items } = result.data

    // Verify all items belong to the user
    const itemIds = items.map((i) => i.id)
    const { data: existingItems, error: fetchError } = await supabase
      .from('portfolio_items')
      .select('id')
      .eq('attorney_id', user.id)
      .in('id', itemIds)

    if (fetchError) {
      logger.error('Error verifying portfolio items:', fetchError)
      return NextResponse.json(
        { error: 'Erreur de vérification' },
        { status: 500 }
      )
    }

    const existingIds = new Set(existingItems?.map((i) => i.id) || [])
    const unauthorizedIds = itemIds.filter((id) => !existingIds.has(id))

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: 'Certains éléments ne vous appartiennent pas' },
        { status: 403 }
      )
    }

    // Update display_order for each item
    const updates = items.map((item) =>
      supabase
        .from('portfolio_items')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    const errors = results.filter((r) => r.error)

    if (errors.length > 0) {
      logger.error('Errors reordering portfolio items:', errors)
      return NextResponse.json(
        { error: 'Erreur lors du réordonnancement' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ordre mis à jour',
    })
  } catch (error) {
    logger.error('Portfolio reorder error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
