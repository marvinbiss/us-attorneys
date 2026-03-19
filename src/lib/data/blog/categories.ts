/**
 * Blog category utilities -- slug <-> label mapping for crawlable category pages.
 */

export interface BlogCategory {
  slug: string
  label: string
  description: string
  metaTitle: string
  metaDescription: string
}

/** All blog categories with SEO metadata */
export const blogCategories: BlogCategory[] = [
  {
    slug: 'tips',
    label: 'Tips',
    description: 'Practical tips for working with attorneys and navigating the legal system.',
    metaTitle: 'Legal Tips — USAttorneys Blog',
    metaDescription:
      'Expert tips for hiring attorneys, managing legal costs, and getting the best outcomes for your case.',
  },
  {
    slug: 'fees',
    label: 'Fees',
    description:
      'Understand attorney fees, billing structures, and how to budget for legal services.',
    metaTitle: 'Attorney Fees & Pricing — USAttorneys Blog',
    metaDescription:
      'Comprehensive guides to attorney fees, hourly rates, contingency fees, and legal cost planning across the US.',
  },
  {
    slug: 'practice-areas',
    label: 'Practice Areas',
    description: 'In-depth articles about legal practice areas and specializations.',
    metaTitle: 'Practice Areas — USAttorneys Blog',
    metaDescription:
      'Explore legal practice areas including family law, criminal defense, personal injury, immigration, and more.',
  },
  {
    slug: 'guides',
    label: 'Guides',
    description: 'Step-by-step legal guides to help you understand your rights and options.',
    metaTitle: 'Legal Guides — USAttorneys Blog',
    metaDescription:
      'Comprehensive legal guides covering court procedures, document preparation, and navigating the justice system.',
  },
  {
    slug: 'regulations',
    label: 'Regulations',
    description: 'Stay informed about legal regulations, compliance requirements, and law changes.',
    metaTitle: 'Legal Regulations — USAttorneys Blog',
    metaDescription:
      'Updates on legal regulations, compliance requirements, and regulatory changes affecting attorneys and clients.',
  },
  {
    slug: 'aid-grants',
    label: 'Aid & Grants',
    description: 'Information about legal aid programs, grants, and pro bono services.',
    metaTitle: 'Legal Aid & Grants — USAttorneys Blog',
    metaDescription:
      'Find legal aid programs, pro bono attorneys, grants, and free legal resources available in your state.',
  },
  {
    slug: 'seasonal',
    label: 'Seasonal',
    description: 'Seasonal legal considerations and timely advice throughout the year.',
    metaTitle: 'Seasonal Legal Advice — USAttorneys Blog',
    metaDescription:
      'Timely legal advice for tax season, year-end planning, holiday disputes, and seasonal legal matters.',
  },
  {
    slug: 'safety',
    label: 'Safety',
    description: 'Legal guidance on safety, liability, and protecting yourself and your family.',
    metaTitle: 'Safety & Liability — USAttorneys Blog',
    metaDescription:
      'Legal advice on personal safety, liability protection, workplace safety, and premises liability issues.',
  },
  {
    slug: 'energy',
    label: 'Energy',
    description: 'Legal issues related to energy, utilities, and environmental regulations.',
    metaTitle: 'Energy & Environmental Law — USAttorneys Blog',
    metaDescription:
      'Articles about energy law, environmental regulations, utility disputes, and renewable energy legal issues.',
  },
  {
    slug: 'diy',
    label: 'DIY',
    description: 'Do-it-yourself legal resources for common situations you can handle on your own.',
    metaTitle: 'DIY Legal Resources — USAttorneys Blog',
    metaDescription:
      'Self-help legal resources, templates, and guides for handling simple legal matters without an attorney.',
  },
  {
    slug: 'inspiration',
    label: 'Inspiration',
    description:
      'Inspiring legal stories, landmark cases, and profiles of attorneys making a difference.',
    metaTitle: 'Legal Inspiration — USAttorneys Blog',
    metaDescription:
      'Inspiring stories of legal victories, landmark cases, and attorneys making a difference in their communities.',
  },
  {
    slug: 'materials',
    label: 'Materials',
    description: 'Legal documents, templates, and reference materials for attorneys and clients.',
    metaTitle: 'Legal Materials & Templates — USAttorneys Blog',
    metaDescription:
      'Legal document templates, reference materials, checklists, and resources for attorneys and clients.',
  },
  {
    slug: 'emergencies',
    label: 'Emergencies',
    description: 'Urgent legal guidance for emergency situations requiring immediate action.',
    metaTitle: 'Legal Emergencies — USAttorneys Blog',
    metaDescription:
      'Emergency legal guidance for arrests, restraining orders, evictions, and other urgent legal situations.',
  },
]

/** Slugify a category label for URL usage */
export function categoryToSlug(label: string): string {
  const found = blogCategories.find((c) => c.label === label)
  if (found) return found.slug
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Find a category by its URL slug */
export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return blogCategories.find((c) => c.slug === slug)
}

/** Map a category label to its normalized form (handles accent variants) */
const categoryNormalize: Record<string, string> = {
  'Aid & Grants': 'Aid & Grants',
  'Practice Areas': 'Practice Areas',
}

export function normalizeCategory(category: string): string {
  return categoryNormalize[category] || category
}
