/**
 * Data-driven content generator for service+location pages.
 *
 * Stub: returns minimal empty content. Types preserved for compatibility.
 */

import type { LocationData } from '@/lib/data/location-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataDrivenContent {
  /** Data-rich introduction paragraph */
  intro: string
  /** Socio-economic context paragraph */
  socioEconomic: string | null
  /** Real estate market context */
  immobilier: string | null
  /** Local legal market (law firms + certifications) */
  legalMarket: string | null
  /** Legal aid and pro bono context */
  energetique: string | null
  /** Climate-driven advice with real data */
  climatData: string | null
  /** Service-specific local demand analysis (always generated) */
  demandeLocale: string
  /** Service-specific regulatory/standards context (always generated) */
  reglementation: string
  /** Data-enriched FAQ items (replace template FAQs when data available) */
  faqItems: { question: string; answer: string }[]
  /** E-E-A-T data sources citation */
  dataSources: string[]
}

// ---------------------------------------------------------------------------
// Main generator — returns empty/minimal content
// ---------------------------------------------------------------------------

export function generateDataDrivenContent(
  _location: LocationData,
  _specialtySlug: string,
  _specialtyName: string,
  _attorneyCount: number,
): DataDrivenContent {
  return {
    intro: '',
    socioEconomic: null,
    immobilier: null,
    legalMarket: null,
    energetique: null,
    climatData: null,
    demandeLocale: '',
    reglementation: '',
    faqItems: [],
    dataSources: [],
  }
}
