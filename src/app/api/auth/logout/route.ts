import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 1004,
            message: 'Error during logout'
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error('Logout error', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 9999,
          message: 'Server error'
        }
      },
      { status: 500 }
    )
  }
}
