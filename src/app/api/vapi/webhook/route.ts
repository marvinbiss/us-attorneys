import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { verifyVapiSignature } from '@/lib/voice/webhook-security'
import {
  VOICE_QUALIFICATION_SYSTEM_PROMPT,
  VAPI_FUNCTIONS,
  calculateQualificationScore,
  isInServiceArea,
} from '@/lib/voice/qualification'
import type {
  VapiWebhookEvent,
  QualificationData,
  VapiAssistantResponse,
} from '@/types/voice-qualification'

export const maxDuration = 30

// ---------------------------------------------------------------------------
// POST /api/vapi/webhook — Main Vapi webhook handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Verify signature (skip in development if no secret configured)
  const signature = request.headers.get('x-vapi-signature') || ''
  if (process.env.VAPI_WEBHOOK_SECRET && !verifyVapiSignature(rawBody, signature)) {
    logger.warn('Vapi webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event: VapiWebhookEvent
  try {
    event = JSON.parse(rawBody) as VapiWebhookEvent
  } catch {
    logger.error('Vapi webhook: invalid JSON')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.message?.type
  logger.info('Vapi webhook received', { type: eventType, callId: event.message?.call?.id })

  try {
    switch (eventType) {
      case 'assistant-request':
        return handleAssistantRequest()
      case 'function-call':
        return await handleFunctionCall(event)
      case 'status-update':
        return await handleStatusUpdate(event)
      case 'end-of-call-report':
        return await handleEndOfCallReport(event)
      case 'transcript':
        // Real-time transcript — just acknowledge
        return NextResponse.json({ ok: true })
      default:
        return NextResponse.json({ ok: true })
    }
  } catch (error) {
    logger.error('Vapi webhook error', { error, eventType })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// assistant-request — Vapi asks for assistant configuration at call start
// ---------------------------------------------------------------------------

function handleAssistantRequest(): NextResponse {
  const response: VapiAssistantResponse = {
    assistant: {
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        systemMessage: VOICE_QUALIFICATION_SYSTEM_PROMPT,
        functions: VAPI_FUNCTIONS,
        temperature: 0.7,
      },
      voice: {
        provider: '11labs',
        voiceId: 'charlotte',
        stability: 0.7,
        similarityBoost: 0.8,
      },
      firstMessage:
        "Bonjour, bienvenue chez ServicesArtisans ! Je suis Sophie, votre conseillère en rénovation énergétique. Cet appel peut être enregistré à des fins de qualité. Comment puis-je vous aider aujourd'hui ?",
      endCallMessage: 'Merci pour votre appel et bonne journée !',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'fr',
      },
      recordingEnabled: true,
    },
  }

  return NextResponse.json(response)
}

// ---------------------------------------------------------------------------
// function-call — Claude invokes a function during the call
// ---------------------------------------------------------------------------

async function handleFunctionCall(event: VapiWebhookEvent): Promise<NextResponse> {
  const functionCall = event.message.functionCall
  if (!functionCall) {
    return NextResponse.json({ result: 'No function call data' })
  }

  const supabase = createAdminClient()
  const callId = event.message.call?.id

  switch (functionCall.name) {
    case 'save_qualification': {
      const data = functionCall.parameters as unknown as QualificationData
      const score = calculateQualificationScore(data)

      if (callId) {
        await supabase
          .from('voice_calls')
          .update({
            qualification_score: score,
            qualification_data: data,
          })
          .eq('vapi_call_id', callId)
      }

      logger.info('Voice qualification saved', { callId, score, projectType: data.project_type })

      if (score === 'disqualified') {
        const reason = !data.is_homeowner
          ? 'non propriétaire'
          : 'zone non couverte'
        return NextResponse.json({
          result: `Le prospect ne correspond pas à nos critères : ${reason}. Terminez poliment l'appel.`,
        })
      }

      return NextResponse.json({
        result: `Qualification enregistrée avec succès. Score : ${score}. ${
          score === 'A'
            ? 'Excellent prospect, proposez un transfert immédiat.'
            : score === 'B'
            ? 'Bon prospect, proposez un rappel sous 24h.'
            : 'Prospect à suivre, proposez un rappel.'
        }`,
      })
    }

    case 'check_service_area': {
      const postalCode = functionCall.parameters.postal_code as string
      const covered = isInServiceArea(postalCode)

      return NextResponse.json({
        result: covered
          ? 'Le code postal est dans notre zone de service. Continuez la qualification.'
          : "Malheureusement, nous ne couvrons pas encore cette zone. Informez poliment le prospect et terminez l'appel.",
      })
    }

    case 'transfer_to_artisan': {
      // For now, log the transfer request — live transfer requires Vapi phone config
      logger.info('Transfer requested', {
        callId,
        projectType: functionCall.parameters.project_type,
        postalCode: functionCall.parameters.postal_code,
      })

      return NextResponse.json({
        result: "Le transfert a été initié. Informez le prospect qu'un artisan va le rappeler dans les plus brefs délais.",
      })
    }

    default:
      return NextResponse.json({ result: 'Unknown function' })
  }
}

// ---------------------------------------------------------------------------
// status-update — call.started, call.ended
// ---------------------------------------------------------------------------

async function handleStatusUpdate(event: VapiWebhookEvent): Promise<NextResponse> {
  const supabase = createAdminClient()
  const status = event.message.status?.status
  const call = event.message.call

  if (!call?.id) return NextResponse.json({ ok: true })

  if (status === 'in-progress') {
    const callerPhone = call.customer?.number || 'unknown'

    // Upsert contact in prospection_contacts
    let contactId: string | null = null

    if (callerPhone !== 'unknown') {
      const { data: existingContact } = await supabase
        .from('prospection_contacts')
        .select('id')
        .eq('phone_e164', callerPhone)
        .single()

      if (existingContact) {
        contactId = existingContact.id
      } else {
        const { data: newContact } = await supabase
          .from('prospection_contacts')
          .insert({
            contact_type: 'client',
            phone: callerPhone,
            phone_e164: callerPhone,
            source: 'api',
            consent_status: 'unknown',
            tags: ['voice_lead'],
          })
          .select('id')
          .single()
        contactId = newContact?.id || null
      }
    }

    // Create conversation
    const { data: conversation } = await supabase
      .from('prospection_conversations')
      .insert({
        contact_id: contactId,
        channel: 'voice',
        status: 'ai_handling',
      })
      .select('id')
      .single()

    // Create voice_call
    await supabase.from('voice_calls').insert({
      vapi_call_id: call.id,
      twilio_call_sid: call.phoneCallProviderId || null,
      contact_id: contactId,
      conversation_id: conversation?.id || null,
      caller_phone: callerPhone,
      direction: 'inbound',
      status: 'in_progress',
    })

    logger.info('Voice call started', { callId: call.id, callerPhone })
  }

  if (status === 'ended') {
    await supabase
      .from('voice_calls')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: call.duration || null,
      })
      .eq('vapi_call_id', call.id)

    logger.info('Voice call ended', { callId: call.id, duration: call.duration })
  }

  return NextResponse.json({ ok: true })
}

// ---------------------------------------------------------------------------
// end-of-call-report — Final report with recording, transcript, summary
// ---------------------------------------------------------------------------

async function handleEndOfCallReport(event: VapiWebhookEvent): Promise<NextResponse> {
  const supabase = createAdminClient()
  const call = event.message.call
  const recordingUrl = event.message.recordingUrl as string | undefined
  const transcript = event.message.transcript as string | undefined
  const summary = event.message.summary as string | undefined
  const cost = event.message.cost as number | undefined

  if (!call?.id) return NextResponse.json({ ok: true })

  // Update voice_call with final data
  const { data: voiceCall } = await supabase
    .from('voice_calls')
    .update({
      recording_url: recordingUrl || null,
      transcription: transcript || null,
      summary: summary || null,
      vapi_cost: cost || 0,
      status: 'completed',
      ended_at: new Date().toISOString(),
    })
    .eq('vapi_call_id', call.id)
    .select('id, contact_id, conversation_id, qualification_score, qualification_data')
    .single()

  if (!voiceCall) {
    logger.warn('Voice call not found for end-of-call report', { callId: call.id })
    return NextResponse.json({ ok: true })
  }

  // Save transcription as conversation message
  if (transcript && voiceCall.conversation_id) {
    await supabase.from('prospection_conversation_messages').insert({
      conversation_id: voiceCall.conversation_id,
      direction: 'inbound',
      sender_type: 'system',
      content: `[Transcription appel vocal]\n\n${transcript}`,
    })
  }

  // Mark conversation as resolved
  if (voiceCall.conversation_id) {
    await supabase
      .from('prospection_conversations')
      .update({ status: 'resolved' })
      .eq('id', voiceCall.conversation_id)
  }

  logger.info('Voice call report processed', {
    callId: call.id,
    score: voiceCall.qualification_score,
    hasRecording: !!recordingUrl,
    hasTranscript: !!transcript,
  })

  return NextResponse.json({ ok: true })
}
