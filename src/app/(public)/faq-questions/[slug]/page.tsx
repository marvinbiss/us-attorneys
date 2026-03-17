import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo/config'
import { getQuestionBySlug, getQuestionSlugs } from '@/lib/data/faq'
import { REVALIDATE } from '@/lib/cache'

export function generateStaticParams() {
  return getQuestionSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false
export const revalidate = REVALIDATE.staticPages

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const question = getQuestionBySlug(params.slug)
  if (!question) return {}

  const title = question.question
  const description = `Expert answer: ${question.question} Get clear, practical legal guidance from verified attorneys. Free consultation available.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/faq/${question.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/faq-questions/${question.slug}`, type: 'website', locale: 'en_US' },
  }
}

export default function FaqQuestionPage({
  params,
}: {
  params: { slug: string }
}) {
  const question = getQuestionBySlug(params.slug)
  if (!question) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {question.question}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
