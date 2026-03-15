import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const bulkUpdateSchema = z.object({
  attorney_ids: z.array(z.string().uuid()).min(1).max(100),
  updates: z.object({
    is_active: z.boolean().optional(),
    is_verified: z.boolean().optional(),
  }),
})

const bulkDeleteSchema = z.object({
  attorney_ids: z.array(z.string().uuid()).min(1).max(100),
  hard_delete: z.boolean().default(false),
})

// PATCH /api/attorneys/bulk - Bulk update providers
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

    const body = await request.json()
    const parsed = bulkUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data', details: parsed.error.issues } },
        { status: 400 }
      )
    }

    const { attorney_ids, updates } = parsed.data

    const { data, error } = await supabase
      .from('attorneys')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', attorney_ids)
      .eq('user_id', user.id)
      .select('id')

    if (error) throw error

    return NextResponse.json({
      success: true,
      updated: data?.length || 0,
    })
  } catch (error) {
    logger.error('Bulk update providers error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}

// DELETE /api/attorneys/bulk - Bulk delete providers
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

    const body = await request.json()
    const parsed = bulkDeleteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid data' } },
        { status: 400 }
      )
    }

    const { attorney_ids, hard_delete } = parsed.data

    if (hard_delete) {
      const { error } = await supabase
        .from('attorneys')
        .delete()
        .in('id', attorney_ids)
        .eq('user_id', user.id)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('attorneys')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in('id', attorney_ids)
        .eq('user_id', user.id)

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      deleted: attorney_ids.length,
    })
  } catch (error) {
    logger.error('Bulk delete providers error', error)
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    )
  }
}
