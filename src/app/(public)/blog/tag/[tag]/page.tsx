import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowRight, ArrowLeft, Tag } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import { allArticlesMeta } from '@/lib/data/blog/articles-index'
import { allArticles } from '@/lib/data/blog/articles'
import { getBlogImage, BLUR_PLACEHOLDER } from '@/lib/data/images'

function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Collect all unique tags with their slugified versions */
function getAllTags(): { slug: string; label: string }[] {
  const tagMap = new Map<string, string>()
  for (const a of allArticlesMeta) {
    for (const t of a.tags) {
      const slug = slugifyTag(t)
      if (!tagMap.has(slug)) tagMap.set(slug, t)
    }
  }
  return Array.from(tagMap.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'))
}

const allTags = getAllTags()

// Pre-render all tag pages at build time
export function generateStaticParams() {
  return allTags.map((t) => ({ tag: t.slug }))
}

export const dynamicParams = false

interface PageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag: tagSlug } = await params
  const tagInfo = allTags.find((t) => t.slug === tagSlug)
  if (!tagInfo) return { title: 'Tag not found' }

  const title = `${tagInfo.label} — Articles & Guides | US Attorneys`
  const description = `All articles about ${tagInfo.label.toLowerCase()}: tips, pricing, regulations, and practical guides by USAttorneys experts.`

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog/tag/${tagSlug}` },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1 as const,
      'max-image-preview': 'large' as const,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/tag/${tagSlug}`,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag: tagSlug } = await params
  const tagInfo = allTags.find((t) => t.slug === tagSlug)
  if (!tagInfo) notFound()

  const articles = allArticlesMeta.filter((a) => a.tags.some((t) => slugifyTag(t) === tagSlug))

  // Related tags: tags that co-occur in the same articles
  const relatedTagSlugs = new Set<string>()
  for (const a of articles) {
    for (const t of a.tags) {
      const s = slugifyTag(t)
      if (s !== tagSlug) relatedTagSlugs.add(s)
    }
  }
  const relatedTags = allTags.filter((t) => relatedTagSlugs.has(t.slug)).slice(0, 12)

  // JSON-LD
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Articles: ${tagInfo.label}`,
    description: `Articles and guides about ${tagInfo.label.toLowerCase()}`,
    url: `${SITE_URL}/blog/tag/${tagSlug}`,
    numberOfItems: articles.length,
    isPartOf: {
      '@type': 'Blog',
      name: 'USAttorneys Blog',
      url: `${SITE_URL}/blog`,
    },
    hasPart: articles.slice(0, 10).map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/blog/${a.slug}`,
      datePublished: a.date,
      author: (() => {
        const authorName = allArticles[a.slug]?.author || 'US Attorneys'
        return authorName === 'US Attorneys'
          ? {
              '@type': 'Organization',
              name: 'USAttorneys Editorial Team',
              url: `${SITE_URL}/about`,
              '@id': `${SITE_URL}#organization`,
            }
          : { '@type': 'Person', name: authorName }
      })(),
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: tagInfo.label,
        item: `${SITE_URL}/blog/tag/${tagSlug}`,
      },
    ],
  }

  return (
    <>
      <JsonLd data={collectionSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%)',
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 md:pb-36 md:pt-14 lg:px-8">
            <Breadcrumb
              items={[{ label: 'Blog', href: '/blog' }, { label: tagInfo.label }]}
              className="mb-6 text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
                <Tag className="h-4 w-4" />
                Tag
              </div>
              <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-[-0.025em] md:text-5xl">
                {tagInfo.label}
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-slate-400">
                {articles.length} article{articles.length > 1 ? 's' : ''} about{' '}
                {tagInfo.label.toLowerCase()}
              </p>
            </div>
          </div>
        </section>

        {/* Articles */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {articles.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg text-gray-500">No articles with this tag yet.</p>
                <Link
                  href="/blog"
                  className="mt-4 inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to blog
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={getBlogImage(article.slug, article.category).src}
                        alt={getBlogImage(article.slug, article.category).alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute left-4 top-4 z-10 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <h2 className="mb-2 text-lg font-bold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
                        {article.title}
                      </h2>
                      <p className="mb-4 text-sm text-gray-600">{article.excerpt}</p>
                      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(article.date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {article.readTime}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold text-blue-600 transition-all duration-200 group-hover:gap-2">
                          Read <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Related tags */}
        {relatedTags.length > 0 && (
          <section className="border-t bg-white py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="mb-6 border-l-4 border-blue-500 pl-4 text-2xl font-bold text-gray-900">
                Related tags
              </h2>
              <div className="flex flex-wrap gap-3">
                {relatedTags.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/blog/tag/${t.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to blog */}
        <section className="border-t bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-medium text-blue-600 transition-colors hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4" />
              All articles
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
