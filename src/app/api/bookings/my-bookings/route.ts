/**
 * GET /api/bookings/my-bookings
 * Returns bookings for the authenticated client (matched by client_id or client_email).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Fetch bookings where client_id matches OR client_email matches
    const { data: bookings, error } = await adminSupabase
      .from('bookings')
      .select(`
        id, attorney_id, specialty_id, scheduled_at, duration_minutes, status,
        daily_room_url, booking_fee, client_email, client_name, client_phone,
        notes, cancellation_reason, created_at, updated_at
      `)
      .or(`client_id.eq.${user.id},client_email.eq.${user.email}`)
      .order('scheduled_at', { ascending: false })

    if (error) {
      apiLogger.error('Error fetching client bookings', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Fetch attorney names for all bookings
    const attorneyIds = Array.from(new Set((bookings || []).map((b) => b.attorney_id)))
    let attorneyMap: Record<string, string> = {}

    if (attorneyIds.length > 0) {
      const { data: attorneys } = await adminSupabase
        .from('attorneys')
        .select('id, name')
        .in('id', attorneyIds)

      if (attorneys) {
        attorneyMap = Object.fromEntries(attorneys.map((a) => [a.id, a.name || 'Attorney']))
      }
    }

    // Fetch specialty names
    const specialtyIds = Array.from(new Set((bookings || []).filter((b) => b.specialty_id).map((b) => b.specialty_id as string)))
    let specialtyMap: Record<string, string> = {}

    if (specialtyIds.length > 0) {
      const { data: specialties } = await adminSupabase
        .from('specialties')
        .select('id, name')
        .in('id', specialtyIds)

      if (specialties) {
        specialtyMap = Object.fromEntries(specialties.map((s) => [s.id, s.name]))
      }
    }

    const enrichedBookings = (bookings || []).map((b) => ({
      ...b,
      attorney_name: attorneyMap[b.attorney_id] || 'Attorney',
      specialty_name: b.specialty_id ? (specialtyMap[b.specialty_id] || null) : null,
    }))

    return NextResponse.json({ success: true, data: { bookings: enrichedBookings } })
  } catch (err: unknown) {
    apiLogger.error('Unexpected error in my-bookings', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
