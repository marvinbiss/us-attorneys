import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// GET query params schema
const availabilityGetSchema = z.object({
  attorneyId: z.string().uuid(),
})

// POST request schema
const availabilityPostSchema = z.object({
  attorneyId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z.array(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })),
})

// DELETE query params schema
const availabilityDeleteSchema = z.object({
  slotId: z.string().uuid(),
})

// GET /api/availability - Get attorney's availability settings
// Note: availability_settings table was removed in migration 100
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const queryParams = {
    attorneyId: searchParams.get('attorneyId'),
  }
  const result = availabilityGetSchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }

  return NextResponse.json({
    settings: null,
    message: 'Availability settings not available',
  })
}

// POST /api/availability - Create or update availability slots
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = availabilityPostSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Validation error', details: result.error.flatten() } },
        { status: 400 }
      )
    }
    const { attorneyId, slots, date } = result.data

    const supabase = await createClient()

    // Verify ownership: attorneyId must match the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      )
    }
    if (result.data.attorneyId !== user.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Delete existing slots for this date
    await supabase
      .from('availability_slots')
      .delete()
      .eq('attorney_id', attorneyId)
      .eq('date', date)

    // Insert new slots
    const slotsToInsert = slots.map((slot: { start: string; end: string }) => ({
      attorney_id: attorneyId,
      date: date,
      start_time: slot.start,
      end_time: slot.end,
      is_available: true,
    }))

    const { data: newSlots, error: insertError } = await supabase
      .from('availability_slots')
      .insert(slotsToInsert)
      .select()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      slots: newSlots,
    })
  } catch (error: unknown) {
    logger.error('Error updating availability:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error updating availability' } },
      { status: 500 }
    )
  }
}

// PUT /api/availability - Update availability settings
// Note: availability_settings table was removed in migration 100
export async function PUT(_request: Request) {
  return NextResponse.json(
    { success: false, error: { message: 'Feature not available' } },
    { status: 501 }
  )
}

// DELETE /api/availability - Delete a slot
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const queryParams = {
    slotId: searchParams.get('slotId'),
  }
  const result = availabilityDeleteSchema.safeParse(queryParams)
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid parameters', details: result.error.flatten() } },
      { status: 400 }
    )
  }
  const { slotId } = result.data

  try {
    const supabase = await createClient()

    // Auth guard: require authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 })
    }

    // Check if slot has a booking
    const { data: slot, error: slotError } = await supabase
      .from('availability_slots')
      .select('*, booking:bookings(*)')
      .eq('id', slotId)
      .single()

    if (slotError) throw slotError

    // Ownership check: only the attorney who owns the slot can delete it
    if (slot?.attorney_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { message: 'You are not authorized to delete this slot' } },
        { status: 403 }
      )
    }

    if (slot?.booking && slot.booking.length > 0) {
      return NextResponse.json(
        { success: false, error: { message: 'This slot has a booking and cannot be deleted' } },
        { status: 400 }
      )
    }

    // Delete the slot
    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Error deleting slot:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Error deleting slot' } },
      { status: 500 }
    )
  }
}
