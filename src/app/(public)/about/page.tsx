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
  description: 'USAttorneys lists thousands of attorneys using public bar records. Free, transparent, and reliable attorney directory.',
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
    description: 'USAttorneys lists thousands of attorneys using public bar records. Free, transparent, and reliable attorney directory.',
    url: `${SITE_URL}/about`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'USAttorneys — Attorney Directory' }],
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
          .from('mv_provider_stats')
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
        supabase.from('attorneys').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attorneys').select('review_count').eq('is_active', true).gt('review_count', 0),
        supabase.from('attorneys').select('address_city').eq('is_active', true)
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getStats timeout')), 6_000)
      ),
    ])

    const [{ count: attorneyCount }, { data: attorneyStats }, { data: cities }] = result

    const totalReviews = attorneyStats?.reduce((sum, p) => sum + (p.review_count || 0), 0) || 0
    const uniqueCities = new Set(cities?.map(c => c.address_city).filter(Boolean)).size

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
    description: 'Every attorney is sourced from state bar association public records. Bar number, practice areas, and office address are verified against official data.',
  },
  {
    icon: Shield,
    title: 'Malpractice insurance',
    description: 'We verify that attorneys carry active professional liability (malpractice) insurance coverage.',
  },
  {
    icon: Lock,
    title: 'Bar standing verification',
    description: 'Active bar membership and good standing status are verified before any attorney profile is listed.',
  },
  {
    icon: Eye,
    title: 'Authentic reviews',
    description: 'Only clients who have engaged an attorney through the platform can leave a review.',
  },
]

const commitments = [
  {
    title: 'Zero fabricated information',
    description: 'All data comes from official state bar records. No fabricated profiles on the platform.',
  },
  {
    title: 'Data protection',
    description: 'Full compliance with data privacy laws, secure hosting, privacy officer reachable at privacy@us-attorneys.com.',
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
  const cmsPage = await getPageContent('a-propos', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'À propos', url: '/about' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'About' }]} className="mb-4" />
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
        {/* Notre équipe — E-E-A-T (also in CMS branch) */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
              Our team
            </h2>
            {(() => {
              const editorial = teamMembers[0]
              return (
                <div className="bg-gray-50 rounded-xl shadow-sm p-8 border border-gray-100">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{editorial.name}</h3>
                      <p className="text-sm text-blue-600 mb-2">{editorial.role}</p>
                      <p className="text-gray-700 leading-relaxed">{editorial.bio}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {editorial.expertise.map(e => (
                          <span key={e} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
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
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[{ label: 'About' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
            US Attorney Directory
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            We built an attorney directory for the United States
            using public bar association records.
            {stats.attorneyCount > 0 ? ` ${stats.attorneyCount.toLocaleString('en-US')}+ verified professionals,` : ' Thousands of verified professionals,'} accessible for free.
          </p>
          </div>
        </div>
      </section>

      {/* Comment nous référençons les artisans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How we verify attorneys
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every attorney listed on the platform goes through a multi-step
              verification process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {verificationSteps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Notre technologie + modèle économique */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Technologie */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={pageImages.about[0].src}
                  alt={pageImages.about[0].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>
              <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our technology</h2>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p>Attorney data sourced from <strong>state bar association</strong> public records and verified databases.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p>Platform built with <strong>Next.js</strong> for optimal performance and search engine visibility.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p>Data securely hosted via <strong>Supabase</strong> (PostgreSQL).</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">4</span>
                  </div>
                  <p>Secure payments via <strong>Stripe</strong>, PCI-DSS certified.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">5</span>
                  </div>
                  <p>Monitoring and error management via <strong>Sentry</strong>.</p>
                </div>
              </div>
              </div>
            </div>

            {/* Modèle économique */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl overflow-hidden text-white">
              <div className="relative h-48 w-full">
                <Image
                  src={pageImages.about[1].src}
                  alt={pageImages.about[1].alt}
                  fill
                  className="object-cover opacity-40"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/60 to-blue-700/90" />
              </div>
              <div className="p-8">
              <h2 className="text-2xl font-bold mb-6">Our business model</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Free for clients</p>
                    <p className="text-blue-100 text-sm">Search for attorneys, request consultations, compare: everything is free.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Free for attorneys</p>
                    <p className="text-blue-100 text-sm">Attorneys can create their profile and receive consultation requests for free.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-200 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">No data resale</p>
                    <p className="text-blue-100 text-sm">Your personal data is never sold to third parties.</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres ou état de lancement */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {hasArtisans ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                The directory in numbers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.attorneyCount.toLocaleString('en-US')}
                  </div>
                  <div className="text-gray-600 mt-1">Verified attorneys</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.cityCount}
                  </div>
                  <div className="text-gray-600 mt-1">Cities covered</div>
                </div>
                {stats.reviewCount > 0 && (
                  <div>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.reviewCount.toLocaleString('en-US')}
                    </div>
                    <div className="text-gray-600 mt-1">Authentic reviews</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="max-w-xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Directory under construction
                </h2>
                <p className="text-gray-600 mb-6">
                  We are importing data from state bar association records to build
                  the most comprehensive attorney directory in the US. The first verified professionals
                  will be accessible soon.
                </p>
                <Link
                  href="/register-attorney"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Join as an attorney partner
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Nos engagements */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our commitments
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Concrete and verifiable commitments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {commitments.map((commitment) => (
              <div key={commitment.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{commitment.title}</h3>
                <p className="text-gray-600 text-sm">{commitment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* En savoir plus sur nos engagements */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Learn more about our commitments
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/verification-process"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Verification process
                </h3>
                <p className="text-gray-600 text-sm">
                  Details on bar verification, insurance, and ongoing attorney monitoring.
                </p>
              </Link>
              <Link
                href="/review-policy"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Review policy
                </h3>
                <p className="text-gray-600 text-sm">
                  Our policy for collecting, moderating, and publishing client reviews.
                </p>
              </Link>
              <Link
                href="/mediation"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Dispute resolution
                </h3>
                <p className="text-gray-600 text-sm">
                  Claims process and mediation in case of disputes.
                </p>
              </Link>
              <Link
                href="/legal"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Legal notices
                </h3>
                <p className="text-gray-600 text-sm">
                  Legal information, publisher, and site hosting details.
                </p>
              </Link>
              <Link
                href="/contact"
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Contact
                </h3>
                <p className="text-gray-600 text-sm">
                  Have a question? Contact our team.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Notre équipe — E-E-A-T */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              The experts behind our content and platform.
            </p>
          </div>

          {/* Équipe éditoriale collective */}
          {(() => {
            const editorial = teamMembers[0]
            return (
              <div className="bg-gray-50 rounded-xl shadow-sm p-8 mb-10 max-w-4xl mx-auto border border-gray-100">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{editorial.name}</h3>
                    <p className="text-sm text-blue-600 mb-2">{editorial.role}</p>
                    <p className="text-gray-700 leading-relaxed">{editorial.bio}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {editorial.expertise.map(e => (
                        <span key={e} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Auteurs individuels */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {getAllAuthors().map((author) => {
              const initials = author.name.split(' ').map(n => n[0]).join('')
              return (
                <div key={author.slug} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{author.name}</h3>
                      <p className="text-sm text-blue-600">{author.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{author.bio}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {author.expertise.map(exp => (
                      <span key={exp} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {exp}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {author.certifications.map(cert => (
                      <span key={cert} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{author.yearsExperience} years of experience</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Have a question?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us at <strong>{companyIdentity.email}</strong> or through our contact page.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Contact us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
