import React from 'react'
import { LEAD_TRIGGER_KEYWORDS } from './constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EstimationContext {
  metier: string
  metierSlug: string
  ville: string
  departement: string
  pageUrl: string
  artisan?: {
    name: string
    slug: string
    publicId: string
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ---------------------------------------------------------------------------
// US phone validation
// ---------------------------------------------------------------------------

export function isValidUSPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  // US 10-digit: (555) 123-4567 or 5551234567
  if (/^\d{10}$/.test(cleaned)) return true
  // US with country code: +1 or 1
  if (/^1\d{10}$/.test(cleaned)) return true
  if (/^\+1\d{10}$/.test(cleaned)) return true
  return false
}

// ---------------------------------------------------------------------------
// Lead form trigger: detect price estimation in response
// ---------------------------------------------------------------------------

export function shouldShowLeadForm(content: string): boolean {
  const lower = content.toLowerCase()
  // Trigger on keywords OR when a price estimation is given (bold $)
  if (LEAD_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))) return true
  // Detect price pattern like **$80 — $150** or **$80 - $150**
  if (/\*\*\$\d+/.test(content)) return true
  return false
}

// ---------------------------------------------------------------------------
// Simple markdown renderer (bold + line breaks only)
// ---------------------------------------------------------------------------

export function renderMarkdown(text: string): React.ReactNode[] {
  // Split by **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

// ---------------------------------------------------------------------------
// Greeting bubble: contextual proactive message
// ---------------------------------------------------------------------------

export function getGreetingMessage(
  context: EstimationContext,
  isReturning: boolean,
): string {
  const metier = context.metier.toLowerCase()
  const ville = context.ville
  const pageUrl = context.pageUrl || ''

  // Returning visitor — personalized message
  if (isReturning) {
    if (context.artisan) {
      return `Welcome back! Get your free consultation with ${context.artisan.name}`
    }
    return `Welcome back! Your ${metier} estimate in ${ville} is ready`
  }

  if (context.artisan) {
    return `Request a free consultation with ${context.artisan.name}`
  }
  if (pageUrl.includes('/emergency/')) {
    return `${metier} emergency in ${ville}? Estimate the cost and get a callback immediately`
  }
  if (pageUrl.includes('/pricing/')) {
    return `Do these prices match your case? Check for free`
  }
  return `Need a ${metier} in ${ville}? Estimate the cost for free`
}
