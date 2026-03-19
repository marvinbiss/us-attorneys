import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, Search, Lock, Eye, ArrowRight, Database, Users } from 'lucide-react'
import { pageImages, BLUR_PLACEHOLDER } from '@/lib/data/images'
import Breadcrumb from '@/components/Breadcrumb'
import { createAdminClient } from '@/lib/supabase/admin'
import JsonLd from '@/components/JsonLd'
import { getOrganizationSchema, getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { companyIdentity } from '@/lib/config/company-identity'
import { getPageContent } from '@/lib/cms'
import { teamMembers, getAllAuthors } from '@/lib/data/team'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'About USAttorneys',
  description:
    'USAttorneys lists thousands of attorneys using public bar records. Free, transparent, and reliable attorney directory.',
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'About — Attorney Directory in the United States',
    description:
      'USAttorneys lists thousands of attorneys using public bar records. Free, transparent, and reliable attorney directory.',
    url: `${SITE_URL}/about`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'USAttorneys — Attorney Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — Attorney Directory in the United States',
    description: 'USAttorneys lists thousands of attorneys using public bar records.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 3600

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// Fallback stats used when DB is unavailable during static generation
const FALLBACK_STATS = { attorneyCount: 0, reviewCount: 0, cityCount: 0 }

async function getStats() {
  if (IS_BUILD) return FALLBACK_STATS
  try {
    const supabase = createAdminClient()

    // Try materialized view first (single query ~5ms vs 3 queries O(n))
    try {
      const { data: stats, error } = await Promise.race([
        supabase
          .from('mv_attorney_stats')
          .select('active_count, unique_cities, total_reviews, providers_with_reviews')
          .single(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getStats MV timeout')), 6_000)
        ),
      ])

      if (!error && stats) {
        return {
          attorneyCount: stats.active_count || FALLBACK_STATS.attorneyCount,
          reviewCount: stats.total_reviews || FALLBACK_STATS.reviewCount,
          cityCount: stats.unique_cities || FALLBACK_STATS.cityCount,
        }
      }
    } catch {
      // MV not available — fall through to legacy queries
    }

    // Fallback: legacy 3-query approach if MV doesn't exist yet
    const result = await Promise.race([
      Promise.all([
        supabase
          .from('attorneys')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('attorneys')
          .select('review_count')
          .eq('is_active', true)
          .gt('review_count', 0),
        supabase.from('attorneys').select('address_city').eq('is_active', true),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getStats timeout')), 6_000)
      ),
    ])

    const [{ count: attorneyCount }, { data: attorneyStats }, { data: cities }] = result

    const totalReviews = attorneyStats?.reduce((sum, p) => sum + (p.review_count || 0), 0) || 0
    const uniqueCities = new Set(cities?.map((c) => c.address_city).filter(Boolean)).size

    return {
      attorneyCount: attorneyCount || FALLBACK_STATS.attorneyCount,
      reviewCount: totalReviews || FALLBACK_STATS.reviewCount,
      cityCount: uniqueCities || FALLBACK_STATS.cityCount,
    }
  } catch {
    return FALLBACK_STATS
  }
}

const verificationSteps = [
  {
    icon: Database,
    title: 'Official bar records',
    description:
      'Every attorney is sourced from state bar association public records. Bar number, practice areas, and office address are verified against official data.',
  },
  {
    icon: Shield,
    title: 'Malpractice insurance',
    description:
      'We verify that attorneys carry active professional liability (malpractice) insurance coverage.',
  },
  {
    icon: Lock,
    title: 'Bar standing verification',
    description:
      'Active bar membership and good standing status are verified before any attorney profile is listed.',
  },
  {
    icon: Eye,
    title: 'Authentic reviews',
    description:
      'Only clients who have engaged an attorney through the platform can leave a review.',
  },
]

const commitments = [
  {
    title: 'Zero fabricated information',
    description:
      'All data comes from official state bar records. No fabricated profiles on the platform.',
  },
  {
    title: 'Data protection',
    description:
      'Full compliance with data privacy laws, secure hosting, privacy officer reachable at privacy@lawtendr.com.',
  },
  {
    title: 'Fee transparency',
    description: 'Completely free service for all users, both clients and attorneys.',
  },
  {
    title: 'No data resale',
    description: 'Your personal data is never sold to third parties. Ever.',
  },
]

export default async function AProposPage() {
  const cmsPage = await getPageContent('about', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd
          data={getBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'About', url: '/about' },
          ])}
        />
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'About' }]} className="mb-4" />
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
        {/* Our team — E-E-A-T (also in CMS branch) */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900">Our team</h2>
            {(() => {
              const editorial = teamMembers[0]
              if (!editorial) return null
              return (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 shadow-sm">
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{editorial.name}</h3>
                      <p className="mb-2 text-sm text-blue-600">{editorial.role}</p>
                      <p className="leading-relaxed text-gray-700">{editorial.bio}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editorial.expertise.map((e) => (
                          <span
                            key={e}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </section>
      </div>
    )
  }

  const stats = await getStats()
  const hasArtisans = stats.attorneyCount > 0

  const orgSchema = getOrganizationSchema()
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[orgSchema, breadcrumbSchema]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
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
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 md:pb-36 md:pt-14 lg:px-8">
          <Breadcrumb
            items={[{ label: 'About' }]}
            className="mb-6 text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="mb-6 font-heading text-4xl font-extrabold tracking-[-0.025em] md:text-5xl">
              US Attorney Directory
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-slate-400">
              We built an attorney directory for the United States using public bar association
              records.
              {stats.attorneyCount > 0
                ? ` ${stats.attorneyCount.toLocaleString('en-US')}+ verified professionals,`
                : ' Thousands of verified professionals,'}{' '}
              accessible for free.
            </p>
          </div>
        </div>
      </section>

      {/* How we verify attorneys */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">How we verify attorneys</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Every attorney listed on the platform goes through a multi-step verification process.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {verificationSteps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                    <Icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our technology + business model */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Technology */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="relative h-48 w-full">
                {pageImages.about?.[0] && (
                  <Image
                    src={pageImages.about[0].src}
                    alt={pageImages.about[0].alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                )}
              </div>
              <div className="p-8">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Our technology</h2>
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <p>
                      Attorney data sourced from <strong>state bar association</strong> public
                      records and verified databases.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <p>
                      Platform built with <strong>Next.js</strong> for optimal performance and
                      search engine visibility.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <p>
                      Data securely hosted via <strong>Supabase</strong> (PostgreSQL).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">4</span>
                    </div>
                    <p>
                      Secure payments via <strong>Stripe</strong>, PCI-DSS certified.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-xs font-bold text-blue-600">5</span>
                    </div>
                    <p>
                      Monitoring and error management via <strong>Sentry</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business model */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
              <div className="relative h-48 w-full">
                {pageImages.about?.[1] && (
                  <Image
                    src={pageImages.about[1].src}
                    alt={pageImages.about[1].alt}
                    fill
                    className="object-cover opacity-40"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/60 to-blue-700/90" />
              </div>
              <div className="p-8">
                <h2 className="mb-6 text-2xl font-bold">Our business model</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Search className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-200" />
                    <div>
                      <p className="font-semibold">Free for clients</p>
                      <p className="text-sm text-blue-100">
                        Search for attorneys, request consultations, compare: everything is free.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Search className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-200" />
                    <div>
                      <p className="font-semibold">Free for attorneys</p>
                      <p className="text-sm text-blue-100">
                        Attorneys can create their profile and receive consultation requests for
                        free.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-200" />
                    <div>
                      <p className="font-semibold">No data resale</p>
                      <p className="text-sm text-blue-100">
                        Your personal data is never sold to third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats or launch state */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {hasArtisans ? (
            <>
              <h2 className="mb-8 text-3xl font-bold text-gray-900">The directory in numbers</h2>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.attorneyCount.toLocaleString('en-US')}
                  </div>
                  <div className="mt-1 text-gray-600">Verified attorneys</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{stats.cityCount}</div>
                  <div className="mt-1 text-gray-600">Cities covered</div>
                </div>
                {stats.reviewCount > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.reviewCount.toLocaleString('en-US')}
                    </div>
                    <div className="mt-1 text-gray-600">Authentic reviews</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">
                  Directory under construction
                </h2>
                <p className="mb-6 text-gray-600">
                  We are importing data from state bar association records to build the most
                  comprehensive attorney directory in the US. The first verified professionals will
                  be accessible soon.
                </p>
                <Link
                  href="/register-attorney"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Join as an attorney partner
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Our commitments */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Our commitments</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Concrete and verifiable commitments.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {commitments.map((commitment) => (
              <div
                key={commitment.title}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{commitment.title}</h3>
                <p className="text-sm text-gray-600">{commitment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learn more about our commitments */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Learn more about our commitments
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Link
                href="/verification-process"
                className="group rounded-xl border border-gray-100 bg-gray-50 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  Verification process
                </h3>
                <p className="text-sm text-gray-600">
                  Details on bar verification, insurance, and ongoing attorney monitoring.
                </p>
              </Link>
              <Link
                href="/review-policy"
                className="group rounded-xl border border-gray-100 bg-gray-50 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  Review policy
                </h3>
                <p className="text-sm text-gray-600">
                  Our policy for collecting, moderating, and publishing client reviews.
                </p>
              </Link>
              <Link
                href="/mediation"
                className="group rounded-xl border border-gray-100 bg-gray-50 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  Dispute resolution
                </h3>
                <p className="text-sm text-gray-600">
                  Claims process and mediation in case of disputes.
                </p>
              </Link>
              <Link
                href="/legal"
                className="group rounded-xl border border-gray-100 bg-gray-50 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  Legal notices
                </h3>
                <p className="text-sm text-gray-600">
                  Legal information, publisher, and site hosting details.
                </p>
              </Link>
              <Link
                href="/contact"
                className="group rounded-xl border border-gray-100 bg-gray-50 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                  Contact
                </h3>
                <p className="text-sm text-gray-600">Have a question? Contact our team.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our team — E-E-A-T */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Our team</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              The experts behind our content and platform.
            </p>
          </div>

          {/* Editorial team */}
          {(() => {
            const editorial = teamMembers[0]
            if (!editorial) return null
            return (
              <div className="mx-auto mb-10 max-w-4xl rounded-xl border border-gray-100 bg-gray-50 p-8 shadow-sm">
                <div className="flex items-start gap-6">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{editorial.name}</h3>
                    <p className="mb-2 text-sm text-blue-600">{editorial.role}</p>
                    <p className="leading-relaxed text-gray-700">{editorial.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {editorial.expertise.map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Individual authors */}
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {getAllAuthors().map((author) => {
              const initials = author.name
                .split(' ')
                .map((n) => n[0])
                .join('')
              return (
                <div
                  key={author.slug}
                  className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{author.name}</h3>
                      <p className="text-sm text-blue-600">{author.role}</p>
                    </div>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-gray-600">{author.bio}</p>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {author.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {author.certifications.map((cert) => (
                      <span
                        key={cert}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {author.yearsExperience} years of experience
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white">Have a question?</h2>
          <p className="mb-8 text-xl text-blue-100">
            Contact us at <strong>{companyIdentity.email}</strong> or through our contact page.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Contact us
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
