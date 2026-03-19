import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { allArticles, articleSlugs } from '@/lib/data/blog/articles'
import { getBlogImage } from '@/lib/data/images'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'

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
  if (!article) return { title: 'Article Not Found' }

  const blogImage = getBlogImage(slug, article.category)

  return {
    title: article.title,
    description: article.excerpt,
    robots: { index: false },
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
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params

  // Check CMS first for a published blog article override
  const cmsPage = await getPageContent(slug, 'blog')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <Breadcrumb
              items={[{ label: 'Blog', href: '/blog' }, { label: cmsPage.title }]}
              className="mb-4"
            />
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
            {cmsPage.excerpt && <p className="mt-2 text-gray-600">{cmsPage.excerpt}</p>}
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

  const article = allArticles[slug]
  if (!article) notFound()

  const cmsExtra = await getPageContent(`blog-${slug}`, 'blog')

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/', semanticType: 'Organization' },
    { name: 'Blog', url: '/blog', semanticType: 'Blog' },
    { name: article.title, url: `/blog/${slug}`, semanticType: 'BlogPosting' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[{ label: 'Blog', href: '/blog' }, { label: article.title }]}
          className="mb-6"
        />
        <h1 className="font-heading text-3xl font-bold text-gray-900">{article.title}</h1>
        {cmsExtra?.content_html && (
          <div className="mt-8 rounded-xl bg-white p-8 shadow-sm">
            <CmsContent html={cmsExtra.content_html} />
          </div>
        )}
      </div>
    </div>
  )
}
