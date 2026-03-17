import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getProblemBySlug } from '@/lib/data/problems'
import { getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'
import { REVALIDATE } from '@/lib/cache'

export function generateStaticParams() {
  // 1 seed only — ISR 24h handles the rest
  return [{ issue: 'car-accident', city: 'new-york' }]
}

export const dynamicParams = true
export const revalidate = REVALIDATE.serviceLocation

export async function generateMetadata({
  params,
}: {
  params: Promise<{ issue: string; city: string }>
}): Promise<Metadata> {
  const { issue, city: villeSlug } = await params
  const problem = getProblemBySlug(issue)
  const villeData = getCityBySlug(villeSlug)
  if (!problem || !villeData) return {}

  return {
    title: `${problem.name} in ${villeData.name} | US Attorneys`,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/issues/${issue}/${villeSlug}` },
  }
}

export default async function IssueVillePage({
  params,
}: {
  params: Promise<{ issue: string; city: string }>
}) {
  const { issue, city: villeSlug } = await params
  const problem = getProblemBySlug(issue)
  const villeData = getCityBySlug(villeSlug) || await resolveZipToCity(villeSlug)
  if (!problem || !villeData) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {problem.name} in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
