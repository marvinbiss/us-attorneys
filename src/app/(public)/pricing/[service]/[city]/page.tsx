import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'
import { REVALIDATE } from '@/lib/cache'

export function generateStaticParams() {
  // Seed at least 1 param to avoid empty child segment issue (Next.js 14.2 + Vercel 500)
  // All other pricing/city pages generated on-demand via ISR 24h
  return [{ service: 'personal-injury', city: 'new-york' }]
}

export const dynamicParams = true
export const revalidate = REVALIDATE.serviceLocation

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const title = `${trade.name} Fees in ${villeData.name} (${villeData.stateCode})`
  const description = `How much does a ${trade.name.toLowerCase()} cost in ${villeData.name}? Typical rates: ${trade.priceRange.min}–${trade.priceRange.max} ${trade.priceRange.unit}. Compare local attorney fees and payment options.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/pricing/${service}/${villeSlug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/pricing/${service}/${villeSlug}`,
      type: 'website',
      locale: 'en_US',
    },
  }
}

export default async function PricingServiceVillePage({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}) {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug) || (await resolveZipToCity(villeSlug))
  if (!trade || !villeData) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">
        {trade.name} Pricing in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
