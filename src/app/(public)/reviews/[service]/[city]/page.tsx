import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { tradeContent } from '@/lib/data/trade-content'
import { getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

export function generateStaticParams() {
  // All review/city pages generated on-demand via ISR 24h
  return []
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const title = `${trade.name} Reviews in ${villeData.name} (${villeData.stateCode})`
  const description = `Read verified ${trade.name.toLowerCase()} reviews in ${villeData.name}, ${villeData.stateName}. Client ratings, satisfaction scores and feedback from real cases.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: {
      canonical: `${SITE_URL}/reviews/${service}/${villeSlug}`,
      languages: getAlternateLanguages(`/reviews/${service}/${villeSlug}`),
    },
    openGraph: { title, description, url: `${SITE_URL}/reviews/${service}/${villeSlug}`, type: 'website', locale: 'en_US' },
  }
}

export default async function ReviewsServiceVillePage({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}) {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug) || await resolveZipToCity(villeSlug)
  if (!trade || !villeData) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} Reviews in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
