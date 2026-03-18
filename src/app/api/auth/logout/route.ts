import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { apiSuccess, apiError } from '@/lib/api/handler'

export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return apiError('AUTHENTICATION_ERROR', 'Error during logout', 500)
    }

    return apiSuccess({ message: 'Logout successful' })
  } catch (error: unknown) {
    logger.error('Logout error', error)
    return apiError('INTERNAL_ERROR', 'Server error', 500)
  }
}
