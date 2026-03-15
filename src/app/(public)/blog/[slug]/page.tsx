import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { allArticles, articleSlugs } from '@/lib/data/blog/articles'
import { getBlogImage } from '@/lib/data/images'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

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
  const article = allArticles[slug]
  if (!article) notFound()

  const cmsPage = await getPageContent(`blog-${slug}`, 'blog')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-heading text-3xl font-bold text-gray-900">
          {article.title}
        </h1>
        {cmsPage?.content_html && (
          <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
            <CmsContent html={cmsPage.content_html} />
          </div>
        )}
      </div>
    </div>
  )
}
