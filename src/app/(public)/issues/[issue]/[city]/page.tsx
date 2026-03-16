import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo/config'
import { getProblemBySlug, getProblemSlugs } from '@/lib/data/problems'
import { cities, getCityBySlug } from '@/lib/data/usa'

function parsePopulation(pop: string): number {
  return parseInt(pop.replace(/\s/g, ''), 10) || 0
}

const top30Cities = [...cities]
  .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
  .slice(0, 30)

export function generateStaticParams() {
  const top10Problems = getProblemSlugs().slice(0, 10)
  return top10Problems.flatMap((p) =>
    top30Cities.map((v) => ({ issue: p, city: v.slug }))
  )
}

export const dynamicParams = true
export const revalidate = 86400

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
  const villeData = getCityBySlug(villeSlug)
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
