import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getRegionBySlug } from '@/lib/data/usa'
import { getTradeContent } from '@/lib/data/trade-content'
import { REVALIDATE } from '@/lib/cache'

// 1 seed page — ISR 24h handles the rest (dynamicParams = true)
export function generateStaticParams() {
  return [{ region: 'northeast', service: 'personal-injury' }]
}

export const dynamicParams = true
export const revalidate = REVALIDATE.locations

interface PageProps {
  params: Promise<{ region: string; service: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region: regionSlug, service: specialtySlug } = await params
  const region = getRegionBySlug(regionSlug)
  const trade = getTradeContent(specialtySlug)
  if (!region || !trade) return { title: 'Page not found' }

  const title = `${trade.name} in ${region.name}`
  return {
    title,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/regions/${regionSlug}/${specialtySlug}` },
  }
}

export default async function RegionServicePage({ params }: PageProps) {
  const { region: regionSlug, service: specialtySlug } = await params
  const region = getRegionBySlug(regionSlug)
  const trade = getTradeContent(specialtySlug)
  if (!region || !trade) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} in {region.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
