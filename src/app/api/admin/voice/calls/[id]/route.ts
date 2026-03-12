import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission('prospection', 'read')
    if (!authResult.success) return authResult.error

    const { id } = await params
    const supabase = createAdminClient()

    const { data: call, error } = await supabase
      .from('voice_calls')
      .select('*, contact:contact_id(id, contact_name, phone_e164, email, postal_code, city)')
      .eq('id', id)
      .single()

    if (error || !call) {
      return NextResponse.json(
        { success: false, error: { message: 'Appel non trouvé' } },
        { status: 404 }
      )
    }

    // Fetch conversation messages if conversation exists
    let messages = null
    if (call.conversation_id) {
      const { data } = await supabase
        .from('prospection_conversation_messages')
        .select('*')
        .eq('conversation_id', call.conversation_id)
        .order('created_at', { ascending: true })
      messages = data
    }

    return NextResponse.json({
      success: true,
      data: { call, messages },
    })
  } catch (error) {
    logger.error('Voice call detail GET error', error as Error)
    return NextResponse.json(
      { success: false, error: { message: 'Erreur serveur' } },
      { status: 500 }
    )
  }
}
