import { Metadata } from 'next'
import Link from 'next/link'
import { Star, Shield, Users, Search, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { tradeContent } from '@/lib/data/trade-content'
import { cities, services } from '@/lib/data/usa'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

export const metadata: Metadata = {
  title: 'Verified Attorney Reviews — Choose a Pro',
  description:
    'Verified reviews on attorneys: family law, personal injury, criminal defense and 50+ practice areas. Compare ratings, recommendations and choose a trusted professional.',
  alternates: {
    canonical: `${SITE_URL}/reviews`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Verified Attorney Reviews — Choose a Pro',
    description:
      'Verified reviews on attorneys: family law, personal injury, criminal defense and 50+ practice areas. Compare ratings, recommendations and choose a trusted professional.',
    url: `${SITE_URL}/reviews`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys — Attorney Reviews',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verified Attorney Reviews — Choose a Pro',
    description:
      'Verified reviews on attorneys: family law, personal injury, criminal defense and 50+ practice areas. Compare ratings, recommendations and choose a trusted professional.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const trustBadges = [
  { icon: Star, label: 'Verified Reviews', sublabel: 'Authentic clients' },
  { icon: Shield, label: 'Verified Attorneys', sublabel: 'Bar-verified' },
  { icon: Users, label: 'Free Comparison', sublabel: 'No obligation' },
]

const howSteps = [
  {
    number: '1',
    icon: Search,
    title: 'Browse Profiles',
    description: 'Explore verified attorney profiles near you and review their qualifications.',
  },
  {
    number: '2',
    icon: Star,
    title: 'Compare Reviews',
    description: 'Read verified client experiences and compare professional ratings.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choose Your Attorney',
    description: 'Select the professional that best fits your needs and request a consultation.',
  },
]

const faqItems = [
  {
    question: 'How are reviews verified?',
    answer:
      'Reviews on US Attorneys come from clients who have actually consulted with an attorney through our platform. Each review is linked to a verified consultation or case referral.',
  },
  {
    question: 'Can I leave a review?',
    answer:
      'Yes, any client who has worked with a listed attorney can submit a review. It will be published after verification of the professional relationship.',
  },
  {
    question: 'Can attorneys remove a negative review?',
    answer:
      'No. Negative reviews are maintained as long as they comply with our publication guidelines (no insults, truthful content). Attorneys can respond publicly to any review.',
  },
  {
    question: 'How should I read reviews effectively?',
    answer:
      'Focus on detailed reviews that describe the type of legal work performed, communication quality, and case outcomes. An attorney with 10 reviews at 4.5/5 is often more reliable than one with 2 reviews at 5/5.',
  },
  {
    question: 'Do reviews influence attorney rankings?',
    answer:
      'Yes, attorneys with the highest ratings and most active profiles appear first in search results on US Attorneys.',
  },
  {
    question: 'What should I do in case of a dispute with an attorney?',
    answer:
      'In case of a dispute, contact our mediation service. We intervene free of charge to facilitate resolution between the client and the attorney.',
  },
]

async function getPlatformStats() {
  if (IS_BUILD) return { totalReviews: 0, avgRating: 0, attorneyCount: 0 }
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Get total providers with reviews
    const { count: attorneyCount } = await supabase
      .from('attorneys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('review_count', 0)

    // Get total review count and average rating
    const { data: stats } = await supabase
      .from('attorneys')
      .select('rating_average, review_count')
      .eq('is_active', true)
      .gt('review_count', 0)

    if (!stats || stats.length === 0) {
      return { totalReviews: 0, avgRating: 0, attorneyCount: 0 }
    }

    const totalReviews = stats.reduce((sum, p) => sum + (p.review_count || 0), 0)
    const avgRating =
      stats.reduce((sum, p) => sum + (p.rating_average || 0), 0) /
      stats.filter((p) => p.rating_average && p.rating_average > 0).length

    return {
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      attorneyCount: attorneyCount || 0,
    }
  } catch {
    return { totalReviews: 0, avgRating: 0, attorneyCount: 0 }
  }
}

export default async function ReviewsPage() {
  const platformStats = await getPlatformStats()
  const cmsPage = await getPageContent('reviews', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd
        data={[
          getBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Reviews', url: '/reviews' },
          ]),
          getFAQSchema(
            faqItems.map((item) => ({
              question: item.question,
              answer: item.answer,
            }))
          ),
          ...(platformStats.totalReviews > 0
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'Organization',
                  name: 'US Attorneys',
                  url: SITE_URL,
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: platformStats.avgRating,
                    reviewCount: platformStats.totalReviews,
                    bestRating: 5,
                    worstRating: 1,
                  },
                },
              ]
            : []),
        ]}
      />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        {/* Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-10 md:pb-36 md:pt-14">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Reviews' }]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-5 font-heading text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] md:text-4xl lg:text-5xl">
              Attorney Reviews &mdash;{' '}
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Find a Trusted
              </span>{' '}
              Professional
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
              Browse verified reviews, compare profiles and choose the attorney that best fits your
              needs.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div key={badge.label} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{badge.label}</div>
                      <div className="text-xs text-slate-500">{badge.sublabel}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REAL PLATFORM STATS ─────────────────────────── */}
      {platformStats.totalReviews > 0 && (
        <section className="relative z-10 -mt-10 px-4 pb-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                    <span className="text-3xl font-bold text-gray-900">
                      {platformStats.avgRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {platformStats.totalReviews.toLocaleString('en-US')}
                  </div>
                  <div className="text-sm text-gray-500">Verified Reviews</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {platformStats.attorneyCount.toLocaleString('en-US')}
                  </div>
                  <div className="text-sm text-gray-500">Rated Attorneys</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Simple and fast
            </p>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Three steps to find a trusted attorney near you.
            </p>
          </div>

          <div className="relative grid gap-10 md:grid-cols-3">
            {/* Connector line */}
            <div className="absolute left-[20%] right-[20%] top-14 hidden md:block">
              <div className="h-px border-t-2 border-dashed border-gray-200" />
            </div>

            {howSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.number} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{item.number}</span>
                    </div>
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">FAQ</p>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Everything you need to know about attorney reviews.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-white"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                  <span className="pr-4 font-semibold text-slate-900">{item.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-slate-500">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS BY PRACTICE AREA ────────────────────────── */}
      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Reviews by Practice Area
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Select a practice area to view reviews and recommendations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(tradeContent).map(([slug, trade]) => (
              <Link
                key={slug}
                href={`/reviews/${slug}`}
                className="group rounded-xl border border-gray-200 bg-gray-50 p-3 text-center transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                  {trade.name}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {trade.priceRange.min}&ndash;{trade.priceRange.max} {trade.priceRange.unit}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS BY CITY ────────────────────────────────── */}
      <section className="border-t bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Reviews by City
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Browse attorney reviews in major cities across the United States.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {cities.slice(0, 20).map((city) => (
              <Link
                key={city.slug}
                href={`/reviews/personal-injury/${city.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS BY PRACTICE AREA & CITY ─────────────────── */}
      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Reviews by Practice Area and City
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Find attorney reviews by specialty in your city.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 8).map((service) => (
              <div key={service.slug} className="rounded-xl bg-gray-50 p-5">
                <h3 className="mb-3 font-semibold text-gray-900">{service.name} reviews</h3>
                <div className="space-y-1.5">
                  {cities.slice(0, 6).map((city) => (
                    <Link
                      key={city.slug}
                      href={`/reviews/${service.slug}/${city.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" /> {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SEE ALSO — CROSS-LINKS ──────────────────── */}
      <section className="border-t bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              See Also
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Explore our other sections to find the ideal attorney.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Col 1: Consultations */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Attorney Consultations</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/quotes/${s.slug}`}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> {s.name} consultation
                  </Link>
                ))}
              </div>
            </div>
            {/* Col 2: Pricing */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Attorney Fees</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/pricing/${s.slug}`}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> {s.name} fees
                  </Link>
                ))}
              </div>
            </div>
            {/* Col 3: Emergency */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Emergency Attorney</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/emergency/${s.slug}`}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" /> Emergency {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            {/* Col 4: Navigation */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Navigation</h3>
              <div className="space-y-1.5">
                <Link
                  href="/practice-areas"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" /> All Practice Areas
                </Link>
                <Link
                  href="/cities"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" /> All Cities
                </Link>
                <Link
                  href="/states"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" /> All States
                </Link>
                <Link
                  href="/regions"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" /> All Regions
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" /> Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Star className="mx-auto mb-4 h-8 w-8 text-amber-400" />
          <h2 className="mb-3 font-heading text-xl font-bold text-slate-900 md:text-2xl">
            Need a Trusted Attorney?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-slate-500">
            Compare reviews, browse profiles and request a free consultation from verified
            attorneys.
          </p>
          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
          >
            <Star className="h-5 w-5" />
            Request a Free Consultation
          </Link>
        </div>
      </section>
    </div>
  )
}
