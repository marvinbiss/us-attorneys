import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent, getTradesSlugs } from '@/lib/data/trade-content'

export const revalidate = 86400

const tradeSlugs = getTradesSlugs()

export function generateStaticParams() {
  return tradeSlugs.map((service) => ({ service }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string }>
}): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const title = `${trade.name} Reviews`
  return {
    title,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/reviews/${service}` },
  }
}

export default async function ReviewsServicePage({
  params,
}: {
  params: Promise<{ service: string }>
}) {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} Reviews
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
