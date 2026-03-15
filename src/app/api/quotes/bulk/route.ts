import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const bulkStatusUpdateSchema = z.object({
  quote_ids: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(['read', 'responded', 'converted', 'cancelled']),
})

const bulkDeleteSchema = z.object({
  quote_ids: z.array(z.string().uuid()).min(1).max(50),
})

// PATCH /api/quotes/bulk - Bulk update quote status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Get provider for this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'Profil attorney not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = bulkStatusUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const { quote_ids, status } = parsed.data

    // Verify all quotes belong to this provider
    const { data: quotes, error: checkError } = await supabase
      .from('quotes')
      .select('id')
      .in('id', quote_ids)
      .eq('attorney_id', provider.id)

    if (checkError) throw checkError

    if (!quotes || quotes.length !== quote_ids.length) {
      return NextResponse.json(
        { success: false, error: { message: 'Certaines demandes ne vous appartiennent pas' } },
        { status: 403 }
      )
    }

    const updates: Record<string, unknown> = { status }
    if (status === 'read') updates.read_at = new Date().toISOString()
    if (status === 'responded') updates.first_response_at = new Date().toISOString()
    if (status === 'converted') updates.converted_at = new Date().toISOString()

    const { error } = await supabase
      .from('quotes')
      .update(updates)
      .in('id', quote_ids)
      .eq('attorney_id', provider.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      updated: quote_ids.length,
    })
  } catch (error) {
    logger.error('Bulk update quotes error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// DELETE /api/quotes/bulk - Bulk delete quotes
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Get provider for this user
    const { data: provider } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'Profil attorney not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = bulkDeleteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const { quote_ids } = parsed.data

    const { error } = await supabase
      .from('quotes')
      .delete()
      .in('id', quote_ids)
      .eq('attorney_id', provider.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      deleted: quote_ids.length,
    })
  } catch (error) {
    logger.error('Bulk delete quotes error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
