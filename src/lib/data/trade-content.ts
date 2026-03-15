/**
 * Rich SEO content for each legal practice area.
 * Used on practice area hub pages to add contextual content
 * (pricing guide, FAQ, practical tips).
 */

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

export const tradeContent: Record<string, TradeContent> = {}

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
export function getTradesSlugs(): string[] {
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
