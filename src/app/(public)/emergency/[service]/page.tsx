import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, Clock, Shield, CheckCircle, ArrowRight, AlertTriangle, MapPin } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema, getHowToSchema } from '@/lib/seo/jsonld'
import { SITE_URL, PHONE_TEL } from '@/lib/seo/config'
import { tradeContent } from '@/lib/data/trade-content'
import { hashCode } from '@/lib/seo/location-content'
import { cities, services } from '@/lib/data/usa'
import { getServiceImage } from '@/lib/data/images'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import dynamic from 'next/dynamic'
import { REVALIDATE } from '@/lib/cache'

const ExitIntentPopup = dynamic(
  () => import('@/components/ExitIntentPopup'),
  { ssr: false }
)

const UrgencyCountdown = dynamic(
  () => import('@/components/UrgencyCountdown'),
  { ssr: false }
)

export const revalidate = REVALIDATE.serviceLocation

// All services are available for emergency pages
const emergencySlugs = Object.keys(tradeContent)

// Emergency-specific display data
const emergencyMeta: Record<string, { gradient: string; lightBg: string; lightText: string; problems: string[] }> = {
  'personal-injury': {
    gradient: 'from-blue-600 to-blue-800',
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-700',
    problems: [
      'Urgent criminal charges',
      'DUI / DWI arrest',
      'Domestic violence accusation',
      'Wrongful arrest or detention',
      'Emergency restraining order',
      'Bail hearing needed',
    ],
  },
  'criminal-defense': {
    gradient: 'from-amber-600 to-amber-800',
    lightBg: 'bg-amber-50',
    lightText: 'text-amber-700',
    problems: [
      'Workplace injury',
      'Wrongful termination',
      'Employment discrimination',
      'Wage theft emergency',
      'Harassment complaint',
      'Whistleblower retaliation',
    ],
  },
  'family-law': {
    gradient: 'from-green-600 to-green-800',
    lightBg: 'bg-green-50',
    lightText: 'text-green-700',
    problems: [
      'Eviction notice received',
      'Landlord lockout',
      'Lease dispute emergency',
      'Housing code violation',
      'Emergency tenant rights',
      'Security deposit dispute',
    ],
  },
  'employment-law': {
    gradient: 'from-red-600 to-red-800',
    lightBg: 'bg-red-50',
    lightText: 'text-red-700',
    problems: [
      'Serious car accident',
      'Medical malpractice',
      'Slip and fall injury',
      'Product liability injury',
      'Dog bite attack',
      'Workers compensation claim',
    ],
  },
  'dui-dwi': {
    gradient: 'from-cyan-600 to-cyan-800',
    lightBg: 'bg-cyan-50',
    lightText: 'text-cyan-700',
    problems: [
      'Business partner dispute',
      'Contract breach emergency',
      'Intellectual property theft',
      'Commercial lease dispute',
      'Business fraud',
      'Partnership dissolution',
    ],
  },
  'real-estate-law': {
    gradient: 'from-orange-600 to-orange-800',
    lightBg: 'bg-orange-50',
    lightText: 'text-orange-700',
    problems: [
      'Child custody emergency',
      'Protective order needed',
      'Emergency child support',
      'Parental kidnapping',
      'Divorce filing urgency',
      'Spousal abuse protection',
    ],
  },
  'immigration-law': {
    gradient: 'from-indigo-600 to-indigo-800',
    lightBg: 'bg-indigo-50',
    lightText: 'text-indigo-700',
    problems: [
      'Immigration detention',
      'Deportation threat',
      'Visa emergency',
      'Asylum application urgent',
      'Green card issue',
      'Work permit emergency',
    ],
  },
}

export function generateStaticParams() {
  return emergencySlugs.map((service) => ({ service }))
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: { params: Promise<{ service: string }> }): Promise<Metadata> {
  const { service } = await params
  const trade = tradeContent[service]
  if (!trade) return {}

  const tradeLower = trade.name.toLowerCase()

  const titleHash = Math.abs(hashCode(`urgence-title-${service}`))
  const titleTemplates = [
    `Emergency ${trade.name} — Immediate Help`,
    `Emergency ${trade.name} — 24/7 Available`,
    `Urgent ${tradeLower} help — Fast response`,
    `Emergency ${trade.name} — Free consultation`,
    `${trade.name} emergency — Available now`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`urgence-desc-${service}`))
  const descTemplates = [
    `Need an emergency ${tradeLower}? Available attorneys across the US. ${trade.averageResponseTime}. Verified attorneys.`,
    `Emergency ${tradeLower}: fast response day and night. ${trade.averageResponseTime}. Free consultation, bar-verified attorneys.`,
    `Urgent ${tradeLower} matter? Find an available attorney in your area. Fast response, qualified attorneys, free consultation.`,
    `Emergency ${tradeLower} help, including weekends. Bar-verified attorneys, response within ${trade.averageResponseTime}. Free.`,
    `${trade.name} emergency nights & weekends: attorneys available across the US. Free consultation, response ${trade.averageResponseTime}.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]
  const serviceImage = getServiceImage(service)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/emergency/${service}` },
    openGraph: {
      locale: 'en_US',
      title,
      description,
      url: `${SITE_URL}/emergency/${service}`,
      type: 'website',
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `Emergency ${trade.name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

const topCities = cities.slice(0, 20)

export default async function UrgenceServicePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params

  const cmsPage = await getPageContent(service + '-urgence', 'static')

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

  const trade = tradeContent[service]
  if (!trade) notFound()

  const meta = emergencyMeta[service] || emergencyMeta['personal-injury']
  const otherEmergencies = emergencySlugs.filter((s) => s !== service)

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Emergency', url: '/emergency' },
    { name: `Emergency ${trade.name}`, url: `/emergency/${service}` },
  ])

  const tradeLowerFaq = trade.name.toLowerCase()
  const emergencyFaqItems = [
    { question: `How much does an emergency ${tradeLowerFaq} cost at night?`, answer: `Emergency night consultations (after 8 PM) are typically 50 to 100% more than standard rates. For a ${tradeLowerFaq}, expect approximately $${Math.round((trade.priceRange?.min || 60) * 1.5)} to $${Math.round((trade.priceRange?.max || 90) * 2)}/hr for emergency night service. Always request a fee estimate before engaging.` },
    { question: `What is the response time for an emergency ${tradeLowerFaq}?`, answer: `${trade.averageResponseTime}. Emergency attorneys may be available evenings and weekends. Response time varies based on your location and attorney availability.` },
    { question: `What should I do while waiting for the emergency ${tradeLowerFaq}?`, answer: `While waiting for the attorney: document everything, do not make any statements to authorities, preserve all evidence, and do not sign any documents without legal review.` },
    { question: `Is an emergency ${tradeLowerFaq} licensed and insured?`, answer: `Every professional ${tradeLowerFaq} must be licensed by the state bar association and carry malpractice insurance. Verify their bar number and standing before engaging, even in emergencies.` },
  ]

  const allFaqItems = [
    ...emergencyFaqItems.map((f) => ({ question: f.question, answer: f.answer })),
    ...trade.faq.map((f) => ({ question: f.q, answer: f.a })),
  ]

  const faqSchema = getFAQSchema(allFaqItems)

  const tradeLowerHowTo = trade.name.toLowerCase()
  const howToSchema = getHowToSchema(
    [
      {
        name: 'Assess your situation',
        text: `In a ${tradeLowerHowTo} emergency, start by assessing the urgency: determine if you need immediate legal intervention or if it can wait until business hours.`,
      },
      {
        name: 'Evaluate the severity',
        text: `Determine if this is an emergency requiring immediate action (arrest, detention, imminent deadline) or a matter that can be handled within 24-48 hours.`,
      },
      {
        name: `Contact an emergency ${tradeLowerHowTo}`,
        text: `Search for an emergency ${tradeLowerHowTo} available in your area. Choose bar-verified attorneys with confirmed credentials. Describe your situation precisely for a quick assessment.`,
      },
      {
        name: 'Discuss fees before engagement',
        text: `Even in emergencies, discuss fees and billing arrangements before retaining an attorney. Ask about payment plans and any additional charges for emergency or after-hours services.`,
      },
      {
        name: 'Preserve all documentation',
        text: `Keep all relevant documents, correspondence, and evidence organized. Take notes of any conversations and keep records of all legal proceedings for your case file.`,
      },
    ],
    {
      name: `How to handle a ${tradeLowerHowTo} emergency`,
      description: `Essential steps for effectively responding to a ${tradeLowerHowTo} emergency: assessment, finding legal help, and next steps.`,
    }
  )

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Emergency ${trade.name} by city`,
    description: `Find an emergency ${trade.name.toLowerCase()} in your city. ${trade.averageResponseTime}. Verified attorneys available evenings and weekends.`,
    url: `${SITE_URL}/emergency/${service}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: topCities.map((city, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Emergency ${trade.name} in ${city.name}`,
        url: `${SITE_URL}/emergency/${service}/${city.slug}`,
      })),
    },
  }

  // Related services for cross-linking
  const relatedServices = services.filter((s) => s.slug !== service).slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, howToSchema, collectionPageSchema, {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Emergency ${trade.name} nights & weekends`,
        description: trade.emergencyInfo,
        provider: { '@type': 'Organization', name: 'USAttorneys', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'United States' },
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '00:00',
          closes: '23:59',
        },
      }]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Emergency', href: '/emergency' },
            { label: `Emergency ${trade.name}` },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${meta.gradient} text-white py-16 md:py-20 overflow-hidden`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full">
              <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <span className="text-sm font-semibold">Available evenings and weekends</span>
            </div>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {(() => {
              const h1Hash = Math.abs(hashCode(`urgence-h1-${service}`))
              const h1Templates = [
                `Emergency ${trade.name}`,
                `Emergency ${trade.name.toLowerCase()} — nights & weekends`,
                `Urgent ${trade.name.toLowerCase()} help`,
                `${trade.name} emergency — including weekends`,
                `${trade.name.toLowerCase()} emergency response`,
              ]
              return h1Templates[h1Hash % h1Templates.length]
            })()}<br />
            <span className="opacity-80">Find a qualified attorney fast.</span>
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mb-8">
            {trade.emergencyInfo}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex flex-col items-center sm:items-start">
              <a
                href={PHONE_TEL}
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="w-6 h-6" />
                Call for assistance
              </a>
              <span className="text-sm text-white/60 mt-2">Attorney referral service</span>
            </div>
            <Link
              href={`/practice-areas/${service}`}
              className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
            >
              Fast response — Free consultation
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{trade.averageResponseTime}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Bar-verified attorneys</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Free consultation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Countdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UrgencyCountdown specialtyName={trade.name} />
      </div>

      {/* Problems */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Most common {trade.name.toLowerCase()} emergencies
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verified emergency {trade.name.toLowerCase()} attorneys can respond quickly to all these situations.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meta.problems.map((problem) => (
              <div
                key={problem}
                className={`flex items-center gap-3 ${meta.lightBg} ${meta.lightText} px-5 py-4 rounded-xl`}
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{problem}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
            Emergency {trade.name.toLowerCase()} fees
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-center mb-10">
            Indicative pricing for emergency legal services. Standard hourly rate: ${trade.priceRange.min} to ${trade.priceRange.max} {trade.priceRange.unit}.
            Emergency surcharges typically range from +50% to +100%.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {trade.commonTasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{task}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Complete fee guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications */}
      {trade.certifications.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Credentials to verify
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {trade.certifications.map((cert) => (
                <div key={cert} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  {cert}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Emergency by city */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Emergency {trade.name} by city
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCities.map((city) => (
              <Link
                key={city.slug}
                href={`/emergency/${service}/${city.slug}`}
                className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                    <MapPin className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                      {trade.name} in {city.name}
                    </div>
                    <div className="text-xs text-gray-500">Emergency nights & weekends</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/cities" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm">
              All cities <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently asked questions — Emergency {trade.name}
          </h2>
          <div className="space-y-4">
            {allFaqItems.map((item, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.question}</h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Practical tips
          </h2>
          <div className="space-y-4">
            {trade.tips.slice(0, 3).map((tip, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other emergencies */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Other emergencies</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {otherEmergencies.map((slug) => {
              const t = tradeContent[slug]
              return (
                <Link
                  key={slug}
                  href={`/emergency/${slug}`}
                  className="bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl p-4 transition-all group text-center"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">
                    Emergency {t.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{t.averageResponseTime}</div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* See also */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">See also</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Related services</h3>
              <div className="space-y-2">
                <Link href={`/practice-areas/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} — main page</Link>
                <Link href={`/pricing/${service}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{trade.name} fees</Link>
                {relatedServices.map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">{s.name}</Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">{trade.name} by city</h3>
              <div className="space-y-2">
                {topCities.slice(0, 6).map((v) => (
                  <Link key={v.slug} href={`/emergency/${service}/${v.slug}`} className="block text-sm text-gray-600 hover:text-blue-600 py-1">
                    {trade.name} in {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Useful information</h3>
              <div className="space-y-2">
                <Link href="/emergency" className="block text-sm text-gray-600 hover:text-blue-600 py-1">All emergencies</Link>
                <Link href="/how-it-works" className="block text-sm text-gray-600 hover:text-blue-600 py-1">How it works</Link>
                <Link href="/pricing" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Fee guide</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-blue-600 py-1">FAQ</Link>
                <Link href="/verification-process" className="block text-sm text-gray-600 hover:text-blue-600 py-1">Verification process</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial credibility */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Important information</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Response times are estimates based on typical attorney availability and may vary. USAttorneys is a directory — we connect you with attorneys but do not provide legal representation. In a life-threatening emergency, call 911.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety Links (E-E-A-T) */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Trust &amp; Safety
          </h2>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/verification-process" className="text-blue-600 hover:text-blue-800">
              How we verify attorneys
            </Link>
            <Link href="/review-policy" className="text-blue-600 hover:text-blue-800">
              Our review policy
            </Link>
            <Link href="/mediation" className="text-blue-600 hover:text-blue-800">
              Dispute resolution
            </Link>
          </nav>
        </div>
      </section>

      {/* Cross-intent links */}
      <CrossIntentLinks
        service={service}
        specialtyName={trade.name}
        currentIntent="emergency"
      />

      {/* Final CTA */}
      <section className={`bg-gradient-to-br ${meta.gradient} text-white py-16 overflow-hidden`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need an emergency {trade.name.toLowerCase()}?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Verified {trade.name.toLowerCase()} attorneys on USAttorneys are available based on their schedules, including evenings and holidays.
          </p>
          <div className="flex flex-col items-center">
            <a
              href={PHONE_TEL}
              className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              <Phone className="w-6 h-6" />
              Call for assistance
            </a>
            <span className="text-sm text-white/60 mt-2">Attorney referral service</span>
          </div>
        </div>
      </section>

      <ExitIntentPopup
        sessionKey="sa:exit-emergency"
        title="Need urgent legal help?"
        description="A qualified attorney can respond quickly. Request a consultation now."
        ctaText="Request a consultation"
        ctaHref={`/quotes/${service}`}
      />
    </div>
  )
}
