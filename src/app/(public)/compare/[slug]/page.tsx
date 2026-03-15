import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { comparisons } from '@/lib/data/comparisons'

export const revalidate = false
export const dynamicParams = false

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }))
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const comparison = comparisons.find((c) => c.slug === slug)
  if (!comparison) return {}

  return {
    title: `${comparison.title} | US Attorneys`,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/compare/${comparison.slug}` },
  }
}

export default async function CompareSlugPage({ params }: PageProps) {
  const { slug } = await params
  const comparison = comparisons.find((c) => c.slug === slug)
  if (!comparison) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {comparison.title}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
