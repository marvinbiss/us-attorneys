// Types for the Voice Qualification System (Vapi + ElevenLabs + Claude)

export type QualificationScore = 'A' | 'B' | 'C' | 'disqualified'
export type VoiceCallStatus = 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'voicemail'
export type VoiceCallDirection = 'inbound' | 'outbound'
export type VoiceVertical = 'family_law' | 'personal_injury' | 'criminal_defense'

export interface QualificationData {
  project_type: VoiceVertical
  urgency: 'urgent' | '3_months' | '6_months' | 'exploring'
  is_homeowner: boolean
  postal_code: string
  budget_range?: 'less_5000' | '5000_10000' | '10000_20000' | '20000_plus' | 'unknown'
  property_type?: 'house' | 'apartment'
  surface_sqft?: number
  case_complexity?: 'simple' | 'moderate' | 'complex' | 'litigation' | 'other'
  caller_name?: string
  caller_email?: string
  disqualification_reason?: 'not_homeowner' | 'outside_area' | 'wrong_vertical'
}

export interface VoiceCall {
  id: string
  conversation_id: string | null
  contact_id: string | null
  lead_id: string | null
  vapi_call_id: string
  twilio_call_sid: string | null
  caller_phone: string
  direction: VoiceCallDirection
  status: VoiceCallStatus
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  recording_url: string | null
  transcription: string | null
  summary: string | null
  qualification_score: QualificationScore | null
  qualification_data: QualificationData | null
  vapi_cost: number
  consent_recording: boolean
  created_at: string
  updated_at: string
}

export interface VoiceCallInsert {
  vapi_call_id: string
  twilio_call_sid?: string | null
  contact_id?: string | null
  conversation_id?: string | null
  caller_phone: string
  direction?: VoiceCallDirection
  status?: VoiceCallStatus
}

export interface VoiceLeadPricing {
  id: string
  vertical: VoiceVertical
  price_a: number
  price_b: number
  price_c: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VoiceStatsDaily {
  id: string
  date: string
  total_calls: number
  completed_calls: number
  avg_duration_seconds: number
  qualified_a: number
  qualified_b: number
  qualified_c: number
  disqualified: number
  leads_created: number
  leads_dispatched: number
  total_revenue: number
  total_vapi_cost: number
  created_at: string
}

// Vapi webhook event types
export type VapiEventType =
  | 'assistant-request'
  | 'function-call'
  | 'status-update'
  | 'transcript'
  | 'end-of-call-report'
  | 'hang'

export interface VapiWebhookEvent {
  message: {
    type: VapiEventType
    call?: VapiCallInfo
    status?: { status: string }
    functionCall?: {
      name: string
      parameters: Record<string, unknown>
    }
    recordingUrl?: string
    transcript?: string
    summary?: string
    cost?: number
    [key: string]: unknown
  }
}

export interface VapiCallInfo {
  id: string
  phoneCallProviderId?: string
  customer?: {
    number?: string
    name?: string
  }
  duration?: number
  [key: string]: unknown
}

export interface VapiAssistantResponse {
  assistant: {
    model: {
      provider: string
      model: string
      systemMessage: string
      functions: VapiFunctionSchema[]
      temperature: number
    }
    voice: {
      provider: string
      voiceId: string
      stability: number
      similarityBoost: number
    }
    firstMessage: string
    endCallMessage: string
    transcriber: {
      provider: string
      model: string
      language: string
    }
    recordingEnabled: boolean
  }
}

export interface VapiFunctionSchema {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}
