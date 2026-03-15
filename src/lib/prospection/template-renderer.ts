/**
 * Template Rendering Engine - Prospection
 * Substitution de variables {{variable}} dans les templates
 */

import crypto from 'crypto'
import { logger } from '@/lib/logger'
import type { ProspectionContact, ProspectionCampaign } from '@/types/prospection'

/**
 * Sanitize a template variable value to prevent XSS and template injection.
 * - Strips HTML tags
 * - Removes nested {{}} patterns that could cause template re-injection
 * - Truncates to 500 characters
 */
function escapeTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return str.replace(/<[^>]*>/g, '').replace(/\{\{/g, '').replace(/\}\}/g, '').slice(0, 500)
}

// Variables disponibles dans les templates
const CONTACT_VARIABLES: Record<string, (contact: ProspectionContact) => string> = {
  contact_name: (c) => c.contact_name || '',
  company_name: (c) => c.company_name || '',
  email: (c) => c.email || '',
  phone: (c) => c.phone || '',
  city: (c) => c.city || '',
  postal_code: (c) => c.postal_code || '',
  department: (c) => c.department || '',
  region: (c) => c.region || '',
  contact_type: (c) => c.contact_type,
  location_code: (c) => c.location_code || '',
}

const CAMPAIGN_VARIABLES: Record<string, (campaign: ProspectionCampaign) => string> = {
  campaign_name: (c) => c.name,
}

/**
 * Generate an HMAC-SHA256 signed unsubscribe token.
 * Format: base64url(payload).base64url(hmac_signature)
 * This prevents contacts from forging unsubscribe links for other users.
 */
function deriveSigningKey(rawKey: string): string {
  return crypto.createHash('sha256').update(`unsubscribe:${rawKey}`).digest('hex')
}

function getUnsubscribeSigningKey(): string {
  const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET
  if (UNSUBSCRIBE_SECRET) return UNSUBSCRIBE_SECRET

  if (process.env.NODE_ENV === 'production') {
    throw new Error('UNSUBSCRIBE_SECRET must be set in production')
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set')
  }

  logger.warn('UNSUBSCRIBE_SECRET not set - deriving key from SUPABASE_SERVICE_ROLE_KEY hash. Set a dedicated secret in production.')
  return deriveSigningKey(serviceRoleKey)
}

function generateUnsubscribeToken(contactId: string, channel: string): string {
  const payload = JSON.stringify({ cid: contactId, ch: channel, t: Date.now() })
  const token = Buffer.from(payload).toString('base64url')
  const signingKey = getUnsubscribeSigningKey()
  const signature = crypto.createHmac('sha256', signingKey).update(token).digest('base64url')
  return `${token}.${signature}`
}

/**
 * Verify an HMAC-SHA256 signed unsubscribe token.
 * Returns the decoded payload if valid, null if tampered.
 */
export function verifyUnsubscribeToken(
  signedToken: string
): { cid: string; ch: string; t: number } | null {
  const dotIndex = signedToken.lastIndexOf('.')
  if (dotIndex === -1) return null

  const token = signedToken.substring(0, dotIndex)
  const signature = signedToken.substring(dotIndex + 1)

  const signingKey = getUnsubscribeSigningKey()
  const expectedSignature = crypto.createHmac('sha256', signingKey).update(token).digest('base64url')

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (!payload.cid || !payload.ch) return null
    // Token expires after 30 days
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    if (payload.t && Date.now() - payload.t > THIRTY_DAYS_MS) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Rend un template en substituant les {{variables}}
 */
export function renderTemplate(
  template: string,
  contact: ProspectionContact,
  campaign: ProspectionCampaign,
  customVars?: Record<string, string>
): string {
  let rendered = template

  // Substitution variables contact
  for (const [key, getter] of Object.entries(CONTACT_VARIABLES)) {
    rendered = rendered.replaceAll(`{{${key}}}`, escapeTemplateValue(getter(contact)))
  }

  // Substitution variables campagne
  for (const [key, getter] of Object.entries(CAMPAIGN_VARIABLES)) {
    rendered = rendered.replaceAll(`{{${key}}}`, escapeTemplateValue(getter(campaign)))
  }

  // Variables custom (champs personnalisés)
  if (customVars) {
    for (const [key, value] of Object.entries(customVars)) {
      rendered = rendered.replaceAll(`{{${key}}}`, escapeTemplateValue(value))
    }
  }

  // Custom fields du contact
  if (contact.custom_fields) {
    for (const [key, value] of Object.entries(contact.custom_fields)) {
      rendered = rendered.replaceAll(`{{custom_${key}}}`, escapeTemplateValue(value))
    }
  }

  // Lien de désinscription with HMAC-signed token to prevent tampering
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://us-attorneys.com'
  const unsubToken = generateUnsubscribeToken(contact.id, campaign.channel)
  rendered = rendered.replaceAll('{{unsubscribe_link}}', `${siteUrl}/api/prospection/unsubscribe?token=${unsubToken}`)

  // Date du jour
  rendered = rendered.replaceAll('{{date}}', new Date().toLocaleDateString('fr-FR'))

  return rendered
}

/**
 * Extrait les variables d'un template
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || []
  return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ''))))
}

/**
 * Valide qu'un template peut être rendu avec un contact
 */
export function validateTemplate(
  template: string,
  requiredVars?: string[]
): { valid: boolean; missing: string[] } {
  const vars = extractVariables(template)
  const allKnownVars = new Set([
    ...Object.keys(CONTACT_VARIABLES),
    ...Object.keys(CAMPAIGN_VARIABLES),
    'unsubscribe_link',
    'date',
  ])

  const missing = vars.filter(v =>
    !allKnownVars.has(v) && !v.startsWith('custom_')
  )

  const missingRequired = (requiredVars || []).filter(v => !vars.includes(v))

  return {
    valid: missing.length === 0 && missingRequired.length === 0,
    missing: [...missing, ...missingRequired],
  }
}

/**
 * Génère un aperçu avec des données fictives
 */
export function renderPreview(template: string): string {
  const sampleContact: ProspectionContact = {
    id: 'preview-id',
    contact_type: 'artisan',
    company_name: 'Plomberie Martin SARL',
    contact_name: 'Jean Martin',
    email: 'jean.martin@example.com',
    email_canonical: 'jean.martin@example.com',
    phone: '06 12 34 56 78',
    phone_e164: '+33612345678',
    address: '12 rue de la Paix',
    postal_code: '75001',
    city: 'Paris',
    department: '75',
    region: 'Île-de-France',
    location_code: '75101',
    population: null,
    attorney_id: null,
    source: 'manual',
    source_file: null,
    source_row: null,
    tags: [],
    custom_fields: {},
    consent_status: 'unknown',
    opted_out_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const sampleCampaign: ProspectionCampaign = {
    id: 'preview-campaign',
    name: 'Campagne Test',
    description: null,
    channel: 'email',
    audience_type: 'artisan',
    template_id: null,
    list_id: null,
    status: 'draft',
    scheduled_at: null,
    started_at: null,
    completed_at: null,
    paused_at: null,
    batch_size: 100,
    batch_delay_ms: 1000,
    daily_send_limit: 1000,
    ab_test_enabled: false,
    ab_variant_b_template_id: null,
    ab_split_percent: 50,
    ai_auto_reply: false,
    ai_provider: 'claude',
    ai_model: 'claude-sonnet-4-5-20250929',
    ai_system_prompt: null,
    ai_max_tokens: 1024,
    ai_temperature: 0.7,
    total_recipients: 0,
    sent_count: 0,
    delivered_count: 0,
    opened_count: 0,
    clicked_count: 0,
    replied_count: 0,
    failed_count: 0,
    opted_out_count: 0,
    estimated_cost: 0,
    actual_cost: 0,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return renderTemplate(template, sampleContact, sampleCampaign)
}
