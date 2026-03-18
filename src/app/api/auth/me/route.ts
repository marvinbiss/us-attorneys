/**
 * GET /api/auth/me — Return current user profile info
 * Used by ClaimButton to prefill form fields
 */

import { createClient } from '@/lib/supabase/server'
import { createApiHandler, apiSuccess, apiError } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async () => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return apiError('AUTHENTICATION_ERROR', 'Not authenticated', 401)
    }

    // Use RLS-respecting client — user can read their own profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', user.id)
      .single()

    return apiSuccess({
      user: {
        id: user.id,
        email: profile?.email || user.email || '',
        fullName: profile?.full_name || '',
        phone: '',
        role: profile?.role || 'client',
      },
    })
}, {})
