import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, Facebook, Twitter, Linkedin, Tag, ChevronRight } from 'lucide-react'
import { SITE_URL } from '@/lib/seo/config'
import { getAuthorByName } from '@/lib/data/authors'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { getBlogArticleSchema } from '@/lib/seo/blog-schema'
import { allArticles, articleSlugs } from '@/lib/data/blog/articles'
import { categoryEmoji } from '@/lib/data/blog/articles-index'
import { getRelatedServiceLinks, getRelatedArticleSlugs } from '@/lib/seo/internal-links'
import { getBlogImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import JsonLd from '@/components/JsonLd'
import { ReadingProgress } from '@/components/ReadingProgress'
import { TableOfContents } from '@/components/TableOfContents'
import { ArticleFAQ } from './ArticleFAQ'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

/** Lightweight map for the related-articles scorer */
const allArticlesMeta: Record<string, { category: string; tags: string[]; title: string; readTime: string }> =
  Object.fromEntries(
    Object.entries(allArticles).map(([slug, a]) => [
      slug,
      { category: a.category, tags: a.tags, title: a.title, readTime: a.readTime },
    ])
  )

export function generateStaticParams() {
  return articleSlugs.map((slug) => ({ slug }))
}

export const dynamicParams = false

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = allArticles[slug]
  if (!article) return { title: 'Article non trouvé' }

  const blogImage = getBlogImage(slug, article.category)

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      ...(article.updatedDate ? { modifiedTime: article.updatedDate } : {}),
      section: article.category,
      tags: article.tags,
      url: `${SITE_URL}/blog/${slug}`,
      images: [{ url: blogImage.src, width: 1200, height: 630, alt: blogImage.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [blogImage.src],
    },
  }
}

/* ─── Helpers ─────────────────────────────────────────── */

/** Turn a heading string into a URL-safe id */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/* ─── ParsedBlock types ──────────────────────────────── */

interface H2Block {
  type: 'h2'
  text: string
  id: string
}

interface H3Block {
  type: 'h3'
  text: string
  id: string
}

interface ParagraphBlock {
  type: 'p'
  text: string
}

interface ListBlock {
  type: 'list'
  ordered: boolean
  items: string[]
}

interface CalloutBlock {
  type: 'callout'
  calloutType: 'tip' | 'warning' | 'info' | 'takeaway' | 'budget' | 'expert'
  title: string
  content: string[]
}

interface TableBlock {
  type: 'table'
  headers: string[]
  rows: string[][]
}

interface BlockquoteBlock {
  type: 'blockquote'
  text: string
}

type ParsedBlock = H2Block | H3Block | ParagraphBlock | ListBlock | CalloutBlock | TableBlock | BlockquoteBlock

/**
 * Parse the raw content array into a flat list of blocks.
 *
 * Handles two content formats:
 *  1. Separate strings: ["## Heading", "Paragraph..."]
 *  2. Combined strings: ["## Heading\n\nParagraph..."]
 *
 * Recognizes: H2, H3, unordered lists, ordered lists, callouts,
 * tables, blockquotes, and regular paragraphs.
 */
function parseContentBlocks(content: string[]): ParsedBlock[] {
  // First, split all content into individual lines
  const allLines: string[] = []
  for (const raw of content) {
    const parts = raw.split(/\n\n/).map((s) => s.trim()).filter(Boolean)
    for (const part of parts) {
      // Some parts may have single newlines (e.g. list items, table rows, callout blocks)
      const subLines = part.split('\n').map((s) => s.trim()).filter(Boolean)
      allLines.push(...subLines)
    }
  }

  const blocks: ParsedBlock[] = []
  let i = 0

  while (i < allLines.length) {
    const line = allLines[i]

    // Callout blocks: :::type TITLE ... :::
    if (line.startsWith(':::') && !line.startsWith(':::end') && line !== ':::') {
      const calloutMatch = line.match(/^:::(tip|warning|info|takeaway|budget|expert)\s*(.*)$/)
      if (calloutMatch) {
        const calloutType = calloutMatch[1] as CalloutBlock['calloutType']
        const title = calloutMatch[2].trim()
        const calloutContent: string[] = []
        i++
        while (i < allLines.length && allLines[i] !== ':::') {
          calloutContent.push(allLines[i])
          i++
        }
        // Skip the closing :::
        if (i < allLines.length && allLines[i] === ':::') i++
        blocks.push({ type: 'callout', calloutType, title, content: calloutContent })
        continue
      }
    }

    // H2 heading
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      const text = line.replace(/^## /, '')
      blocks.push({ type: 'h2', text, id: slugify(text) })
      i++
      continue
    }

    // H3 heading
    if (line.startsWith('### ')) {
      const text = line.replace(/^### /, '')
      blocks.push({ type: 'h3', text, id: slugify(text) })
      i++
      continue
    }

    // Table: lines starting with |
    if (line.startsWith('|') && line.includes('|', 1)) {
      const tableLines: string[] = []
      while (i < allLines.length && allLines[i].startsWith('|')) {
        tableLines.push(allLines[i])
        i++
      }
      const parsed = parseTable(tableLines)
      if (parsed) {
        blocks.push(parsed)
      }
      continue
    }

    // Unordered list: lines starting with -
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < allLines.length && allLines[i].startsWith('- ')) {
        items.push(allLines[i].replace(/^- /, ''))
        i++
      }
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    // Ordered list: lines starting with number.
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < allLines.length && /^\d+\.\s/.test(allLines[i])) {
        items.push(allLines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    // Blockquote: lines starting with >
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < allLines.length && allLines[i].startsWith('> ')) {
        quoteLines.push(allLines[i].replace(/^> /, ''))
        i++
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') })
      continue
    }

    // Regular paragraph
    blocks.push({ type: 'p', text: line })
    i++
  }

  return blocks
}

/** Parse table lines into a TableBlock */
function parseTable(lines: string[]): TableBlock | null {
  const parseLine = (line: string): string[] =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim())

  if (lines.length < 2) return null

  const headers = parseLine(lines[0])
  const rows: string[][] = []

  for (let i = 1; i < lines.length; i++) {
    // Skip separator rows (| --- | --- |)
    if (/^\|[\s-:|]+\|$/.test(lines[i]) || /^[\s|:-]+$/.test(lines[i])) continue
    rows.push(parseLine(lines[i]))
  }

  if (headers.length === 0) return null
  return { type: 'table', headers, rows }
}

/** Extract TOC items (h2 and h3) for the Table of Contents */
function extractTocItems(blocks: ParsedBlock[]): { id: string; text: string; level: 'h2' | 'h3' }[] {
  return blocks
    .filter((b): b is H2Block | H3Block => b.type === 'h2' || b.type === 'h3')
    .map((b) => ({ id: b.id, text: b.text, level: b.type as 'h2' | 'h3' }))
}

/** Extract FAQ items from content blocks (### Question? / answer pattern after ## Questions frequentes) */
function extractFAQFromBlocks(blocks: ParsedBlock[]): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = []
  let inFaqSection = false

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    // Detect FAQ section start
    if (block.type === 'h2' && /faq?\s+fr[eé]quentes?/i.test(block.text)) {
      inFaqSection = true
      continue
    }

    // End FAQ section at next h2
    if (block.type === 'h2' && inFaqSection) {
      break
    }

    // Collect h3 question + following answer blocks
    if (inFaqSection && block.type === 'h3') {
      const question = block.text
      const answerParts: string[] = []
      for (let j = i + 1; j < blocks.length; j++) {
        const next = blocks[j]
        if (next.type === 'h3' || next.type === 'h2') break
        if (next.type === 'p') answerParts.push(next.text)
        if (next.type === 'list') answerParts.push(next.items.join('. '))
      }
      if (answerParts.length > 0) {
        faqs.push({ question, answer: answerParts.join(' ') })
      }
    }
  }

  return faqs
}

/* ─── Inline markdown rendering ───────────────────────── */

/** Parse inline markdown (**bold** and [text](url)) and return React nodes */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Pattern matches **bold** or [text](url)
  const pattern = /(\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // Bold: **text**
      nodes.push(<strong key={match.index}>{match[2]}</strong>)
    } else if (match[3] && match[4]) {
      // Link: [text](url) — add nofollow for external URLs
      const isExternal = match[4].startsWith('http://') || match[4].startsWith('https://')
      nodes.push(
        <a
          key={match.index}
          href={match[4]}
          className="text-amber-600 hover:underline"
          {...(isExternal ? { target: '_blank', rel: 'nofollow noopener noreferrer' } : {})}
        >
          {match[3]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

/* ─── Callout rendering helpers ───────────────────────── */

function CalloutIcon({ calloutType }: { calloutType: CalloutBlock['calloutType'] }) {
  switch (calloutType) {
    case 'tip':
      return (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    case 'warning':
      return (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    case 'info':
      return (
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'takeaway':
      return (
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )
    case 'budget':
      return (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'expert':
      return (
        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
        </svg>
      )
  }
}

function getCalloutStyles(calloutType: CalloutBlock['calloutType']): { bg: string; border: string; headerColor: string } {
  switch (calloutType) {
    case 'tip':
      return { bg: 'bg-emerald-50', border: 'border-emerald-400', headerColor: 'text-emerald-700' }
    case 'warning':
      return { bg: 'bg-orange-50', border: 'border-orange-400', headerColor: 'text-orange-700' }
    case 'info':
      return { bg: 'bg-blue-50', border: 'border-blue-400', headerColor: 'text-blue-700' }
    case 'takeaway':
      return { bg: 'bg-amber-50', border: 'border-amber-400', headerColor: 'text-amber-700' }
    case 'budget':
      return { bg: 'bg-gradient-to-r from-amber-50 to-orange-50', border: 'border-amber-400', headerColor: 'text-amber-700' }
    case 'expert':
      return { bg: 'bg-slate-50', border: 'border-slate-400', headerColor: 'text-slate-700' }
  }
}

function getCalloutLabel(calloutType: CalloutBlock['calloutType'], title: string): string {
  if (title) return title
  switch (calloutType) {
    case 'tip': return 'CONSEIL'
    case 'warning': return 'ATTENTION'
    case 'info': return 'BON À SAVOIR'
    case 'takeaway': return 'À RETENIR'
    case 'budget': return 'BUDGET INDICATIF'
    case 'expert': return 'AVIS D’EXPERT'
  }
}

/** Render callout content based on type */
function renderCalloutContent(block: CalloutBlock) {
  const { calloutType, content } = block

  // Takeaway: render as bullet list
  if (calloutType === 'takeaway') {
    return (
      <ul className="article-list article-list-unordered mt-2 mb-0">
        {content.map((line, i) => (
          <li key={i}>{renderInlineMarkdown(line.replace(/^-\s*/, ''))}</li>
        ))}
      </ul>
    )
  }

  // Budget: render as mini table
  if (calloutType === 'budget') {
    const tableLines = content.filter((l) => l.startsWith('|'))
    const textLines = content.filter((l) => !l.startsWith('|'))
    return (
      <div className="article-callout-content">
        {textLines.length > 0 && textLines.map((line, i) => (
          <p key={`t-${i}`}>{renderInlineMarkdown(line)}</p>
        ))}
        {tableLines.length > 0 && (() => {
          const parsed = parseTable(tableLines)
          if (!parsed) return null
          return (
            <div className="article-table-wrapper mt-2">
              <table className="article-table">
                <thead>
                  <tr>
                    {parsed.headers.map((h, hi) => (
                      <th key={hi}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{renderInlineMarkdown(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })()}
      </div>
    )
  }

  // Expert: render as italic quote + author
  if (calloutType === 'expert') {
    const quoteLines: string[] = []
    let author = ''
    for (const line of content) {
      if (line.startsWith('-- ') || line.startsWith('— ')) {
        author = line.replace(/^(--|—)\s*/, '')
      } else {
        quoteLines.push(line.replace(/^"|"$/g, '').replace(/^«\s*|\s*»$/g, ''))
      }
    }
    return (
      <div className="article-callout-content">
        <p className="italic text-lg leading-relaxed text-gray-700">
          &laquo;&nbsp;{quoteLines.join(' ')}&nbsp;&raquo;
        </p>
        {author && (
          <p className="mt-3 font-semibold text-sm text-slate-600">
            — {author}
          </p>
        )}
      </div>
    )
  }

  // Default: render as paragraphs
  return (
    <div className="article-callout-content">
      {content.map((line, i) => (
        <p key={i}>{renderInlineMarkdown(line)}</p>
      ))}
    </div>
  )
}

/* ─── Author avatar color helper ──────────────────────── */

function getAuthorGradient(name: string): string {
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

/* ─── Page ────────────────────────────────────────────── */

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params

  // Check CMS first
  const cmsPage = await getPageContent(slug, 'blog')
  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const article = allArticles[slug]

  if (!article) {
    notFound()
  }

  const blogImageForSchema = getBlogImage(slug, article.category)
  const schemas = getBlogArticleSchema(article, slug, blogImageForSchema.src)
  const serviceLinks = getRelatedServiceLinks(slug, article.category, article.tags)
  const relatedArticles = getRelatedArticleSlugs(
    slug,
    article.category,
    article.tags,
    articleSlugs,
    allArticlesMeta
  )

  const blocks = parseContentBlocks(article.content)
  const tocItems = extractTocItems(blocks)

  // Derive contextual devis link from service links (first /practice-areas/X match -> /quotes/X)
  const firstServiceLink = getRelatedServiceLinks(slug, article.category, article.tags)
    .find((l) => l.href.startsWith('/practice-areas/'))
  const devisHref = firstServiceLink
    ? `/quotes/${firstServiceLink.href.split('/practice-areas/')[1].split('/')[0]}`
    : '/quotes'

  // Index after which to insert mid-article CTA (after ~2nd h2 section)
  const MID_ARTICLE_CTA_AFTER_SECTION = 2

  // Build FAQ items: prefer article.faq field, fallback to content-extracted FAQs
  const faqItems = article.faq && article.faq.length > 0
    ? article.faq
    : extractFAQFromBlocks(blocks)

  // Build FAQ schema if we have items
  const faqSchema = faqItems.length >= 2
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: article.title, url: `/blog/${slug}` },
  ])

  const allSchemas = [breadcrumbSchema, ...schemas, ...(faqSchema ? [faqSchema] : [])]

  const articleUrl = `${SITE_URL}/blog/${slug}`
  const encodedUrl = encodeURIComponent(articleUrl)
  const encodedTitle = encodeURIComponent(article.title)

  /**
   * Group blocks into sections: each section starts with an h2 and includes
   * all following blocks until the next h2. Blocks before the first h2
   * form an "intro" section.
   */
  const sections: { heading: H2Block | null; blocks: ParsedBlock[] }[] = []
  let current: { heading: H2Block | null; blocks: ParsedBlock[] } = {
    heading: null,
    blocks: [],
  }

  for (const block of blocks) {
    if (block.type === 'h2') {
      // Push the previous section if it has content
      if (current.heading || current.blocks.length > 0) {
        sections.push(current)
      }
      current = { heading: block, blocks: [] }
    } else {
      current.blocks.push(block)
    }
  }
  // Push the last section
  if (current.heading || current.blocks.length > 0) {
    sections.push(current)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={allSchemas} />
      <ReadingProgress />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category */}
        <div className="max-w-3xl mx-auto mb-4">
          <Link href={`/blog?tag=${encodeURIComponent(article.category.toLowerCase())}`} className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors">
            {article.category}
          </Link>
        </div>

        {/* Title */}
        <h1 className="font-heading text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-gray-900 mb-6 max-w-3xl mx-auto leading-tight tracking-tight">
          {article.title}
        </h1>

        {/* Byline with author avatar */}
        {(() => {
          const authorProfile = getAuthorByName(article.author)
          const initials = article.author.split(' ').map(n => n[0]).join('')
          const gradient = getAuthorGradient(article.author)
          return (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-500 text-sm sm:text-base mb-8 sm:mb-10 max-w-3xl mx-auto">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  {initials}
                </div>
                <div>
                  <span className="text-gray-900 font-semibold">{article.author}</span>
                  {authorProfile && (
                    <span className="block text-xs text-gray-400">{authorProfile.role}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(article.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.readTime} de lecture
              </div>
              {article.updatedDate && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <Clock className="w-4 h-4" />
                  Mis à jour le {new Date(article.updatedDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Article Hero Image */}
        {(() => {
          const blogImage = getBlogImage(slug, article.category)
          return (
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden mb-8 sm:mb-12">
              <Image
                src={blogImage.src}
                alt={blogImage.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 896px, 896px"
                priority
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6 flex items-center gap-3">
                <span className="text-3xl">{categoryEmoji[article.category] || '📝'}</span>
                <span className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
                  {article.category}
                </span>
              </div>
            </div>
          )
        })()}

        {/* Content — optimal reading width */}
        <div className="max-w-3xl mx-auto">

          {/* Table of Contents */}
          <TableOfContents items={tocItems} />

          {/* Article body */}
          <div className="article-body">
            {sections.map((section, sectionIdx) => (
              <section
                key={sectionIdx}
                className={sectionIdx > 0 && section.heading ? 'article-section' : ''}
              >
                {/* Mid-article CTA — inserted after the Nth section */}
                {sectionIdx === MID_ARTICLE_CTA_AFTER_SECTION && sections.length > 3 && (
                  <div className="not-prose my-8 bg-gradient-to-r from-clay-50 to-amber-50 border border-clay-200 rounded-xl p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">Besoin d&apos;un professionnel ?</p>
                        <p className="text-sm text-gray-600">Recevez jusqu&apos;à 3 devis gratuits d&apos;artisans vérifiés près de chez vous.</p>
                      </div>
                      <Link
                        href={devisHref}
                        className="inline-flex items-center gap-2 bg-clay-500 hover:bg-clay-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
                      >
                        Devis gratuit
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Section heading */}
                {section.heading && (
                  <h2
                    id={section.heading.id}
                    className="article-h2"
                  >
                    <span className="article-h2-bar" aria-hidden="true" />
                    {section.heading.text}
                  </h2>
                )}

                {/* Section blocks */}
                {section.blocks.map((block, bIdx) => {
                  // First paragraph of the entire article (intro) gets special styling
                  const isIntro = sectionIdx === 0 && !section.heading && bIdx === 0 && block.type === 'p'

                  switch (block.type) {
                    case 'p':
                      return (
                        <p
                          key={bIdx}
                          className={isIntro ? 'article-intro article-excerpt' : 'article-paragraph'}
                        >
                          {renderInlineMarkdown(block.text)}
                        </p>
                      )

                    case 'h3':
                      return (
                        <h3
                          key={bIdx}
                          id={block.id}
                          className="article-h3"
                        >
                          {block.text}
                        </h3>
                      )

                    case 'list':
                      return (
                        <ul
                          key={bIdx}
                          className={`article-list ${block.ordered ? 'article-list-ordered' : 'article-list-unordered'}`}
                        >
                          {block.items.map((item, li) => (
                            <li key={li}>{renderInlineMarkdown(item)}</li>
                          ))}
                        </ul>
                      )

                    case 'callout': {
                      const styles = getCalloutStyles(block.calloutType)
                      return (
                        <div
                          key={bIdx}
                          className={`article-callout ${styles.bg} ${styles.border}`}
                        >
                          <div className={`article-callout-header ${styles.headerColor}`}>
                            <CalloutIcon calloutType={block.calloutType} />
                            {getCalloutLabel(block.calloutType, block.title)}
                          </div>
                          {renderCalloutContent(block)}
                        </div>
                      )
                    }

                    case 'table':
                      return (
                        <div key={bIdx} className="article-table-wrapper">
                          <table className="article-table">
                            <thead>
                              <tr>
                                {block.headers.map((h, hi) => (
                                  <th key={hi}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {block.rows.map((row, ri) => (
                                <tr key={ri}>
                                  {row.map((cell, ci) => (
                                    <td key={ci}>{renderInlineMarkdown(cell)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )

                    case 'blockquote':
                      return (
                        <blockquote key={bIdx} className="article-blockquote">
                          {renderInlineMarkdown(block.text)}
                        </blockquote>
                      )

                    default:
                      return null
                  }
                })}
              </section>
            ))}
          </div>

          {/* FAQ Section */}
          {faqItems.length > 0 && (
            <ArticleFAQ items={faqItems} />
          )}

          {/* Services associes */}
          {serviceLinks.length > 0 && (
            <div className="mt-14 p-6 sm:p-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/80 rounded-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
                Services associés
              </h3>
              <ul className="space-y-3">
                {serviceLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium group transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Articles similaires */}
          {relatedArticles.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                Articles similaires
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map(({ slug: relSlug, title: relTitle, category: relCategory, readTime: relReadTime }) => (
                  <Link
                    key={relSlug}
                    href={`/blog/${relSlug}`}
                    className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-amber-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        {categoryEmoji[relCategory] || '📝'} {relCategory}
                      </span>
                      {relReadTime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relReadTime}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">{relTitle}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-3 mt-12 pt-8 border-t border-gray-200">
            <Tag className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag.toLowerCase())}`}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
            <span className="text-gray-600 font-medium">Partager :</span>
            <div className="flex gap-2">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Partager sur Facebook"
                className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Partager sur Twitter"
                className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 hover:scale-110 transition-all duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label="Partager sur LinkedIn"
                className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 hover:scale-110 transition-all duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Author Box — Enhanced E-E-A-T */}
          {(() => {
            const authorProfile = getAuthorByName(article.author)
            const initials = article.author.split(' ').map(n => n[0]).join('')
            const gradient = getAuthorGradient(article.author)
            return (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mt-10">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg">{article.author}</h3>
                    {authorProfile && (
                      <p className="text-amber-700 text-sm font-medium mb-2">{authorProfile.role}</p>
                    )}
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {authorProfile
                        ? authorProfile.bio
                        : (article.authorBio || "Expert en artisanat et batiment chez ServicesArtisans. Nos contenus sont rediges en collaboration avec des professionnels du secteur et verifies pour leur exactitude technique.")}
                    </p>
                    {authorProfile && (
                      <>
                        {/* Expertise tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {authorProfile.expertise.map((exp) => (
                            <span key={exp} className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              {exp}
                            </span>
                          ))}
                        </div>
                        {/* Certifications */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {authorProfile.certifications.map((cert) => (
                            <span key={cert} className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {cert}
                            </span>
                          ))}
                        </div>
                        {/* Experience + link */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {authorProfile.yearsExperience} ans d&apos;experience
                          </span>
                          <Link
                            href={`/blog?author=${encodeURIComponent(article.author.toLowerCase())}`}
                            className="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                          >
                            Voir tous les articles de {article.author.split(' ')[0]}
                          </Link>
                        </div>
                      </>
                    )}
                    {!authorProfile && (
                      <p className="text-gray-400 text-xs mt-1">
                        Contenu verifie par des artisans professionnels
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Editorial transparency */}
          <div className="bg-gray-50 rounded-xl p-4 mt-6 border border-gray-100">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-600">Méthodologie éditoriale :</strong> Cet article a été rédigé par notre équipe
              rédactionnelle en collaboration avec des artisans professionnels. Les prix mentionnés sont indicatifs et basés
              sur les données du marché. Dernière vérification : {new Date(article.updatedDate || article.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.
            </p>
          </div>
        </div>
      </article>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Confiance &amp; Sécurité
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/verification-process" className="text-blue-600 hover:text-blue-800">
              Comment nous référençons les artisans
            </Link>
            <Link href="/review-policy" className="text-blue-600 hover:text-blue-800">
              Notre politique des avis
            </Link>
            <Link href="/mediation" className="text-blue-600 hover:text-blue-800">
              Service de médiation
            </Link>
          </nav>
        </div>
      </section>

      {/* CTA */}
      <div className="relative py-16 overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0a0f1e]">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4">
            Besoin d&apos;un artisan ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Trouvez le professionnel qu&apos;il vous faut en quelques clics
          </p>
          <Link
            href={devisHref}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.5)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
          >
            Demander un devis gratuit
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
