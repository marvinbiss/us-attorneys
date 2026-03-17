import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSpecialtyBySlug } from '@/lib/supabase'
import { getBreadcrumbSchema, getFAQSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import { getServiceImage } from '@/lib/data/images'
import {
  practiceAreas as staticPracticeAreas,
  states,
  getStateBySlug,
} from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getNaturalTerm } from '@/lib/seo/natural-terms'
import type { Service } from '@/types'
import { REVALIDATE } from '@/lib/cache'

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function truncateTitle(title: string, maxLen = 55): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// Pre-render: top 20 PAs × all 51 states = 1 020 pages
const TOP_PA = 20
export function generateStaticParams() {
  const topPAs = staticPracticeAreas.slice(0, TOP_PA)
  return topPAs.flatMap(pa =>
    states.map(st => ({ specialty: pa.slug, state: st.slug }))
  )
}

// ---------------------------------------------------------------------------
// State-specific FAQ generator — 3 questions per PA per state
// ---------------------------------------------------------------------------

function generateStateFAQ(paName: string, paSlug: string, stateName: string, stateCode: string): { question: string; answer: string }[] {
  const svcLower = paName.toLowerCase()
  const seed = Math.abs(hashCode(`faq-${paSlug}-${stateCode}`))

  // Pool of question templates (we pick 3 deterministically)
  const pool = [
    { q: `What is the statute of limitations for ${svcLower} cases in ${stateName}?`, a: `The statute of limitations for ${svcLower} cases in ${stateName} varies by case type. Personal injury claims are generally 2-3 years, but contract disputes and property damage may differ. Consult a ${stateName} attorney for your specific situation, as missing the deadline can permanently bar your claim.` },
    { q: `How much does a ${svcLower} attorney cost in ${stateName}?`, a: `${paName} attorney fees in ${stateName} vary based on case complexity, attorney experience and fee structure. Contingency fees (common for injury cases) typically range from 25-40%. Hourly rates in ${stateName} range from $150-$500+. Many attorneys offer free initial consultations.` },
    { q: `Do I need a ${svcLower} lawyer in ${stateName} or can I represent myself?`, a: `While you have the right to self-representation in ${stateName}, ${svcLower} cases often involve complex ${stateName} statutes, court procedures and negotiation with opposing counsel. An experienced attorney can significantly improve your outcome and protect your rights under ${stateName} law.` },
    { q: `What should I look for when hiring a ${svcLower} attorney in ${stateName}?`, a: `Look for an attorney licensed by the ${stateName} State Bar, with specific experience in ${svcLower} cases. Check their track record, client reviews, disciplinary history and fee structure. Most importantly, choose someone who communicates clearly and makes you feel comfortable.` },
    { q: `How long does a ${svcLower} case take in ${stateName}?`, a: `${paName} case timelines in ${stateName} vary widely. Simple matters may resolve in weeks, while complex litigation can take 1-3 years. Factors include court caseload in ${stateName}, case complexity, whether settlement is possible and whether trial is necessary.` },
    { q: `Can I file a ${svcLower} claim in ${stateName} if I live in another state?`, a: `Yes, jurisdiction in ${stateName} is based on where the incident occurred or where the defendant is located, not where you live. A ${stateName} attorney can advise on proper venue and jurisdiction for your ${svcLower} case.` },
    { q: `What are my rights in a ${svcLower} case under ${stateName} law?`, a: `${stateName} law provides specific protections for ${svcLower} cases. You have the right to legal representation, the right to file a claim within the statute of limitations, and the right to seek compensation for damages. ${stateName} may have unique rules — consult a local attorney for specifics.` },
    { q: `Is there free ${svcLower} legal help available in ${stateName}?`, a: `Yes, ${stateName} has legal aid organizations, pro bono programs through the state bar association, and law school clinics that provide free or low-cost ${svcLower} help to qualifying individuals. Many private attorneys also offer free initial consultations.` },
    { q: `What happens if I can't afford a ${svcLower} attorney in ${stateName}?`, a: `If you cannot afford an attorney in ${stateName}, explore contingency fee arrangements (no fee unless you win), legal aid societies, the ${stateName} Bar pro bono program, law school clinics, and attorneys offering sliding-scale fees or payment plans.` },
  ]

  // Pick 3 questions deterministically
  const selected = []
  const used = new Set<number>()
  for (let i = 0; i < 3; i++) {
    let idx = (seed + i * 7) % pool.length
    while (used.has(idx)) idx = (idx + 1) % pool.length
    used.add(idx)
    selected.push(pool[idx])
  }
  return selected.map(item => ({ question: item.q, answer: item.a }))
}

interface PageProps { params: Promise<{ specialty: string; state: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty: slug, state: stateSlug } = await params

  const state = getStateBySlug(stateSlug)
  if (!state) return { title: 'Not Found', robots: { index: false, follow: false } }

  let specialtyName = ''
  try { const svc = await getSpecialtyBySlug(slug); if (svc) specialtyName = svc.name }
  catch { /* fallback below */ }
  if (!specialtyName) { const s = staticPracticeAreas.find(p => p.slug === slug); if (s) specialtyName = s.name }
  if (!specialtyName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const seed = Math.abs(hashCode(`lq-${slug}-${stateSlug}`))
  const svcLower = specialtyName.toLowerCase()

  const titles = [
    `${specialtyName} FAQ — ${state.name} Laws & Legal Questions`,
    `${specialtyName} Legal Questions in ${state.name}`,
    `${state.name} ${specialtyName} FAQ — Know Your Rights`,
    `Common ${specialtyName} Questions — ${state.name} Law`,
    `${specialtyName} in ${state.name}: Frequently Asked Questions`,
  ]

  const descs = [
    `Answers to common ${svcLower} legal questions in ${state.name}. State-specific laws, statutes of limitations, costs and rights explained.`,
    `${specialtyName} FAQ for ${state.name}. Understand your legal rights, find attorneys and learn about ${state.name}-specific laws.`,
    `Frequently asked ${svcLower} questions in ${state.name}. Expert answers on costs, timelines, rights and finding an attorney.`,
    `${state.name} ${svcLower} legal questions answered. Statutes, costs, free consultation options and attorney recommendations.`,
    `Got ${svcLower} questions in ${state.name}? Read our FAQ covering state laws, attorney costs and your legal rights.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(slug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(slug).src] },
    alternates: { canonical: `${SITE_URL}/legal-questions/${slug}/${stateSlug}` },
  }
}

export default async function LegalQuestionsPage({ params }: PageProps) {
  const { specialty: slug, state: stateSlug } = await params

  const state = getStateBySlug(stateSlug)
  if (!state) notFound()

  let service: Service
  try { service = await getSpecialtyBySlug(slug); if (!service) { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } } }
  catch { const s = staticPracticeAreas.find(p => p.slug === slug); if (!s) notFound(); service = { id: '', name: s.name, slug: s.slug, is_active: true, created_at: '' } }

  const seed = Math.abs(hashCode(`lq-${slug}-${stateSlug}`))
  const svcLower = service.name.toLowerCase()
  const naturalTerm = getNaturalTerm(slug)

  const h1Variants = [
    `${service.name} Legal Questions in ${state.name}`,
    `${state.name} ${service.name} FAQ`,
    `Frequently Asked ${service.name} Questions — ${state.name}`,
    `${service.name} in ${state.name}: Your Questions Answered`,
    `${state.name} ${naturalTerm.singular} FAQ & Legal Guide`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const faqs = generateStateFAQ(service.name, slug, state.name, state.code)

  const faqSchema = getFAQSchema(faqs)
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Legal Questions', url: '/legal-questions' },
    { name: service.name, url: `/legal-questions/${slug}` },
    { name: state.name, url: `/legal-questions/${slug}/${stateSlug}` },
  ])
  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/legal-questions/${slug}/${stateSlug}`, title: h1 })
  const schemas: Record<string, unknown>[] = [breadcrumbSchema, speakableSchema, ...(faqSchema ? [faqSchema] : [])]

  // Other states
  const otherStates = states.filter(s => s.slug !== stateSlug).slice(0, 10)
  // Other practice areas in this state
  const otherPAs = staticPracticeAreas.filter(p => p.slug !== slug).slice(0, 8)

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Legal Questions', href: '/legal-questions' }, { label: service.name, href: `/legal-questions/${slug}` }, { label: state.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            Understanding {svcLower} law in {state.name} is the first step toward protecting your rights. Below are answers to the most common legal questions, including state-specific statutes, costs and your options.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                <h3 className="bg-gray-50 px-6 py-4 font-semibold text-gray-900 text-lg">{faq.question}</h3>
                <div className="px-6 py-4 text-gray-600 leading-relaxed">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-6 bg-amber-50 border-y border-amber-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> This information is for general educational purposes only and does not constitute legal advice. Laws in {state.name} may change. For advice specific to your situation, consult a qualified {svcLower} attorney licensed in {state.name}.
          </p>
        </div>
      </section>

      {/* Find an Attorney */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Find a {service.name} Attorney in {state.name}</h2>
          <p className="text-gray-600 mb-6">Connect with a verified {svcLower} attorney in {state.name} for personalized legal advice.</p>
          <div className="flex flex-wrap gap-2">
            {state.cities.slice(0, 8).map(citySlug => {
              const cityName = citySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              return (
                <Link key={citySlug} href={`/practice-areas/${slug}/${citySlug}`} className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 hover:bg-blue-100 transition-colors">
                  {cityName}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Other PAs in this state */}
      <section className="py-10 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Legal Questions in {state.name}</h2>
          <div className="flex flex-wrap gap-2">
            {otherPAs.map(pa => (
              <Link key={pa.slug} href={`/legal-questions/${pa.slug}/${stateSlug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-amber-300 hover:text-amber-700 transition-colors">{pa.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Other states */}
      <section className="py-10 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{service.name} FAQ in Other States</h2>
          <div className="flex flex-wrap gap-2">
            {otherStates.map(st => (
              <Link key={st.slug} href={`/legal-questions/${slug}/${st.slug}`} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm hover:border-amber-300 hover:text-amber-700 transition-colors">{st.name}</Link>
            ))}
          </div>
        </div>
      </section>

      <CrossIntentLinks service={slug} specialtyName={service.name} currentIntent="services" />
    </>
  )
}
