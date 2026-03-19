import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { tradeContent } from '@/lib/data/trade-content'
import { getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

export const dynamicParams = true

export function generateStaticParams() {
  // 1 seed only — ISR 24h handles the rest
  return [{ service: 'personal-injury', city: 'new-york' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const title = `Emergency ${trade.name} in ${villeData.name} (${villeData.stateCode})`
  const description = `Need an emergency ${trade.name.toLowerCase()} in ${villeData.name}, ${villeData.stateName}? Get immediate help from verified attorneys available 24/7. Fast response, free initial consultation.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: {
      canonical: `${SITE_URL}/emergency/${service}/${villeSlug}`,
      languages: getAlternateLanguages(`/emergency/${service}/${villeSlug}`),
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/emergency/${service}/${villeSlug}`,
      type: 'website',
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function EmergencyServiceVillePage({
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
        Emergency {trade.name} in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
