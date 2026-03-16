/**
 * AI Response Service - Prospection
 * Unified Claude + OpenAI interface for contextual responses
 */

import { logger } from '@/lib/logger'
import type {
  AIProvider,
  ProspectionContact,
  ProspectionCampaign,
  ProspectionConversationMessage,
} from '@/types/prospection'

interface AIGenerateParams {
  provider: AIProvider
  model: string
  systemPrompt: string
  conversationHistory: ProspectionConversationMessage[]
  contactContext: ProspectionContact
  campaignContext?: ProspectionCampaign | null
  maxTokens: number
  temperature: number
}

interface AIGenerateResult {
  content: string
  tokens: { prompt: number; completion: number }
  cost: number
  provider: AIProvider
  model: string
}

/**
 * Generate a contextual AI response
 */
export async function generateAIResponse(params: AIGenerateParams): Promise<AIGenerateResult> {
  const { provider, model, systemPrompt, conversationHistory, contactContext, maxTokens, temperature } = params

  // Build context
  const contextStr = buildContactContext(contactContext)
  const fullSystemPrompt = `${systemPrompt}\n\nContact context:\n${contextStr}`

  // Conversation history
  const messages = conversationHistory.map(msg => ({
    role: msg.direction === 'inbound' ? 'user' as const : 'assistant' as const,
    content: msg.content,
  }))

  let result: AIGenerateResult

  if (provider === 'claude') {
    result = await generateWithClaude(fullSystemPrompt, messages, model, maxTokens, temperature)
  } else {
    result = await generateWithOpenAI(fullSystemPrompt, messages, model, maxTokens, temperature)
  }

  const validation = validateAIOutput(result.content)
  if (!validation.valid) {
    logger.warn('AI output validation failed', { reason: validation.reason, contentPreview: result.content.substring(0, 100) })
    return {
      ...result,
      content: 'Thank you for your message. A representative will get back to you shortly.',
    }
  }

  return result
}

/**
 * Generate via Claude API
 */
async function generateWithClaude(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIGenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error ${response.status}: ${error}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    const usage = data.usage || {}

    // Approximate cost (Claude Sonnet)
    const inputCost = (usage.input_tokens || 0) * 0.000003
    const outputCost = (usage.output_tokens || 0) * 0.000015

    return {
      content,
      tokens: {
        prompt: usage.input_tokens || 0,
        completion: usage.output_tokens || 0,
      },
      cost: inputCost + outputCost,
      provider: 'claude',
      model,
    }
  } catch (error) {
    logger.error('Claude API error', error as Error)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Generate via OpenAI API
 */
async function generateWithOpenAI(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  model: string,
  maxTokens: number,
  temperature: number
): Promise<AIGenerateResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const usage = data.usage || {}

    // Approximate cost (GPT-4o)
    const inputCost = (usage.prompt_tokens || 0) * 0.000005
    const outputCost = (usage.completion_tokens || 0) * 0.000015

    return {
      content,
      tokens: {
        prompt: usage.prompt_tokens || 0,
        completion: usage.completion_tokens || 0,
      },
      cost: inputCost + outputCost,
      provider: 'openai',
      model,
    }
  } catch (error) {
    logger.error('OpenAI API error', error as Error)
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Sanitize a string value before inserting into an AI prompt.
 * Normalizes Unicode homoglyphs (NFKC), removes prompt injection patterns,
 * and truncates to a safe length.
 */
function sanitizeForPrompt(value: string): string {
  return value
    .normalize('NFKC') // Normalize Unicode homoglyphs to canonical form
    .replace(/["\n\r]/g, ' ')
    .replace(/\b(ignore|forget|disregard|override|system|instruction|prompt|assistant|human|user|role|function|tool)\b/gi, '')
    .trim()
    .substring(0, 200)
}

/**
 * Build the textual context for a contact
 * All contact values are sanitized to prevent prompt injection.
 * Wrapped with delimiters to clearly separate data from instructions.
 */
function buildContactContext(contact: ProspectionContact): string {
  const parts: string[] = []

  parts.push(`Type: "${sanitizeForPrompt(contact.contact_type)}"`)
  if (contact.contact_name) parts.push(`Name: "${sanitizeForPrompt(contact.contact_name)}"`)
  if (contact.company_name) parts.push(`Company: "${sanitizeForPrompt(contact.company_name)}"`)
  if (contact.city) parts.push(`City: "${sanitizeForPrompt(contact.city)}"`)
  if (contact.department) parts.push(`Department: "${sanitizeForPrompt(contact.department)}"`)
  if (contact.tags.length > 0) {
    const sanitizedTags = contact.tags.map(t => sanitizeForPrompt(t))
    parts.push(`Tags: "${sanitizedTags.join(', ')}"`)
  }

  return `---BEGIN CONTACT DATA---\n${parts.join('\n')}\n---END CONTACT DATA---`
}

/**
 * Validate AI-generated content before sending
 */
export function validateAIOutput(content: string): { valid: boolean; reason?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, reason: 'Empty response' }
  }
  if (content.length > 2000) {
    return { valid: false, reason: 'Response too long' }
  }
  // Check for PII leakage patterns
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
    /\b(?:\+1)?[2-9]\d{2}[2-9]\d{6}\b/, // US phone
    /\bsk-[a-zA-Z0-9]{20,}\b/, // API keys
    /\bsupabase[_-]?service[_-]?role\b/i, // service role mention
    /\b\d{3}-?\d{2}-?\d{4}\b/, // US SSN
    /\b[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{0,4}\b/, // IBAN
  ]
  for (const pattern of piiPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: 'Potential PII or secret leakage detected' }
    }
  }
  return { valid: true }
}

/**
 * Check if a message should be escalated to a human
 */
export function shouldEscalate(content: string, keywords: string[]): boolean {
  const lowerContent = content.toLowerCase()
  return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))
}

/**
 * Generate with fallback (tries the primary provider, then the secondary)
 */
export async function generateWithFallback(
  params: AIGenerateParams
): Promise<AIGenerateResult> {
  try {
    return await generateAIResponse(params)
  } catch (primaryError) {
    logger.warn('Primary AI provider failed, trying fallback', {
      primary: params.provider,
      error: (primaryError as Error).message,
    })

    const fallbackProvider: AIProvider = params.provider === 'claude' ? 'openai' : 'claude'
    const fallbackModel = fallbackProvider === 'claude' ? 'claude-sonnet-4-20250514' : 'gpt-4o'

    try {
      return await generateAIResponse({
        ...params,
        provider: fallbackProvider,
        model: fallbackModel,
      })
    } catch (fallbackError) {
      logger.error('Both AI providers failed', fallbackError as Error)
      throw primaryError
    }
  }
}
