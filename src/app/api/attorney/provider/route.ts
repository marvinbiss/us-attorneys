/**
 * Attorney Provider API
 * GET: Fetch attorney's provider data
 * PUT: Update attorney's provider data
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { providerAttorneyUpdateSchema } from '@/schemas/provider'
// DOMPurify lazy-imported inside PUT to avoid JSDOM crash in serverless cold start

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is an attorney
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'attorney') {
      return NextResponse.json(
        { error: 'Access reserved for attorneys' },
        { status: 403 }
      )
    }

    // Fetch provider by user_id — includes all fields editable in the profile tabs
    const { data: provider, error: attorneyError } = await supabase
      .from('attorneys')
      .select('id, stable_id, name, slug, email, phone, website, bar_number, description, bio, address_line1, address_city, address_zip, address_state, address_county, latitude, longitude, is_verified, is_active, noindex, rating_average, review_count, user_id, created_at, updated_at, profile_image_url, specialty:specialties!primary_specialty_id(name, slug)')
      .eq('user_id', user.id)
      .single()

    if (attorneyError || !provider) {
      return NextResponse.json(
        { error: 'No attorney profile found. Contact support.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ provider })
  } catch (error: unknown) {
    logger.error('Provider GET error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is an attorney
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (profile.role !== 'attorney') {
      return NextResponse.json(
        { error: 'Access reserved for attorneys' },
        { status: 403 }
      )
    }

    // Get provider by user_id (need provider.id for update)
    const { data: provider, error: attorneyError } = await supabase
      .from('attorneys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (attorneyError || !provider) {
      return NextResponse.json(
        { error: 'No attorney profile found. Contact support.' },
        { status: 404 }
      )
    }

    // Parse + validate body
    const body = await request.json()
    const result = providerAttorneyUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const validated = result.data

    // Sanitize text fields
    const updateData: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(validated)) {
      if (value === undefined) continue

      if (key === 'description') {
        // Strip all HTML tags from description
        if (typeof value === 'string') {
          const { default: DOMPurify } = await import('isomorphic-dompurify')
          updateData[key] = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
        } else {
          updateData[key] = value
        }
      } else if (key === 'name') {
        // Trim name
        updateData[key] = typeof value === 'string' ? value.trim() : value
      } else if (typeof value === 'string') {
        // Trim all other string fields
        updateData[key] = value.trim()
      } else {
        updateData[key] = value
      }
    }

    // Update providers table
    const { data: updated, error: updateError } = await supabase
      .from('attorneys')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', provider.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating provider:', updateError)
      return NextResponse.json(
        { error: 'Error updating attorney profile' },
        { status: 500 }
      )
    }

    // Sync overlapping fields to profiles (best-effort, fire and forget)
    const profileData: Record<string, unknown> = {}

    // Only sync columns that exist on profiles table
    if (updateData.name !== undefined) profileData.full_name = updateData.name
    if (updateData.email !== undefined) profileData.email = updateData.email

    if (Object.keys(profileData).length > 0) {
      supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then(({ error: syncError }) => {
          if (syncError) {
            logger.error('Error syncing provider data to profile:', syncError)
          }
        })
    }

    return NextResponse.json({
      success: true,
      provider: updated,
    })
  } catch (error: unknown) {
    logger.error('Provider PUT error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
