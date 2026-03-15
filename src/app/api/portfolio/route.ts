/**
 * Portfolio API
 * GET: List portfolio items for authenticated attorney
 * POST: Create new portfolio item
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createPortfolioSchema = z.object({
  title: z.string().min(3, 'Title must contain at least 3 characters').max(100),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url('Invalid image URL'),
  thumbnail_url: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  before_image_url: z.string().url().optional().nullable(),
  after_image_url: z.string().url().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional().nullable(),
  media_type: z.enum(['image', 'video', 'before_after']).default('image'),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const mediaType = searchParams.get('media_type')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('portfolio_items')
      .select('*', { count: 'exact' })
      .eq('attorney_id', user.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (mediaType) {
      query = query.eq('media_type', mediaType)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: items, error, count } = await query

    if (error) {
      logger.error('Error fetching portfolio items:', error)
      return NextResponse.json(
        { error: 'Error retrieving portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      items: items || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    logger.error('Portfolio GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Parse and validate request body
    const body = await request.json()
    const result = createPortfolioSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const data = result.data

    // Validate media_type specific fields
    if (data.media_type === 'video' && !data.video_url) {
      return NextResponse.json(
        { error: 'Video URL is required for video items' },
        { status: 400 }
      )
    }

    if (data.media_type === 'before_after' && (!data.before_image_url || !data.after_image_url)) {
      return NextResponse.json(
        { error: 'Before and after images are required' },
        { status: 400 }
      )
    }

    // Get the highest display_order
    const { data: lastItem } = await supabase
      .from('portfolio_items')
      .select('display_order')
      .eq('attorney_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastItem?.display_order || 0) + 1

    // Create portfolio item
    const { data: item, error: createError } = await supabase
      .from('portfolio_items')
      .insert({
        attorney_id: user.id,
        title: data.title,
        description: data.description,
        image_url: data.image_url,
        thumbnail_url: data.thumbnail_url,
        video_url: data.video_url,
        before_image_url: data.before_image_url,
        after_image_url: data.after_image_url,
        category: data.category,
        tags: data.tags,
        media_type: data.media_type,
        is_featured: data.is_featured,
        is_visible: data.is_visible,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (createError) {
      logger.error('Error creating portfolio item:', createError)
      return NextResponse.json(
        { error: 'Error creating item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item,
      message: 'Item added to portfolio',
    })
  } catch (error) {
    logger.error('Portfolio POST error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
