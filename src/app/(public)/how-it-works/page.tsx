import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Search, CheckCircle, ArrowRight, Shield, Star, FileText, Phone, MapPin, ChevronDown } from 'lucide-react'
import { pageImages, BLUR_PLACEHOLDER } from '@/lib/data/images'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
import JsonLd from '@/components/JsonLd'
import { getHowToSchema, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const metadata: Metadata = {
  title: 'How It Works — Find an Attorney',
  description: 'Search, compare, and contact an attorney in 3 easy steps. Thousands of professionals listed across all 50 states. 100% free, no sign-up required.',
  alternates: {
    canonical: `${SITE_URL}/how-it-works`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'How It Works — Find an Attorney',
    description: 'Search, compare, and contact an attorney in 3 easy steps. 100% free, no sign-up required.',
    url: `${SITE_URL}/how-it-works`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'US Attorneys — How It Works' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How It Works — Find an Attorney',
    description: 'Search, compare, and contact an attorney in 3 easy steps. 100% free.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 86400

const steps = [
  {
    number: '1',
    icon: Search,
    title: 'Search',
    description: 'Find the right professional in seconds using our attorney directory. Search by practice area and location across all 50 states.',
    details: [
      'Thousands of attorneys listed nationwide',
      'Search by specialty: personal injury, family law, criminal defense...',
      'Filter by city and state',
      'Instant and up-to-date results',
    ],
    gradient: 'from-blue-500 to-blue-700',
  },
  {
    number: '2',
    icon: CheckCircle,
    title: 'Compare',
    description: 'Review detailed attorney profiles with official data. Compare professionals transparently using public bar records and verified credentials.',
    details: [
      'Profiles verified with bar number',
      'Data sourced from state bar associations',
      'Certifications and qualifications displayed',
      'Firm information (establishment date, status)',
    ],
    gradient: 'from-emerald-500 to-emerald-700',
  },
  {
    number: '3',
    icon: Phone,
    title: 'Contact',
    description: 'Reach out directly to attorneys you are interested in. Request consultations, call them, or access their full contact details with no middleman.',
    details: [
      'Direct contact with no intermediary',
      'Free online consultation request',
      'Official contact details and credentials',
      'No commission, no hidden fees',
    ],
    gradient: 'from-purple-500 to-purple-700',
  },
]

const trustReasons = [
  {
    icon: Shield,
    title: 'Official bar records',
    description: 'Every attorney is referenced via official state bar association records. Bar number, active status, admission date: reliable and up-to-date data.',
  },
  {
    icon: MapPin,
    title: 'Thousands of attorneys in all 50 states',
    description: 'A directory of attorneys referenced via official bar records. Find a professional near you, anywhere in the United States.',
  },
  {
    icon: Star,
    title: '100% free, no sign-up required',
    description: 'Access all information without creating an account. No hidden fees, no subscription, no commission on legal services.',
  },
  {
    icon: FileText,
    title: 'Verifiable official data',
    description: 'We display only verifiable data sourced from official state bar association records and public court records.',
  },
]

const faqs = [
  {
    question: 'Is US Attorneys really free?',
    answer: 'Yes, US Attorneys is 100% free for individuals. You can search for attorneys, view their profiles, and contact them at no cost and with no sign-up required. We do not charge any commission on legal services.',
  },
  {
    question: 'Where does the attorney data come from?',
    answer: 'The data comes from official state bar association records, which are the authoritative databases maintained by each state to track licensed attorneys. Each attorney is identified by their bar number, ensuring the reliability of the information.',
  },
  {
    question: 'How do I know if an attorney is still practicing?',
    answer: 'Bar records include the active status of each attorney. We display only attorneys whose status is active. Information is regularly updated using official bar association data.',
  },
  {
    question: 'Can I request a consultation directly on the site?',
    answer: 'Yes, you can fill out our free consultation request form. Your request will be sent to attorneys matching your needs and location. You will receive detailed responses with no obligation.',
  },
  {
    question: 'What makes US Attorneys different from other directories?',
    answer: 'US Attorneys stands out through the use of official bar association data, the absence of fake reviews, complete free access with no sign-up, and coverage of all 50 states plus DC.',
  },
  {
    question: 'How are the listed attorneys selected?',
    answer: 'We do not make subjective selections. All attorneys on US Attorneys are licensed professionals registered with their state bar association. Transparency is our priority.',
  },
]

export default async function HowItWorksPage() {
  const cmsPage = await getPageContent('comment-ca-marche', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'How It Works', url: '/how-it-works' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'How It Works' }]} className="mb-4" />
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

  const howToSchema = getHowToSchema([
    { name: 'Search', text: 'Find the right professional in our attorney directory. Search by practice area and location across all 50 states.' },
    { name: 'Compare', text: 'Review detailed profiles with official bar records. Compare professionals transparently using verified credentials.' },
    { name: 'Contact', text: 'Reach out directly to attorneys. Request consultations, call them, or access their full contact details with no middleman.' },
  ])

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'How It Works', url: '/how-it-works' },
  ])

  const faqSchema = getFAQSchema(faqs)

  return (
    <>
      <JsonLd data={[howToSchema, breadcrumbSchema, faqSchema]} />
    <div className="min-h-screen bg-gray-50">
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
          {/* Breadcrumb */}
          <Breadcrumb
            items={[{ label: 'How It Works' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
              Find a verified attorney in 3 steps
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
              Search, compare, and contact attorneys verified through official bar records.
              100% free, no sign-up required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Search className="w-5 h-5" />
                Browse practice areas
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium px-6 py-3 transition-colors"
              >
                <FileText className="w-5 h-5" />
                Request a free consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to find an attorney on US Attorneys?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple and transparent process to connect with the best professionals in your area
            </p>
          </div>

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 1
              return (
                <div
                  key={step.number}
                  className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}
                >
                  {/* Image/Icon */}
                  <div className="flex-1 w-full">
                    <div className={`relative bg-gradient-to-br ${step.gradient} rounded-2xl p-12 text-white text-center overflow-hidden`}>
                      {pageImages.howItWorks[index] && (
                        <>
                          <Image
                            src={pageImages.howItWorks[index].src}
                            alt={pageImages.howItWorks[index].alt}
                            fill
                            className="object-cover opacity-30"
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            placeholder="blur"
                            blurDataURL={BLUR_PLACEHOLDER}
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
                        </>
                      )}
                      <div className="relative z-10">
                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Icon className="w-12 h-12" />
                        </div>
                        <div className="text-6xl font-bold opacity-50">
                          {step.number}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
                        {step.number}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-lg text-gray-600 mb-6">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why trust us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why trust us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              US Attorneys relies on official state bar records to provide you with reliable and accurate information
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustReasons.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              )
            })}
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">50</div>
              <div className="text-blue-200 text-sm mt-1">States covered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">DC</div>
              <div className="text-blue-200 text-sm mt-1">Plus territories</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">100%</div>
              <div className="text-blue-200 text-sm mt-1">Free</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">0</div>
              <div className="text-blue-200 text-sm mt-1">Fake reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about US Attorneys
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="bg-white rounded-xl border border-gray-200 group"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contextual Links */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Learn more
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/services"
              className="bg-gray-50 p-6 rounded-xl hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">All practice areas</h3>
              <p className="text-gray-600 text-sm mb-3">
                Browse all attorney practice areas available on US Attorneys.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                View practice areas <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/quotes"
              className="bg-gray-50 p-6 rounded-xl hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Request a consultation</h3>
              <p className="text-gray-600 text-sm mb-3">
                Receive free, no-obligation consultation offers from verified attorneys.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                Request a consultation <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/pricing"
              className="bg-gray-50 p-6 rounded-xl hover:bg-blue-50 transition-colors border border-gray-200"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Fee guide</h3>
              <p className="text-gray-600 text-sm mb-3">
                Check average fees by practice area to estimate your legal budget.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                View fees <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to find your attorney?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Thousands of verified attorneys are waiting for you on US Attorneys
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Find an attorney
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/quotes"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-400 transition-colors text-lg border border-blue-400"
            >
              Request a free consultation
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related Links Section */}
      <section className="bg-gray-50 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Find an attorney near you
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <PopularServicesLinks />
            <PopularCitiesLinks />
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
