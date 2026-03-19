import { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield,
  Clock,
  Users,
  Search,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Star,
  ArrowUp,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import ConsultationRequestForm from '@/components/QuoteForm'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { tradeContent } from '@/lib/data/trade-content'
import { cities, services } from '@/lib/data/usa'
import TrustGuarantee from '@/components/TrustGuarantee'
import dynamic from 'next/dynamic'

const SocialProofBanner = dynamic(() => import('@/components/SocialProofBanner'), { ssr: false })
const RecentSearches = dynamic(() => import('@/components/RecentSearches'), { ssr: false })

export const metadata: Metadata = {
  title: 'Free Attorney Consultation — Compare Offers',
  description:
    'Request a free attorney consultation: personal injury, family law, criminal defense, and 50+ practice areas. Up to 3 quotes in 24h. 100% free, no obligation.',
  alternates: {
    canonical: `${SITE_URL}/quotes`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Free Attorney Consultation — Compare Offers',
    description:
      'Request a free attorney consultation. Up to 3 quotes from verified attorneys in 24h. 100% free, no obligation.',
    url: `${SITE_URL}/quotes`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'USAttorneys — Free consultation',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Attorney Consultation — Compare Offers',
    description:
      'Request a free attorney consultation. Up to 3 quotes from verified attorneys in 24h.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const trustBadges = [
  { icon: Shield, label: 'Free', sublabel: 'No hidden fees' },
  { icon: Clock, label: 'No obligation', sublabel: 'Response within 24h' },
  { icon: Users, label: 'Verified attorneys', sublabel: 'Bar-verified' },
]

const howSteps = [
  {
    number: '1',
    icon: Search,
    title: 'Describe your case',
    description:
      'Select the type of service, enter your city, and describe your legal needs in a few lines. Quick form in 2 minutes.',
  },
  {
    number: '2',
    icon: FileText,
    title: 'Receive your quotes',
    description:
      'Your request is sent to qualified attorneys near you. You receive up to 3 detailed quotes within 24 to 48 hours.',
  },
  {
    number: '3',
    icon: CheckCircle,
    title: 'Choose freely',
    description:
      'Compare rates, review profiles, and choose the attorney that suits you. No obligation to accept.',
  },
]

const faqItems = [
  {
    question: 'Is the service really free?',
    answer:
      'Yes, requesting a consultation is 100% free with no obligation. You pay nothing to receive proposals from attorneys.',
  },
  {
    question: 'How many quotes will I receive?',
    answer:
      'You can receive up to 3 quotes from different attorneys, depending on availability in your area. Each quote is customized based on your case.',
  },
  {
    question: 'How quickly will I be contacted?',
    answer:
      'Available attorneys typically contact you within 24 to 48 hours after submitting your request. For urgent matters, specify this in the form to expedite processing.',
  },
  {
    question: 'How are attorneys verified?',
    answer:
      'All attorneys listed on USAttorneys are verified through state bar records. We check their bar number and standing with the official state bar association.',
  },
  {
    question: 'Am I obligated to accept a quote?',
    answer:
      'No, you are completely free. Compare the quotes you receive at your own pace and choose the one that best fits your needs and budget. No obligation to accept.',
  },
  {
    question: 'What personal data is shared?',
    answer:
      'Only your name, phone number, and case description are shared with selected attorneys. Your email address remains confidential and your data is never sold to third parties.',
  },
]

export default async function QuotesPage() {
  const cmsPage = await getPageContent('quotes', 'static')

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
            { name: 'Request a consultation', url: '/quotes' },
          ]),
          getFAQSchema(faqItems.map((item) => ({ question: item.question, answer: item.answer }))),
        ]}
      />

      {/* HERO */}
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
              items={[{ label: 'Request a consultation' }]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-5 font-heading text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] md:text-4xl lg:text-5xl">
              Receive up to{' '}
              <span className="whitespace-nowrap bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                3&nbsp;free consultations
              </span>{' '}
              from verified attorneys
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
              Fill out the form below and compare offers from qualified professionals near you.
              Service 100&nbsp;% free, no obligation.
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

      {/* SOCIAL PROOF */}
      <div className="relative z-10 mx-auto -mt-6 mb-4 max-w-3xl px-4">
        <SocialProofBanner variant="card" />
      </div>

      {/* RECENT SEARCHES */}
      <div className="relative z-10 mx-auto -mt-8 mb-4 max-w-3xl px-4">
        <RecentSearches />
      </div>

      {/* FORM */}
      <section id="formulaire" className="relative z-10 -mt-16 px-4 pb-20">
        <ConsultationRequestForm />
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Simple and fast
            </p>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              How it works
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Three steps are all it takes to receive personalized quotes from trusted attorneys.
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

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">FAQ</p>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Frequently asked questions
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Everything you need to know before requesting your free consultation.
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

      {/* CONSULTATIONS BY PRACTICE AREA */}
      <section className="border-t bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Consultations by practice area
            </h2>
            <p className="mx-auto max-w-lg text-slate-500">
              Select a practice area to get a consultation tailored to your case.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(tradeContent).map(([slug, trade]) => (
              <Link
                key={slug}
                href={`/quotes/${slug}`}
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

      {/* TRUST GUARANTEE */}
      <section className="bg-white py-8">
        <div className="mx-auto max-w-3xl px-4">
          <TrustGuarantee variant="compact" />
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Star className="mx-auto mb-4 h-8 w-8 text-amber-400" />
          <h2 className="mb-3 font-heading text-xl font-bold text-slate-900 md:text-2xl">
            Ready to start your case?
          </h2>
          <p className="mx-auto mb-6 max-w-md text-slate-500">
            Compare free quotes from qualified attorneys and find the right professional for your
            legal needs.
          </p>
          <a
            href="#formulaire"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
          >
            <ArrowUp className="h-5 w-5" />
            Fill out the form
          </a>
        </div>
      </section>

      {/* CONSULTATIONS BY CITY */}
      <section className="border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900">
            Attorney consultations by city
          </h2>
          <div className="flex flex-wrap gap-2">
            {cities.slice(0, 20).map((city) => (
              <Link
                key={city.slug}
                href={`/quotes/personal-injury/${city.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CONSULTATIONS BY SERVICE AND CITY (MATRIX) */}
      <section className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900">
            Consultations by practice area and city
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 8).map((service) => (
              <div key={service.slug}>
                <h3 className="mb-3 font-semibold text-gray-900">{service.name} consultation</h3>
                <div className="space-y-1.5">
                  {cities.slice(0, 6).map((city) => (
                    <Link
                      key={city.slug}
                      href={`/quotes/${service.slug}/${city.slug}`}
                      className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEE ALSO (CROSS-INTENT) */}
      <section className="border-t bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-heading text-xl font-bold text-gray-900">See also</h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Attorney reviews
              </h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/reviews/${s.slug}`}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name} reviews
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Attorney fees
              </h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/pricing/${s.slug}`}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name} fees
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Emergency attorneys
              </h3>
              <div className="space-y-1.5">
                {services.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/emergency/${s.slug}`}
                    className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Emergency {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
                Navigation
              </h3>
              <div className="space-y-1.5">
                <Link
                  href="/practice-areas"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All services
                </Link>
                <Link
                  href="/cities"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All cities
                </Link>
                <Link
                  href="/states"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All states
                </Link>
                <Link
                  href="/regions"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All regions
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Blog
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Attorney fees
                </Link>
                <Link
                  href="/emergency"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Emergency attorneys
                </Link>
                <Link
                  href="/reviews"
                  className="flex items-center gap-2 py-1 text-sm text-gray-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Attorney reviews
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
