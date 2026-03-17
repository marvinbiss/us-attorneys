/**
 * GET /api/auth/me — Return current user profile info
 * Used by ClaimButton to prefill form fields
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createApiHandler } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async () => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: profile?.email || user.email || '',
        fullName: profile?.full_name || '',
        phone: '',
        role: profile?.role || 'client',
      },
    })
}, {})
