interface InternalLink {
  text: string
  href: string
}

/**
 * Maps keywords found in article slugs and tags to their corresponding
 * service pages. Used to generate contextual "Related Services" links.
 */
const serviceMapping: Record<string, { slug: string; label: string }> = {
  // Personal Injury
  'personal-injury': { slug: 'personal-injury', label: 'personal injury attorney' },
  'car-accident': { slug: 'personal-injury', label: 'personal injury attorney' },
  'slip-and-fall': { slug: 'personal-injury', label: 'personal injury attorney' },
  // Criminal Defense
  'criminal-defense': { slug: 'criminal-defense', label: 'criminal defense attorney' },
  'dui': { slug: 'criminal-defense', label: 'criminal defense attorney' },
  'felony': { slug: 'criminal-defense', label: 'criminal defense attorney' },
  'misdemeanor': { slug: 'criminal-defense', label: 'criminal defense attorney' },
  // Family Law
  'family-law': { slug: 'family-law', label: 'family law attorney' },
  'divorce': { slug: 'family-law', label: 'family law attorney' },
  'custody': { slug: 'family-law', label: 'family law attorney' },
  'child-support': { slug: 'family-law', label: 'family law attorney' },
  // Immigration
  'immigration': { slug: 'immigration', label: 'immigration attorney' },
  'visa': { slug: 'immigration', label: 'immigration attorney' },
  'green-card': { slug: 'immigration', label: 'immigration attorney' },
  'deportation': { slug: 'immigration', label: 'immigration attorney' },
  // Estate Planning
  'estate-planning': { slug: 'estate-planning', label: 'estate planning attorney' },
  'wills': { slug: 'estate-planning', label: 'estate planning attorney' },
  'trusts': { slug: 'estate-planning', label: 'estate planning attorney' },
  'probate': { slug: 'estate-planning', label: 'estate planning attorney' },
  // Real Estate
  'real-estate': { slug: 'real-estate', label: 'real estate attorney' },
  'property': { slug: 'real-estate', label: 'real estate attorney' },
  'closing': { slug: 'real-estate', label: 'real estate attorney' },
  // Business Law
  'business-law': { slug: 'business-law', label: 'business law attorney' },
  'corporate': { slug: 'business-law', label: 'business law attorney' },
  'llc': { slug: 'business-law', label: 'business law attorney' },
  'contract': { slug: 'business-law', label: 'business law attorney' },
  // Employment Law
  'employment-law': { slug: 'employment-law', label: 'employment law attorney' },
  'wrongful-termination': { slug: 'employment-law', label: 'employment law attorney' },
  'discrimination': { slug: 'employment-law', label: 'employment law attorney' },
  // Bankruptcy
  'bankruptcy': { slug: 'bankruptcy', label: 'bankruptcy attorney' },
  'chapter-7': { slug: 'bankruptcy', label: 'bankruptcy attorney' },
  'chapter-13': { slug: 'bankruptcy', label: 'bankruptcy attorney' },
  'debt': { slug: 'bankruptcy', label: 'bankruptcy attorney' },
  // Tax Law
  'tax-law': { slug: 'tax-law', label: 'tax law attorney' },
  'irs': { slug: 'tax-law', label: 'tax law attorney' },
  'tax-audit': { slug: 'tax-law', label: 'tax law attorney' },
  // Intellectual Property
  'intellectual-property': { slug: 'intellectual-property', label: 'intellectual property attorney' },
  'patent': { slug: 'intellectual-property', label: 'intellectual property attorney' },
  'trademark': { slug: 'intellectual-property', label: 'intellectual property attorney' },
  'copyright': { slug: 'intellectual-property', label: 'intellectual property attorney' },
}

/**
 * Determines which service pages are relevant for a given article
 * based on its slug, category and tags.
 */
export function getRelatedServiceLinks(
  slug: string,
  category: string,
  tags: string[]
): InternalLink[] {
  const links: InternalLink[] = []
  const addedSlugs = new Set<string>()

  // Build search terms from the slug (split on hyphens) and lowered tags
  const slugWords = slug.toLowerCase()
  const searchTerms = [slugWords, ...tags.map((t) => t.toLowerCase())]

  // Top 5 cities for service x city cross-links
  const TOP_CITIES = [
    { name: 'New York', slug: 'new-york' },
    { name: 'Los Angeles', slug: 'los-angeles' },
    { name: 'Chicago', slug: 'chicago' },
    { name: 'Houston', slug: 'houston' },
    { name: 'Phoenix', slug: 'phoenix' },
  ]

  let firstServiceSlug: string | null = null

  for (const term of searchTerms) {
    for (const [keyword, service] of Object.entries(serviceMapping)) {
      if (term.includes(keyword) && !addedSlugs.has(service.slug)) {
        links.push({
          text: `Find a qualified ${service.label}`,
          href: `/practice-areas/${service.slug}`,
        })
        // Add top-city variants for the first matched service only
        if (!firstServiceSlug) {
          firstServiceSlug = service.slug
          for (const city of TOP_CITIES) {
            links.push({
              text: `${service.label.charAt(0).toUpperCase() + service.label.slice(1)} in ${city.name}`,
              href: `/practice-areas/${service.slug}/${city.slug}`,
            })
          }
        }
        addedSlugs.add(service.slug)
      }
    }
  }

  // Always add consultation link for Pricing articles
  if (category === 'Pricing') {
    links.push({ text: 'Request a free consultation', href: '/quotes' })
  }

  // Add general links based on category
  if (category === 'Regulations' || category === 'Legal Resources') {
    links.push({ text: 'How it works', href: '/how-it-works' })
  }

  if (category === 'Attorney Profiles') {
    links.push({ text: 'Become a partner attorney', href: '/register-attorney' })
  }

  // Add emergency link when relevant
  if (
    tags.some((t) => t.toLowerCase() === 'emergency') ||
    slug.includes('emergency') ||
    slug.includes('urgent')
  ) {
    links.push({ text: 'Emergency attorney', href: '/emergency' })
  }

  // Limit to 5 links max
  return links.slice(0, 5)
}

interface ArticleMeta {
  category: string
  tags: string[]
  title: string
  readTime?: string
}

/**
 * Scores and selects the most relevant related articles based on
 * shared category and overlapping tags.
 */
export function getRelatedArticleSlugs(
  currentSlug: string,
  category: string,
  tags: string[],
  allSlugs: string[],
  allArticlesMap: Record<string, ArticleMeta>
): { slug: string; title: string; category: string; readTime: string }[] {
  const currentTags = tags.map((t) => t.toLowerCase())

  const scored = allSlugs
    .filter((s) => s !== currentSlug)
    .map((s) => {
      const article = allArticlesMap[s]
      if (!article) return { slug: s, title: '', category: '', readTime: '', score: 0 }

      let score = 0

      // Same category => +2
      if (article.category === category) score += 2

      // Each overlapping tag => +3
      const articleTags = article.tags.map((t) => t.toLowerCase())
      for (const tag of articleTags) {
        if (currentTags.includes(tag)) score += 3
      }

      return { slug: s, title: article.title, category: article.category, readTime: article.readTime || '', score }
    })
    .filter((s) => s.score > 0 && s.title)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  return scored
}
