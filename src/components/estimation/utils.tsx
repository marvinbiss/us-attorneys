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
// French phone validation
// ---------------------------------------------------------------------------

export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  if (/^0[1-9]\d{8}$/.test(cleaned)) return true
  if (/^\+33[1-9]\d{8}$/.test(cleaned)) return true
  if (/^0033[1-9]\d{8}$/.test(cleaned)) return true
  return false
}

// ---------------------------------------------------------------------------
// Lead form trigger: detect price estimation in response
// ---------------------------------------------------------------------------

export function shouldShowLeadForm(content: string): boolean {
  const lower = content.toLowerCase()
  // Trigger on keywords OR when a price estimation is given (bold €)
  if (LEAD_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))) return true
  // Detect price pattern like **80€ — 150€** or **80 € — 150 €**
  if (/\*\*\d+\s*€/.test(content)) return true
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

  // Returning visitor — message personnalisé
  if (isReturning) {
    if (context.artisan) {
      return `De retour ? Obtenez votre devis gratuit avec ${context.artisan.name}`
    }
    return `De retour ? Votre estimation ${metier} à ${ville} vous attend`
  }

  if (context.artisan) {
    return `Demandez un devis gratuit à ${context.artisan.name}`
  }
  if (pageUrl.includes('/urgence/')) {
    return `Urgence ${metier} à ${ville} ? Estimez le coût et soyez rappelé immédiatement`
  }
  if (pageUrl.includes('/tarifs/')) {
    return `Ces prix correspondent à votre projet ? Vérifiez gratuitement`
  }
  return `Besoin d'un ${metier} à ${ville} ? Estimez le prix gratuitement`
}
