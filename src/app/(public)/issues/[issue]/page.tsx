import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getProblemBySlug, getProblemSlugs } from '@/lib/data/problems'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

export function generateStaticParams() {
  return getProblemSlugs().map((issue) => ({ issue }))
}

export async function generateMetadata({ params }: { params: Promise<{ issue: string }> }): Promise<Metadata> {
  const { issue } = await params
  const problem = getProblemBySlug(issue)
  if (!problem) return {}

  const title = `${problem.name} — Find a Qualified Attorney`
  const description = `Dealing with ${problem.name.toLowerCase()}? Find experienced attorneys who handle this issue. Compare profiles, read reviews and get a free consultation.`
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: `${SITE_URL}/issues/${issue}` },
    openGraph: { title, description, url: `${SITE_URL}/issues/${issue}`, type: 'website', locale: 'en_US' },
  }
}

export default async function IssuePage({ params }: { params: Promise<{ issue: string }> }) {
  const { issue } = await params
  const problem = getProblemBySlug(issue)
  if (!problem) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{problem.name}</h1>
      <p className="text-gray-500">Content coming soon.</p>
    </div>
  )
}
