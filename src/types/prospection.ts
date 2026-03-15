// ============================================
// Types pour le Dashboard Prospection Multi-Canal
// ============================================

// --- Enums ---

export type ContactType = 'artisan' | 'client' | 'mairie'
export type ContactSource = 'import' | 'database' | 'manual' | 'api' | 'scraping'
export type ConsentStatus = 'opted_in' | 'opted_out' | 'unknown'
export type ProspectionChannel = 'email' | 'sms' | 'whatsapp' | 'voice'
export type AudienceType = 'artisan' | 'client' | 'mairie'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'cancelled'
export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed' | 'bounced' | 'opted_out' | 'cancelled'
export type AIProvider = 'claude' | 'openai'
export type ListType = 'static' | 'dynamic'
export type ConversationStatus = 'open' | 'ai_handling' | 'human_required' | 'resolved' | 'archived'
export type ConversationDirection = 'inbound' | 'outbound'
export type ConversationSenderType = 'contact' | 'ai' | 'human' | 'system'

// --- Contacts ---

export interface ProspectionContact {
  id: string
  contact_type: ContactType
  company_name: string | null
  contact_name: string | null
  email: string | null
  email_canonical: string | null
  phone: string | null
  phone_e164: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  department: string | null
  region: string | null
  location_code: string | null
  population: number | null
  attorney_id: string | null
  source: ContactSource
  source_file: string | null
  source_row: number | null
  tags: string[]
  custom_fields: Record<string, unknown>
  consent_status: ConsentStatus
  opted_out_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProspectionContactInsert {
  contact_type: ContactType
  company_name?: string | null
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
  department?: string | null
  region?: string | null
  location_code?: string | null
  population?: number | null
  attorney_id?: string | null
  source?: ContactSource
  source_file?: string | null
  source_row?: number | null
  tags?: string[]
  custom_fields?: Record<string, unknown>
  consent_status?: ConsentStatus
}

// --- Listes / Segments ---

export interface ProspectionList {
  id: string
  name: string
  description: string | null
  list_type: ListType
  filter_criteria: ListFilterCriteria | null
  contact_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ListFilterCriteria {
  contact_type?: ContactType
  department?: string
  region?: string
  city?: string
  tags?: string[]
  source?: ContactSource
  consent_status?: ConsentStatus
  has_email?: boolean
  has_phone?: boolean
}

export interface ProspectionListInsert {
  name: string
  description?: string | null
  list_type?: ListType
  filter_criteria?: ListFilterCriteria | null
  created_by?: string | null
}

export interface ProspectionListMember {
  list_id: string
  contact_id: string
  added_at: string
}

// --- Templates ---

export interface ProspectionTemplate {
  id: string
  name: string
  channel: ProspectionChannel
  audience_type: AudienceType | null
  subject: string | null
  body: string
  html_body: string | null
  whatsapp_template_name: string | null
  whatsapp_template_sid: string | null
  whatsapp_approved: boolean
  ai_system_prompt: string | null
  ai_context: Record<string, unknown>
  variables: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProspectionTemplateInsert {
  name: string
  channel: ProspectionChannel
  audience_type?: AudienceType | null
  subject?: string | null
  body: string
  html_body?: string | null
  whatsapp_template_name?: string | null
  whatsapp_template_sid?: string | null
  ai_system_prompt?: string | null
  ai_context?: Record<string, unknown>
  variables?: string[]
}

// --- Campagnes ---

export interface ProspectionCampaign {
  id: string
  name: string
  description: string | null
  channel: ProspectionChannel
  audience_type: AudienceType
  template_id: string | null
  list_id: string | null
  status: CampaignStatus
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  paused_at: string | null
  batch_size: number
  batch_delay_ms: number
  daily_send_limit: number
  ab_test_enabled: boolean
  ab_variant_b_template_id: string | null
  ab_split_percent: number
  ai_auto_reply: boolean
  ai_provider: AIProvider
  ai_model: string
  ai_system_prompt: string | null
  ai_max_tokens: number
  ai_temperature: number
  total_recipients: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  replied_count: number
  failed_count: number
  opted_out_count: number
  estimated_cost: number
  actual_cost: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Relations optionnelles
  template?: ProspectionTemplate
  list?: ProspectionList
}

export interface ProspectionCampaignInsert {
  name: string
  channel: ProspectionChannel
  audience_type: AudienceType
  description?: string | null
  template_id?: string | null
  list_id?: string | null
  scheduled_at?: string | null
  batch_size?: number
  batch_delay_ms?: number
  daily_send_limit?: number
  ab_test_enabled?: boolean
  ab_variant_b_template_id?: string | null
  ab_split_percent?: number
  ai_auto_reply?: boolean
  ai_provider?: AIProvider
  ai_model?: string
  ai_system_prompt?: string | null
  ai_max_tokens?: number
  ai_temperature?: number
}

// --- Messages ---

export interface ProspectionMessage {
  id: string
  campaign_id: string
  contact_id: string
  channel: ProspectionChannel
  rendered_body: string | null
  rendered_subject: string | null
  ab_variant: 'A' | 'B'
  external_id: string | null
  status: MessageStatus
  queued_at: string
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  replied_at: string | null
  failed_at: string | null
  error_code: string | null
  error_message: string | null
  retry_count: number
  max_retries: number
  next_retry_at: string | null
  cost: number
  created_at: string
  // Relations optionnelles
  contact?: ProspectionContact
  campaign?: ProspectionCampaign
}

export interface ProspectionMessageInsert {
  campaign_id: string
  contact_id: string
  channel: ProspectionChannel
  rendered_body?: string | null
  rendered_subject?: string | null
  ab_variant?: 'A' | 'B'
  status?: MessageStatus
  cost?: number
}

// --- Conversations ---

export interface ProspectionConversation {
  id: string
  campaign_id: string | null
  contact_id: string
  message_id: string | null
  channel: ProspectionChannel
  status: ConversationStatus
  ai_provider: AIProvider | null
  ai_model: string | null
  ai_replies_count: number
  assigned_to: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  // Relations optionnelles
  contact?: ProspectionContact
  campaign?: ProspectionCampaign
  messages?: ProspectionConversationMessage[]
}

export interface ProspectionConversationMessage {
  id: string
  conversation_id: string
  direction: ConversationDirection
  sender_type: ConversationSenderType
  content: string
  ai_provider: string | null
  ai_model: string | null
  ai_prompt_tokens: number | null
  ai_completion_tokens: number | null
  ai_cost: number
  external_id: string | null
  created_at: string
}

export interface ProspectionConversationInsert {
  contact_id: string
  campaign_id?: string | null
  message_id?: string | null
  channel: ProspectionChannel
  status?: ConversationStatus
  ai_provider?: AIProvider | null
  ai_model?: string | null
}

export interface ProspectionConversationMessageInsert {
  conversation_id: string
  direction: ConversationDirection
  sender_type: ConversationSenderType
  content: string
  ai_provider?: string | null
  ai_model?: string | null
  ai_prompt_tokens?: number | null
  ai_completion_tokens?: number | null
  ai_cost?: number
  external_id?: string | null
}

// --- AI Settings ---

export interface ProspectionAISettings {
  id: string
  default_provider: AIProvider
  claude_model: string
  claude_api_key_set: boolean
  claude_max_tokens: number
  claude_temperature: number
  openai_model: string
  openai_api_key_set: boolean
  openai_max_tokens: number
  openai_temperature: number
  auto_reply_enabled: boolean
  max_auto_replies: number
  escalation_keywords: string[]
  artisan_system_prompt: string
  client_system_prompt: string
  mairie_system_prompt: string
  updated_by: string | null
  updated_at: string
}

// --- Analytics ---

export interface CampaignStats {
  total_recipients: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  replied: number
  failed: number
  opted_out: number
  delivery_rate: number
  open_rate: number
  reply_rate: number
  bounce_rate: number
  total_cost: number
}

export interface OverviewStats {
  total_contacts: number
  contacts_by_type: Record<ContactType, number>
  total_campaigns: number
  active_campaigns: number
  total_messages_sent: number
  messages_by_channel: Record<ProspectionChannel, number>
  overall_delivery_rate: number
  overall_reply_rate: number
  total_conversations: number
  open_conversations: number
  total_cost: number
}

export interface ChannelPerformance {
  channel: ProspectionChannel
  sent: number
  delivered: number
  replied: number
  failed: number
  delivery_rate: number
  reply_rate: number
  avg_cost: number
}

// --- Import ---

export interface ImportResult {
  total_rows: number
  valid: number
  duplicates: number
  errors: number
  imported: number
  error_details: ImportError[]
  duplicate_details: ImportDuplicate[]
}

export interface ImportError {
  row: number
  field: string
  message: string
}

export interface ImportDuplicate {
  row: number
  existing_id: string
  match_field: 'email' | 'phone'
  match_value: string
}

export interface ColumnMapping {
  [csvColumn: string]: keyof ProspectionContactInsert | null
}

// --- Coûts par canal ---

export const CHANNEL_COSTS = {
  sms: {
    france: 0.0375,
    international: 0.05,
  },
  whatsapp: {
    marketing: 0.0511,
    utility: 0.0200,
    authentication: 0.0150,
  },
  email: {
    per_email: 0.001,
    free_tier_limit: 3000,
  },
} as const
