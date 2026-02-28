import { SITE_URL } from '@/lib/seo/config'

interface FAQItem {
  question: string
  answer: string
}

/**
 * Extract FAQ items from article content.
 * Looks for H2 headings that are questions (contain '?') or common French
 * question patterns, and pairs them with the following paragraph(s) as the answer.
 */
export function extractFAQFromContent(content: string[]): FAQItem[] {
  const faqs: FAQItem[] = []

  for (let i = 0; i < content.length; i++) {
    const line = content[i]

    // Check if this is a heading (starts with ##)
    // Some content strings have embedded \n, so we check the first line
    const firstLine = line.split('\n')[0]
    if (!firstLine.startsWith('## ')) continue

    const heading = firstLine.replace('## ', '').trim()

    // Check if the heading is a question or FAQ-worthy pattern
    const isQuestion = heading.includes('?')
    const isHowMuch = /combien|co[uû]t|prix|tarif/i.test(heading)
    const isHow = /comment|pourquoi|quand|quel|que faire|faut-il/i.test(heading)

    if (!isQuestion && !isHowMuch && !isHow) continue

    // Collect the answer: first check if there's text after the heading in the same string
    const answerParts: string[] = []
    const afterHeading = line.split('\n').slice(1).join(' ').trim()
    if (afterHeading) {
      answerParts.push(afterHeading)
    }

    // Then collect from following paragraphs (until next heading or end)
    for (let j = i + 1; j < content.length; j++) {
      const nextLine = content[j].split('\n')[0]
      if (nextLine.startsWith('## ')) break
      // Clean up the paragraph (remove markdown-like formatting and extra whitespace)
      const cleaned = content[j].replace(/\n/g, ' ').trim()
      if (cleaned) answerParts.push(cleaned)
    }

    if (answerParts.length > 0) {
      // Format question: add ' ?' if missing (French typography uses a space before ?)
      let question = heading
      if (!question.endsWith('?')) {
        question = question + ' ?'
      }

      faqs.push({
        question,
        // Limit answer to ~500 chars for schema (Google truncates long answers)
        answer: answerParts.join(' ').slice(0, 500),
      })
    }
  }

  // Limit to 5 FAQ items (Google recommends 3-5 for best display)
  return faqs.slice(0, 5)
}

/**
 * Generate the Article + FAQ JSON-LD schemas for a blog post.
 * Returns an array of schema objects to be rendered via the JsonLd component.
 */
export function getBlogArticleSchema(article: {
  title: string
  excerpt: string
  content: string[]
  author: string
  date: string
  updatedDate?: string
  category: string
  tags: string[]
}, slug: string, imageUrl?: string): Record<string, unknown>[] {
  const faqs = extractFAQFromContent(article.content)

  const schemas: Record<string, unknown>[] = []

  // Article schema — image always present (Google requires it for rich results)
  const articleImage = imageUrl || `${SITE_URL}/opengraph-image`
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: articleImage,
    author: {
      '@type': article.author === 'ServicesArtisans' ? 'Organization' : 'Person',
      name: article.author,
      ...(article.author === 'ServicesArtisans' ? { '@id': `${SITE_URL}#organization` } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'ServicesArtisans',
      '@id': `${SITE_URL}#organization`,
    },
    datePublished: article.date,
    dateModified: article.updatedDate || article.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${slug}`,
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    inLanguage: 'fr-FR',
  })

  // FAQ schema (only if we have at least 2 FAQ items)
  if (faqs.length >= 2) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    })
  }

  return schemas
}
