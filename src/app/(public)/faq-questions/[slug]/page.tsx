import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getQuestionBySlug, getQuestionSlugs } from '@/lib/data/faq'

export function generateStaticParams() {
  return getQuestionSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false
export const revalidate = 86400

export function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Metadata {
  const question = getQuestionBySlug(params.slug)
  if (!question) return {}

  return {
    title: `${question.question} | ${SITE_NAME}`,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/faq/${question.slug}` },
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
