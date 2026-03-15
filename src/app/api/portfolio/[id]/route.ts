/**
 * Portfolio Item API
 * GET: Get single portfolio item
 * PUT: Update portfolio item
 * DELETE: Delete portfolio item
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const updatePortfolioSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  before_image_url: z.string().url().optional().nullable(),
  after_image_url: z.string().url().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional().nullable(),
  media_type: z.enum(['image', 'video', 'before_after']).optional(),
  is_featured: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
})

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is an attorney
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'attorney') {
      return NextResponse.json(
        { error: 'Access reserved for attorneys' },
        { status: 403 }
      )
    }

    // Fetch portfolio item
    const { data: item, error } = await supabase
      .from('portfolio_items')
      .select('id, attorney_id, title, description, image_url, thumbnail_url, category, tags, is_featured, display_order, created_at, media_type, video_url, before_image_url, after_image_url, is_visible')
      .eq('id', id)
      .eq('attorney_id', user.id)
      .single()

    if (error || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item })
  } catch (error) {
    logger.error('Portfolio item GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is an attorney
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'attorney') {
      return NextResponse.json(
        { error: 'Access reserved for attorneys' },
        { status: 403 }
      )
    }

    // Verify ownership
    const { data: existingItem, error: fetchError } = await supabase
      .from('portfolio_items')
      .select('id')
      .eq('id', id)
      .eq('attorney_id', user.id)
      .single()

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { error: 'Item not found or access denied' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const result = updatePortfolioSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // Update portfolio item
    const { data: item, error: updateError } = await supabase
      .from('portfolio_items')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating portfolio item:', updateError)
      return NextResponse.json(
        { error: 'Error during update' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item,
      message: 'Item updated',
    })
  } catch (error) {
    logger.error('Portfolio item PUT error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is an attorney
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'attorney') {
      return NextResponse.json(
        { error: 'Access reserved for attorneys' },
        { status: 403 }
      )
    }

    // Get item to delete (also verifies ownership)
    const { data: item, error: fetchError } = await supabase
      .from('portfolio_items')
      .select('id')
      .eq('id', id)
      .eq('attorney_id', user.id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json(
        { error: 'Item not found or access denied' },
        { status: 404 }
      )
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('Error deleting portfolio item:', deleteError)
      return NextResponse.json(
        { error: 'Error during deletion' },
        { status: 500 }
      )
    }

    // Note: Storage cleanup should be handled separately or via a trigger
    // The files in Supabase Storage can be cleaned up via a scheduled job
    // or immediately if we have the deleteFile function available server-side

    return NextResponse.json({
      success: true,
      message: 'Item deleted',
    })
  } catch (error) {
    logger.error('Portfolio item DELETE error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
