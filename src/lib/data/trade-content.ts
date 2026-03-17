/**
 * Rich SEO content for each legal practice area.
 * Used on practice area hub pages to add contextual content
 * (pricing guide, FAQ, practical tips).
 *
 * This module now re-exports from attorney-content.ts and provides
 * backward-compatible TradeContent records mapped from AttorneyContent.
 */

import { attorneyContent } from './attorney-content'

// Re-export everything from attorney-content for new code
export {
  type AttorneyContent,
  attorneyContent,
  getAttorneyContent,
  getAttorneyContentSlugs,
  getAttorneyContentBatch,
  getAttorneyContentByCategory,
  getRelatedAttorneyContent,
  slugifyCaseType,
  parseCaseType,
  getCaseTypesForPracticeArea,
} from './attorney-content'

export interface TradeContent {
  slug: string
  name: string
  priceRange: {
    min: number
    max: number
    unit: string
  }
  commonTasks: string[]
  tips: string[]
  faq: { q: string; a: string }[]
  emergencyInfo?: string
  certifications: string[]
  averageResponseTime: string
}

/**
 * Backward-compatible tradeContent record mapped from attorneyContent.
 * commonTasks maps from commonCaseTypes in AttorneyContent.
 */
export const tradeContent: Record<string, TradeContent> = Object.fromEntries(
  Object.entries(attorneyContent).map(([slug, ac]) => [
    slug,
    {
      slug: ac.slug,
      name: ac.name,
      priceRange: {
        min: ac.priceRange.min,
        max: ac.priceRange.max,
        unit: ac.priceRange.unit,
      },
      commonTasks: ac.commonCaseTypes,
      tips: ac.tips,
      faq: ac.faq,
      emergencyInfo: ac.emergencyInfo,
      certifications: ac.certifications,
      averageResponseTime: ac.averageResponseTime,
    },
  ])
)

/**
 * Retrieves the content for a practice area by its slug.
 * Returns undefined if the slug does not exist.
 */
export function getTradeContent(slug: string): TradeContent | undefined {
  return tradeContent[slug]
}

/**
 * Retrieves all available practice area slugs.
 */
export function getPracticeAreaSlugs(): string[] {
  return Object.keys(tradeContent)
}


/**
 * Slugifies a task name for use in the URL /pricing/[service]/[location]/[task].
 */
export function slugifyTask(taskName: string): string {
  return taskName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Parses a task from commonTasks (format "name: price").
 */
export function parseTask(task: string): { name: string; slug: string; priceText: string } {
  const colonIdx = task.indexOf(':')
  if (colonIdx === -1) return { name: task.trim(), slug: slugifyTask(task.trim()), priceText: '' }
  const name = task.substring(0, colonIdx).trim()
  const priceText = task.substring(colonIdx + 1).trim()
  return { name, slug: slugifyTask(name), priceText }
}

/** Returns all parsed tasks for a practice area */
export function getTasksForService(specialtySlug: string): { name: string; slug: string; priceText: string }[] {
  const trade = tradeContent[specialtySlug]
  if (!trade) return []
  return trade.commonTasks.map(parseTask)
}
