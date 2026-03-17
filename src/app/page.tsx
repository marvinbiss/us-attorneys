import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo/config'
import { PopularCitiesLinks, PopularServicesLinks, PopularServiceCityLinks, GeographicNavigation } from '@/components/InternalLinks'
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
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'US Attorneys — Attorney Directory' }],
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
        <h1 className="sr-only">
          {cmsPage.title || "The US Attorney Directory"}
        </h1>
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
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
    url: '/services',
    items: popularServices.map((s, i) => ({
      name: s.name,
      url: `/practice-areas/${s.slug}`,
      position: i + 1,
    })),
  })
  const aggregateRatingSchema = homepageData.reviewCount > 0
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
      <h1 className="sr-only">
        The US Attorney Directory — Find Verified Lawyers
      </h1>

      {/* ─── CLAY HOMEPAGE DESIGN ─────────────────────────────── */}
      <ClayHomePage
        stats={homepageData}
        specialtyCounts={homepageData.specialtyCounts}
        topProviders={homepageData.topProviders}
        recentReviews={homepageData.recentReviews}
      />

      {/* ─── RECENT SEARCHES (personalization) ─────────────── */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <RecentSearches />
        </div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────────────── */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <SocialProofBanner variant="card" />
        </div>
      </section>

      {/* ─── GEOGRAPHIC COVERAGE ──────────────────────────────── */}
      <section className="py-16 bg-sand-200 cv-auto">
        <div className="max-w-6xl mx-auto px-4">
          <GeographicSectionWrapper>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 text-clay-400 rounded-full text-sm font-medium mb-5" style={{ background: '#FDF1EC' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Nationwide coverage
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2 text-center tracking-tight">
                Attorneys across the US
              </h2>
              <p className="text-stone-500 text-center max-w-lg mx-auto">
                Find qualified lawyers in your region, state, or city.
              </p>
            </div>
            <GeographicNavigation />
          </GeographicSectionWrapper>
        </div>
      </section>

      {/* ─── EXPLORE INTENT HUBS ─────────────────────────────── */}
      <section className="py-10 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="font-heading text-lg font-semibold text-stone-800 mb-4">Explore</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/reviews" className="inline-block px-4 py-2 text-sm font-medium text-stone-700 bg-slate-100 hover:bg-clay-100 hover:text-clay-600 rounded-full transition-colors">Attorney reviews</Link>
            <Link href="/pricing" className="inline-block px-4 py-2 text-sm font-medium text-stone-700 bg-slate-100 hover:bg-clay-100 hover:text-clay-600 rounded-full transition-colors">Attorney fees</Link>
            <Link href="/emergency" className="inline-block px-4 py-2 text-sm font-medium text-stone-700 bg-slate-100 hover:bg-clay-100 hover:text-clay-600 rounded-full transition-colors">Emergency legal help</Link>
            <Link href="/blog" className="inline-block px-4 py-2 text-sm font-medium text-stone-700 bg-slate-100 hover:bg-clay-100 hover:text-clay-600 rounded-full transition-colors">Blog</Link>
            <Link href="/issues" className="inline-block px-4 py-2 text-sm font-medium text-stone-700 bg-slate-100 hover:bg-clay-100 hover:text-clay-600 rounded-full transition-colors">Common legal issues</Link>
          </div>
        </div>
      </section>

      {/* ─── POPULAR LINKS (SEO) ──────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-t border-slate-100 cv-auto">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <PopularServicesLinks showTitle limit={8} />
            <PopularCitiesLinks showTitle limit={10} />
            <PopularServiceCityLinks showTitle limit={12} />
          </div>
        </div>
      </section>
    </div>
  )
}
