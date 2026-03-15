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

export const revalidate = 86400 // 24h

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
    description:
      'Explore verified attorney profiles near you and review their qualifications.',
  },
  {
    number: '2',
    icon: Star,
    title: 'Compare Reviews',
    description:
      'Read verified client experiences and compare professional ratings.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choose Your Attorney',
    description:
      'Select the professional that best fits your needs and request a consultation.',
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
    const avgRating = stats.reduce((sum, p) => sum + (p.rating_average || 0), 0) / stats.filter(p => p.rating_average && p.rating_average > 0).length

    return {
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      attorneyCount: attorneyCount || 0,
    }
  } catch {
    return { totalReviews: 0, avgRating: 0, attorneyCount: 0 }
  }
}

export default async function AvisPage() {
  const platformStats = await getPlatformStats()
  const cmsPage = await getPageContent('avis', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
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
          ...(platformStats.totalReviews > 0 ? [{
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
          }] : []),
        ]}
      />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
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

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Reviews' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
              Attorney Reviews &mdash;{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300">
                Find a Trusted
              </span>{' '}
              Professional
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Browse verified reviews, compare profiles
              and choose the attorney that best fits your needs.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {trustBadges.map((badge) => {
                const Icon = badge.icon
                return (
                  <div key={badge.label} className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/[0.08] backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">
                        {badge.label}
                      </div>
                      <div className="text-xs text-slate-500">
                        {badge.sublabel}
                      </div>
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
        <section className="relative -mt-10 z-10 px-4 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                    <span className="text-3xl font-bold text-gray-900">{platformStats.avgRating.toFixed(1)}</span>
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{platformStats.totalReviews.toLocaleString('en-US')}</div>
                  <div className="text-sm text-gray-500">Verified Reviews</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{platformStats.attorneyCount.toLocaleString('en-US')}</div>
                  <div className="text-sm text-gray-500">Rated Attorneys</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              Simple and fast
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Three steps to find a trusted attorney near you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%]">
              <div className="h-px border-t-2 border-dashed border-gray-200" />
            </div>

            {howSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.number} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-slate-700">
                        {item.number}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
              FAQ
            </p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Everything you need to know about attorney reviews.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-slate-900 pr-4">
                    {item.question}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AVIS PAR MÉTIER ──────────────────────────────────── */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Reviews by Practice Area
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Select a practice area to view reviews and recommendations.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(tradeContent).map(([slug, trade]) => (
              <Link
                key={slug}
                href={`/reviews/${slug}`}
                className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-3 transition-all group text-center"
              >
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
                  {trade.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {trade.priceRange.min}&ndash;{trade.priceRange.max}{' '}
                  {trade.priceRange.unit}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AVIS PAR VILLE ──────────────────────────────────── */}
      <section className="py-16 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Reviews by City
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Browse attorney reviews in major cities across the United States.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {cities.slice(0, 20).map((ville) => (
              <Link
                key={ville.slug}
                href={`/reviews/plombier/${ville.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                {ville.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AVIS PAR MÉTIER × VILLE ─────────────────────────── */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Reviews by Practice Area and City
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Find attorney reviews by specialty in your city.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 8).map((service) => (
              <div key={service.slug} className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {service.name} reviews
                </h3>
                <div className="space-y-1.5">
                  {cities.slice(0, 6).map((ville) => (
                    <Link
                      key={ville.slug}
                      href={`/reviews/${service.slug}/${ville.slug}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" /> {ville.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VOIR AUSSI — LIENS TRANSVERSAUX ──────────────────── */}
      <section className="py-16 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              See Also
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Explore our other sections to find the ideal attorney.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Devis */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Attorney Consultations</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/quotes/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" /> {s.name} consultation
                  </Link>
                ))}
              </div>
            </div>
            {/* Col 2: Tarifs */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Attorney Fees</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/pricing/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" /> {s.name} fees
                  </Link>
                ))}
              </div>
            </div>
            {/* Col 3: Urgence */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Emergency Attorney</h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/emergency/${s.slug}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" /> Emergency {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            {/* Col 4: Navigation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Navigation</h3>
              <div className="space-y-1.5">
                <Link href="/services" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> All Practice Areas
                </Link>
                <Link href="/cities" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> All Cities
                </Link>
                <Link href="/states" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> All States
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> All Regions
                </Link>
                <Link href="/blog" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                  <ChevronRight className="w-3 h-3" /> Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ───────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Star className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900 mb-3">
            Need a Trusted Attorney?
          </h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Compare reviews, browse profiles and request a free consultation
            from verified attorneys.
          </p>
          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <Star className="w-5 h-5" />
            Request a Free Consultation
          </Link>
        </div>
      </section>
    </div>
  )
}
