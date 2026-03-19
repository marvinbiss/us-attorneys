import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { allArticlesMeta, allCategories } from '@/lib/data/blog/articles-index'
import { allArticles } from '@/lib/data/blog/articles'
import { blogCategories, categoryToSlug, normalizeCategory } from '@/lib/data/blog/categories'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import BlogPageClient from './BlogPageClient'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.blog

export const metadata: Metadata = {
  title: 'Legal Blog & Insights — Attorney Tips 2026',
  description: `Tips, guides, and news about legal services, attorney fees, and regulations. ${allArticlesMeta.length}+ articles by experts.`,
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: 'Legal Blog & Insights — Attorney Tips 2026',
    description: 'Tips, guides, and news about legal services and attorney practice.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'USAttorneys — Legal blog and insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Legal Blog & Insights — Attorney Tips 2026',
    description: 'Tips, guides, and news about legal services and attorney practice.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

interface PageProps {
  searchParams: Promise<{ tag?: string }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { tag } = await searchParams

  const cmsPage = await getPageContent('blog', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Blog' }]} className="mb-4" />
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Legal Blog & Insights',
    description: 'Tips, guides, and news about legal services and attorney practice.',
    url: `${SITE_URL}/blog`,
    numberOfItems: allArticlesMeta.length,
    isPartOf: {
      '@type': 'WebSite',
      name: 'US Attorneys',
      url: SITE_URL,
    },
    hasPart: allArticlesMeta.slice(0, 10).map((a) => ({
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

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/', semanticType: 'Organization' },
    { name: 'Blog', url: '/blog', semanticType: 'Blog' },
  ])

  // Category article counts for cross-link section
  const categoryCounts = blogCategories.map((c) => ({
    ...c,
    count: allArticlesMeta.filter((a) => categoryToSlug(normalizeCategory(a.category)) === c.slug)
      .length,
  }))

  const categoryColors: Record<string, string> = {
    Tips: 'bg-amber-100 text-amber-700',
    Fees: 'bg-emerald-100 text-emerald-700',
    'Practice Areas': 'bg-blue-100 text-blue-700',
    Guides: 'bg-purple-100 text-purple-700',
    Regulations: 'bg-slate-100 text-slate-700',
    'Aid & Grants': 'bg-green-100 text-green-700',
    Seasonal: 'bg-lime-100 text-lime-700',
    Safety: 'bg-red-100 text-red-700',
    Energy: 'bg-teal-100 text-teal-700',
    DIY: 'bg-orange-100 text-orange-700',
    Inspiration: 'bg-pink-100 text-pink-700',
  }

  return (
    <>
      <JsonLd data={[collectionSchema, breadcrumbSchema]} />
      <BlogPageClient articles={allArticlesMeta} categories={allCategories} initialTag={tag} />

      {/* Crawlable category links — server-rendered for SEO */}
      <section className="border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 border-l-4 border-blue-500 pl-4 text-2xl font-bold text-gray-900">
            Browse by category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryCounts.map((c) => {
              const color = categoryColors[c.label] || 'bg-gray-100 text-gray-700'
              return (
                <Link
                  key={c.slug}
                  href={`/blog/category/${c.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
                >
                  <div>
                    <span
                      className={`inline-block ${color} mb-1 rounded-full px-2.5 py-0.5 text-xs font-semibold`}
                    >
                      {c.label}
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      {c.count} article{c.count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
