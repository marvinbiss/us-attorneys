import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo/config'
import {
  PopularCitiesLinks,
  PopularServicesLinks,
  PopularServiceCityLinks,
  GeographicNavigation,
} from '@/components/InternalLinks'
import { GeographicSectionWrapper } from '@/components/home/GeographicSectionWrapper'
import { ClayHomePage } from '@/components/home/ClayHomePage'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { getSiteStats, getHomepageData, formatAttorneyCount } from '@/lib/data/stats'
import { getFAQSchema, getItemListSchema, getWebsiteSchema } from '@/lib/seo/jsonld'
import JsonLd from '@/components/JsonLd'
import { faqItems } from '@/lib/data/faq-data'
import { popularServices } from '@/lib/constants/navigation'
import dynamic from 'next/dynamic'
import { REVALIDATE } from '@/lib/cache'

const SocialProofBanner = dynamic(() => import('@/components/SocialProofBanner'), { ssr: false })
const RecentSearches = dynamic(() => import('@/components/RecentSearches'), { ssr: false })

export const revalidate = REVALIDATE.staticPages

export async function generateMetadata(): Promise<Metadata> {
  const { attorneyCount: count } = await getSiteStats()
  const countStr = count > 0 ? `${formatAttorneyCount(count)}+` : 'Thousands of'
  const absoluteTitle = `US Attorneys — ${countStr} Verified Lawyers | US Attorneys`
  const metaDescription = `Find a qualified attorney among ${countStr} verified lawyers. Personal injury, family law, criminal defense: all 50 states covered. Free consultation.`
  return {
    title: { absolute: absoluteTitle },
    description: metaDescription,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: absoluteTitle,
      description: metaDescription,
      type: 'website',
      url: SITE_URL,
      images: [
        {
          url: `${SITE_URL}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'US Attorneys — Attorney Directory',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: absoluteTitle,
      description: metaDescription,
      images: [`${SITE_URL}/opengraph-image`],
    },
  }
}

export default async function HomePage() {
  const [cmsPage, homepageData] = await Promise.all([
    getPageContent('homepage', 'homepage'),
    getHomepageData(),
  ])

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen">
        <h1 className="sr-only">{cmsPage.title || 'The US Attorney Directory'}</h1>
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  // JSON-LD structured data for homepage
  const websiteSchema = getWebsiteSchema()
  const faqSchema = getFAQSchema(faqItems)
  const itemListSchema = getItemListSchema({
    name: 'Popular practice areas in the US',
    description: 'The most searched legal practice areas on US Attorneys',
    url: '/practice-areas',
    items: popularServices.map((s, i) => ({
      name: s.name,
      url: `/practice-areas/${s.slug}`,
      position: i + 1,
    })),
  })
  const aggregateRatingSchema =
    homepageData.reviewCount > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'US Attorneys',
          url: SITE_URL,
          description: 'Attorney directory in the United States',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: homepageData.avgRating,
            reviewCount: homepageData.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : null

  return (
    <div className="min-h-screen">
      {/* Homepage-specific JSON-LD: WebSite + FAQ + ItemList + AggregateRating */}
      <JsonLd data={[websiteSchema, faqSchema, itemListSchema, aggregateRatingSchema]} />

      {/* Server-rendered H1 for SEO — visually hidden, ClayHomePage shows the visible version */}
      <h1 className="sr-only">The US Attorney Directory — Find Verified Lawyers</h1>

      {/* ─── CLAY HOMEPAGE DESIGN ─────────────────────────────── */}
      <ClayHomePage
        stats={homepageData}
        specialtyCounts={homepageData.specialtyCounts}
        topProviders={homepageData.topProviders}
        recentReviews={homepageData.recentReviews}
      />

      {/* ─── RECENT SEARCHES (personalization) ─────────────── */}
      <section className="bg-white py-6">
        <div className="mx-auto max-w-4xl px-4">
          <RecentSearches />
        </div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────────────── */}
      <section className="bg-white py-6">
        <div className="mx-auto max-w-4xl px-4">
          <SocialProofBanner variant="card" />
        </div>
      </section>

      {/* ─── GEOGRAPHIC COVERAGE ──────────────────────────────── */}
      <section className="cv-auto bg-sand-200 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <GeographicSectionWrapper>
            <div className="mb-10 text-center">
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-clay-400"
                style={{ background: '#FDF1EC' }}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                Nationwide coverage
              </div>
              <h2 className="mb-2 text-center font-heading text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
                Attorneys across the US
              </h2>
              <p className="mx-auto max-w-lg text-center text-stone-500">
                Find qualified lawyers in your region, state, or city.
              </p>
            </div>
            <GeographicNavigation />
          </GeographicSectionWrapper>
        </div>
      </section>

      {/* ─── EXPLORE INTENT HUBS ─────────────────────────────── */}
      <section className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 font-heading text-lg font-semibold text-stone-800">Explore</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/reviews"
              className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-clay-100 hover:text-clay-600"
            >
              Attorney reviews
            </Link>
            <Link
              href="/pricing"
              className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-clay-100 hover:text-clay-600"
            >
              Attorney fees
            </Link>
            <Link
              href="/emergency"
              className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-clay-100 hover:text-clay-600"
            >
              Emergency legal help
            </Link>
            <Link
              href="/blog"
              className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-clay-100 hover:text-clay-600"
            >
              Blog
            </Link>
            <Link
              href="/issues"
              className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-clay-100 hover:text-clay-600"
            >
              Common legal issues
            </Link>
          </div>
        </div>
      </section>

      {/* ─── POPULAR LINKS (SEO) ──────────────────────────────── */}
      <section className="cv-auto border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-3">
            <PopularServicesLinks showTitle limit={8} />
            <PopularCitiesLinks showTitle limit={10} />
            <PopularServiceCityLinks showTitle limit={12} />
          </div>
        </div>
      </section>
    </div>
  )
}
