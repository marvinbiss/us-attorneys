/**
 * Client Profile API
 * GET: Fetch client profile
 * PUT: Update client profile
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

// PUT request schema
const updateClientProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
})

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_e164, average_rating, review_count, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Error retrieving profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    logger.error('Profile GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
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

    // Parse request body
    const body = await request.json()
    const result = updateClientProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const { full_name, phone } = result.data

    // Build update object with only defined fields
    const updateData: Record<string, string | undefined> = {
      updated_at: new Date().toISOString(),
    }
    if (full_name !== undefined) updateData.full_name = full_name
    if (phone !== undefined) updateData.phone_e164 = phone

    // Update profile — only columns that exist on profiles table
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Error updating profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    logger.error('Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
