import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent, getTasksForService } from '@/lib/data/trade-content'
import { getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'
import { REVALIDATE } from '@/lib/cache'

// Return a minimal seed set (NOT empty — empty array in a child of a parent
// with generateStaticParams causes a 500 on Vercel with Next.js 14.2).
export function generateStaticParams() {
  return [{ service: 'personal-injury', city: 'new-york', task: 'debouchage-de-canalisation' }]
}

export const dynamicParams = true
export const revalidate = REVALIDATE.serviceLocation

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string; task: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug, task: taskSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const tasks = getTasksForService(service)
  const task = tasks.find((t) => t.slug === taskSlug)

  const taskName = task ? task.name : trade.name
  const title = task
    ? `${task.name} in ${villeData.name} — Pricing`
    : `${trade.name} Pricing in ${villeData.name}`
  const description = `How much does ${taskName.toLowerCase()} cost in ${villeData.name}, ${villeData.stateName}? Compare local rates, get pricing details and request a free consultation.`

  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/pricing/${service}/${villeSlug}/${taskSlug}` },
    openGraph: { title, description, url: `${SITE_URL}/pricing/${service}/${villeSlug}/${taskSlug}`, type: 'website', locale: 'en_US' },
  }
}

export default async function PricingServiceTaskCityPage({
  params,
}: {
  params: Promise<{ service: string; city: string; task: string }>
}) {
  const { service, city: villeSlug, task: taskSlug } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug) || await resolveZipToCity(villeSlug)
  if (!trade || !villeData) notFound()

  const tasks = getTasksForService(service)
  const task = tasks.find((t) => t.slug === taskSlug)
  if (!task) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {task.name} in {villeData.name}
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
