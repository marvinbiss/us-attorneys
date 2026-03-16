import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { tradeContent, getTasksForService } from '@/lib/data/trade-content'
import { getCityBySlug } from '@/lib/data/usa'

// Return a minimal seed set (NOT empty — empty array in a child of a parent
// with generateStaticParams causes a 500 on Vercel with Next.js 14.2).
export function generateStaticParams() {
  return [{ service: 'plombier', city: 'paris', travail: 'debouchage-de-canalisation' }]
}

export const dynamicParams = true
export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; city: string; travail: string }>
}): Promise<Metadata> {
  const { service, city: villeSlug, travail } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) return {}

  const tasks = getTasksForService(service)
  const task = tasks.find((t) => t.slug === travail)

  const title = task
    ? `${task.name} in ${villeData.name} — Pricing`
    : `${trade.name} Pricing in ${villeData.name}`

  return {
    title,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/pricing/${service}/${villeSlug}/${travail}` },
  }
}

export default async function PricingServiceTravailVillePage({
  params,
}: {
  params: Promise<{ service: string; city: string; travail: string }>
}) {
  const { service, city: villeSlug, travail } = await params
  const trade = tradeContent[service]
  const villeData = getCityBySlug(villeSlug)
  if (!trade || !villeData) notFound()

  const tasks = getTasksForService(service)
  const task = tasks.find((t) => t.slug === travail)
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
