import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getStateBySlug } from '@/lib/data/usa'
import { getTradeContent } from '@/lib/data/trade-content'
import { REVALIDATE } from '@/lib/cache'

export function generateStaticParams() {
  // Pre-render: 1 seed page only, ISR 24h handles the rest
  return [{ state: 'new-york', service: 'personal-injury' }]
}

export const dynamicParams = true
export const revalidate = REVALIDATE.locations

interface PageProps {
  params: Promise<{ state: string; service: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: deptSlug, service: specialtySlug } = await params
  const dept = getStateBySlug(deptSlug)
  const trade = getTradeContent(specialtySlug)
  if (!dept || !trade) return { title: 'Page not found' }

  const title = `${trade.name} in ${dept.name} (${dept.code})`
  const description = `Find verified ${trade.name.toLowerCase()} attorneys in ${dept.name}. Browse by city, compare fees and read reviews. Free consultation, no obligation.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/states/${deptSlug}/${specialtySlug}` },
    openGraph: { title, description, url: `${SITE_URL}/states/${deptSlug}/${specialtySlug}`, type: 'website', locale: 'en_US' },
  }
}

export default async function StateServicePage({ params }: PageProps) {
  const { state: deptSlug, service: specialtySlug } = await params
  const dept = getStateBySlug(deptSlug)
  const trade = getTradeContent(specialtySlug)
  if (!dept || !trade) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {trade.name} in {dept.name} ({dept.code})
      </h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
