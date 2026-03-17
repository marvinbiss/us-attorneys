import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/admin-auth'
import { createApiHandler } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

export const GET = createApiHandler(async ({ params }) => {
  const authResult = await requirePermission('prospection', 'read')
  if (!authResult.success) return authResult.error!

  const id = params?.id
  if (!id) {
    return NextResponse.json(
      { success: false, error: { message: 'Missing ID' } },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: call, error } = await supabase
    .from('voice_calls')
    .select('id, conversation_id, contact_id, lead_id, vapi_call_id, twilio_call_sid, caller_phone, direction, status, started_at, ended_at, duration_seconds, recording_url, transcription, summary, qualification_score, qualification_data, vapi_cost, consent_recording, created_at, updated_at, contact:contact_id(id, contact_name, phone_e164, email, postal_code, city)')
    .eq('id', id)
    .single()

  if (error || !call) {
    return NextResponse.json(
      { success: false, error: { message: 'Call not found' } },
      { status: 404 }
    )
  }

  // Fetch conversation messages if conversation exists
  let messages = null
  if (call.conversation_id) {
    const { data } = await supabase
      .from('prospection_conversation_messages')
      .select('id, conversation_id, direction, sender_type, content, ai_provider, ai_model, ai_prompt_tokens, ai_completion_tokens, ai_cost, external_id, created_at')
      .eq('conversation_id', call.conversation_id)
      .order('created_at', { ascending: true })
    messages = data
  }

  return NextResponse.json({
    success: true,
    data: { call, messages },
  })
})
