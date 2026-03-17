import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBreadcrumbSchema, getHowToSchema, getSpeakableSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import { getServiceImage } from '@/lib/data/images'
import {
  practiceAreas as staticPracticeAreas,
  states,
  getStateBySlug,
} from '@/lib/data/usa'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { REVALIDATE } from '@/lib/cache'
import {
  generateGuideContent,
  isLegalGuidePASlug,
  getPANameBySlug,
  getLegalGuideSeedParams,
} from '@/lib/data/legal-guides'

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function truncateTitle(title: string, maxLen = 55): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '\u2026'
}

export const revalidate = REVALIDATE.staticPages
export const dynamicParams = true

// ---------------------------------------------------------------------------
// How-to guide type definitions (existing)
// ---------------------------------------------------------------------------

interface GuideType {
  slug: string
  title: string
  paSlug: string
  steps: { name: string; text: string }[]
}

const guideTypes: GuideType[] = [
  { slug: 'how-to-file-for-divorce', title: 'How to File for Divorce', paSlug: 'divorce', steps: [
    { name: 'Meet residency requirements', text: 'Most states require you to live in the state for a certain period (usually 6-12 months) before filing for divorce.' },
    { name: 'Gather financial documents', text: 'Collect tax returns, bank statements, pay stubs, property deeds and retirement account information.' },
    { name: 'File the petition', text: 'File a Petition for Dissolution of Marriage with your county courthouse. Pay the filing fee (typically $100-$400).' },
    { name: 'Serve your spouse', text: 'Your spouse must be officially notified via personal service, certified mail or acceptance of service.' },
    { name: 'Negotiate or litigate', text: 'Work toward a settlement agreement on property, custody and support. If no agreement, the court decides at trial.' },
  ] },
  { slug: 'how-to-file-a-personal-injury-claim', title: 'How to File a Personal Injury Claim', paSlug: 'personal-injury', steps: [
    { name: 'Document your injuries', text: 'Seek immediate medical attention and keep all records. Photograph injuries and the accident scene.' },
    { name: 'Gather evidence', text: 'Collect witness statements, police reports, medical records and photos of the scene and injuries.' },
    { name: 'Calculate damages', text: 'Add up medical bills, lost wages, property damage and estimate future costs and pain and suffering.' },
    { name: 'File an insurance claim', text: 'Notify the at-fault party\'s insurance company. Provide documentation but do not give a recorded statement without an attorney.' },
    { name: 'Hire an attorney if needed', text: 'If the claim is disputed or involves significant damages, a personal injury attorney can negotiate or file a lawsuit.' },
  ] },
  { slug: 'how-to-file-for-bankruptcy', title: 'How to File for Bankruptcy', paSlug: 'bankruptcy', steps: [
    { name: 'Complete credit counseling', text: 'Federal law requires credit counseling from an approved agency within 180 days before filing.' },
    { name: 'Determine which chapter', text: 'Chapter 7 liquidates assets to pay debts. Chapter 13 creates a repayment plan. Income determines eligibility.' },
    { name: 'Prepare your petition', text: 'List all debts, assets, income, expenses and recent financial transactions. This requires extensive documentation.' },
    { name: 'File with the court', text: 'File your petition with the bankruptcy court. Filing triggers an automatic stay stopping most collection actions.' },
    { name: 'Attend the 341 meeting', text: 'About 30 days after filing, attend a meeting of creditors where the trustee and creditors can ask questions.' },
  ] },
  { slug: 'how-to-fight-a-dui-charge', title: 'How to Fight a DUI Charge', paSlug: 'dui-dwi', steps: [
    { name: 'Request your police report', text: 'Obtain the full police report, dashcam/bodycam footage and breathalyzer maintenance records.' },
    { name: 'Hire a DUI attorney', text: 'DUI law is highly specialized. An experienced attorney knows state-specific defenses and plea strategies.' },
    { name: 'Challenge the traffic stop', text: 'If the officer lacked reasonable suspicion for the stop, all evidence may be suppressed.' },
    { name: 'Question the breathalyzer', text: 'Breathalyzer machines require regular calibration. Improper maintenance can invalidate results.' },
    { name: 'Attend your hearing', text: 'You may have both a criminal hearing and a DMV administrative hearing. Timelines are strict.' },
  ] },
  { slug: 'how-to-get-child-custody', title: 'How to Get Child Custody', paSlug: 'child-custody', steps: [
    { name: 'Understand custody types', text: 'Legal custody (decision-making) and physical custody (where the child lives) can be sole or joint.' },
    { name: 'Document your involvement', text: 'Keep records of your role in the child\'s life: school involvement, medical appointments, daily routines.' },
    { name: 'File a custody petition', text: 'File with the family court. You may need to attend mediation before a hearing.' },
    { name: 'Prepare for evaluation', text: 'Courts may order a custody evaluation by a psychologist or social worker who interviews both parents and the child.' },
    { name: 'Present your case', text: 'At the hearing, show why your custody plan serves the child\'s best interest. Courts consider stability, safety and parental fitness.' },
  ] },
  { slug: 'how-to-apply-for-asylum', title: 'How to Apply for Asylum', paSlug: 'asylum', steps: [
    { name: 'File within one year', text: 'You must apply within one year of arriving in the United States unless exceptions apply.' },
    { name: 'Complete Form I-589', text: 'Fill out the Application for Asylum and Withholding of Removal with detailed information about your persecution claim.' },
    { name: 'Gather supporting evidence', text: 'Collect country condition reports, witness declarations, medical records and any evidence of persecution.' },
    { name: 'Attend your interview', text: 'An asylum officer will interview you about your claim. Bring your attorney and interpreter if needed.' },
    { name: 'Await decision', text: 'If approved, you receive asylum status. If referred to immigration court, you can present your case to a judge.' },
  ] },
  { slug: 'how-to-create-a-will', title: 'How to Create a Will', paSlug: 'wills-trusts', steps: [
    { name: 'List your assets', text: 'Identify all property, accounts, investments, insurance policies and personal belongings you want to distribute.' },
    { name: 'Choose beneficiaries', text: 'Decide who inherits each asset. Name contingent beneficiaries in case primary ones predecease you.' },
    { name: 'Appoint an executor', text: 'Choose a trusted person to manage your estate, pay debts, and distribute assets according to your wishes.' },
    { name: 'Name guardians for minors', text: 'If you have minor children, designate a guardian to care for them if both parents pass away.' },
    { name: 'Sign with witnesses', text: 'Sign your will in the presence of witnesses (usually 2) as required by your state law. Consider notarization.' },
  ] },
  { slug: 'how-to-form-an-llc', title: 'How to Form an LLC', paSlug: 'business-law', steps: [
    { name: 'Choose a name', text: 'Pick a unique name that includes "LLC" or "Limited Liability Company" and is not already registered in your state.' },
    { name: 'File Articles of Organization', text: 'Submit formation documents to your state\'s Secretary of State office. Filing fees range from $50-$500.' },
    { name: 'Create an Operating Agreement', text: 'Draft an agreement outlining ownership, management structure, profit distribution and dissolution procedures.' },
    { name: 'Get an EIN', text: 'Apply for a free Employer Identification Number from the IRS. Required for tax filing and opening a business bank account.' },
    { name: 'Comply with state requirements', text: 'Register for state taxes, obtain necessary licenses and file annual reports as required by your state.' },
  ] },
  { slug: 'how-to-file-a-workers-comp-claim', title: 'How to File a Workers Comp Claim', paSlug: 'workers-compensation', steps: [
    { name: 'Report the injury immediately', text: 'Notify your employer in writing as soon as possible. Most states have strict deadlines (often 30-90 days).' },
    { name: 'Seek medical treatment', text: 'Get medical attention from an authorized provider. Your employer or their insurer may have a list of approved doctors.' },
    { name: 'File the claim form', text: 'Complete your state\'s workers compensation claim form and submit it to your employer and the workers comp board.' },
    { name: 'Follow up on your claim', text: 'The insurer has a deadline to accept or deny your claim. Keep records of all communications.' },
    { name: 'Appeal if denied', text: 'If denied, you can request a hearing before the workers compensation board. An attorney can help with appeals.' },
  ] },
  { slug: 'how-to-fight-an-eviction', title: 'How to Fight an Eviction', paSlug: 'landlord-tenant', steps: [
    { name: 'Read the notice carefully', text: 'Determine the type of eviction notice and the deadline to respond. Common types: pay or quit, cure or quit, unconditional quit.' },
    { name: 'Check for defects', text: 'Improper notice (wrong time period, missing information) can be grounds to dismiss the eviction.' },
    { name: 'File an answer with the court', text: 'Respond to the eviction complaint within the deadline. Raise all defenses including habitability issues.' },
    { name: 'Prepare your evidence', text: 'Gather rent receipts, photos, communication records and any evidence supporting your defense.' },
    { name: 'Attend your hearing', text: 'Present your case to the judge. You may be able to negotiate a settlement or move-out agreement.' },
  ] },
  { slug: 'how-to-get-a-green-card', title: 'How to Get a Green Card', paSlug: 'green-cards', steps: [
    { name: 'Determine eligibility', text: 'Green cards are available through family, employment, diversity lottery, refugee/asylum status and other categories.' },
    { name: 'File a petition', text: 'A sponsor (family member or employer) files a petition (I-130 or I-140) with USCIS on your behalf.' },
    { name: 'Wait for visa availability', text: 'Depending on category and country of origin, wait times range from immediate to 20+ years.' },
    { name: 'Adjust status or consular process', text: 'If in the US, file I-485 to adjust status. If abroad, attend an interview at a US consulate.' },
    { name: 'Attend biometrics and interview', text: 'Provide fingerprints, attend an interview, and await a decision on your application.' },
  ] },
  { slug: 'how-to-file-for-child-support', title: 'How to File for Child Support', paSlug: 'child-support', steps: [
    { name: 'Establish paternity if needed', text: 'If the parents are not married, paternity must be established through acknowledgment or court order.' },
    { name: 'File with your local court', text: 'Submit a petition for child support to the family court. You can also work through your state\'s child support enforcement agency.' },
    { name: 'Provide financial information', text: 'Both parents must disclose income, expenses and assets. State guidelines determine the support amount.' },
    { name: 'Attend the hearing', text: 'A judge reviews the financial information and issues a child support order based on state guidelines.' },
    { name: 'Enforce the order', text: 'If payments are not made, enforcement actions include wage garnishment, tax refund intercept and contempt of court.' },
  ] },
  { slug: 'how-to-negotiate-a-settlement', title: 'How to Negotiate a Settlement', paSlug: 'personal-injury', steps: [
    { name: 'Calculate your damages', text: 'Total all medical bills, lost wages, property damage, future expenses and pain and suffering.' },
    { name: 'Send a demand letter', text: 'Write a detailed letter to the insurance company or opposing party outlining your claim and settlement demand.' },
    { name: 'Review the counteroffer', text: 'The first offer is usually low. Analyze it against your damages and prepare a counter-response.' },
    { name: 'Negotiate strategically', text: 'Make concessions slowly, focus on documented damages, and be prepared to walk away if the offer is unfair.' },
    { name: 'Finalize the agreement', text: 'Once agreed, review the settlement agreement carefully before signing. Ensure it covers all claims and releases.' },
  ] },
  { slug: 'how-to-expunge-a-criminal-record', title: 'How to Expunge a Criminal Record', paSlug: 'criminal-defense', steps: [
    { name: 'Check eligibility', text: 'Expungement eligibility varies by state, offense type, time elapsed and criminal history. Not all offenses qualify.' },
    { name: 'Obtain your criminal record', text: 'Request your full criminal history from the state or FBI to identify all records that need expungement.' },
    { name: 'File the petition', text: 'Complete and file an expungement petition with the court that handled your case. Pay any filing fees.' },
    { name: 'Notify all parties', text: 'The prosecution and victims may need to be notified and given an opportunity to object.' },
    { name: 'Attend the hearing', text: 'A judge reviews your petition, considering rehabilitation, time elapsed and any objections before ruling.' },
  ] },
  { slug: 'how-to-apply-for-social-security-disability', title: 'How to Apply for SSDI', paSlug: 'social-security-disability', steps: [
    { name: 'Check eligibility requirements', text: 'You need sufficient work credits and a medical condition expected to last at least 12 months or result in death.' },
    { name: 'Gather medical evidence', text: 'Collect all medical records, doctor statements, test results and treatment history supporting your disability.' },
    { name: 'Complete the application', text: 'Apply online at ssa.gov, by phone or at your local SSA office. Include detailed work history and medical information.' },
    { name: 'Attend consultative exams', text: 'SSA may send you to their doctors for independent medical examinations.' },
    { name: 'Appeal if denied', text: 'Over 60% of initial applications are denied. File for reconsideration, then request a hearing before an ALJ.' },
  ] },
]

function getGuideType(slug: string): GuideType | null {
  return guideTypes.find(g => g.slug === slug) || null
}

// ---------------------------------------------------------------------------
// generateStaticParams — seed how-to + PA x State legal guides
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  // Existing how-to seed
  const howToSeeds = [{ type: guideTypes[0].slug, state: 'new-york' }]
  // PA x State seeds (top 10 x 10 = 100)
  const legalGuideSeeds = getLegalGuideSeedParams()
  return [...howToSeeds, ...legalGuideSeeds]
}

interface PageProps { params: Promise<{ type: string; state: string }> }

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type: typeSlug, state: stateSlug } = await params
  const state = getStateBySlug(stateSlug)
  if (!state) return { title: 'Not Found', robots: { index: false, follow: false } }

  // --- How-to guide path ---
  const guide = getGuideType(typeSlug)
  if (guide) {
    const seed = Math.abs(hashCode(`guide-${typeSlug}-${stateSlug}`))
    const year = new Date().getFullYear()

    const titles = [
      `${guide.title} in ${state.name} \u2014 ${year} Guide`,
      `${guide.title}: ${state.name} Step-by-Step (${year})`,
      `${state.name} Guide: ${guide.title}`,
      `${guide.title} in ${state.name} \u2014 Complete Guide`,
      `How-To: ${guide.title} in ${state.name} (${year})`,
    ]

    const descs = [
      `Step-by-step guide to ${guide.title.toLowerCase()} in ${state.name}. State-specific laws, timelines, costs and where to find legal help.`,
      `${guide.title} in ${state.name}: everything you need to know. ${guide.steps.length}-step process explained with ${state.name}-specific details.`,
      `Complete ${year} guide to ${guide.title.toLowerCase()} in ${state.name}. Requirements, costs, forms and attorney recommendations.`,
      `Learn ${guide.title.toLowerCase()} in ${state.name}. Expert step-by-step instructions with state-specific information.`,
      `${state.name} guide: ${guide.title.toLowerCase()}. Requirements, costs, timeline and how to find a qualified attorney.`,
    ]

    const title = truncateTitle(titles[seed % titles.length])
    const description = descs[seed % descs.length]

    return {
      title, description,
      robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
      openGraph: { title, description, type: 'article', locale: 'en_US', images: [{ url: getServiceImage(guide.paSlug).src, width: 1200, height: 630, alt: title }] },
      twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(guide.paSlug).src] },
      alternates: { canonical: `${SITE_URL}/guides/${typeSlug}/${stateSlug}` },
    }
  }

  // --- PA x State legal guide path ---
  const paName = getPANameBySlug(typeSlug)
  if (!paName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const year = new Date().getFullYear()
  const seed = Math.abs(hashCode(`legal-guide-${typeSlug}-${stateSlug}`))

  const titles = [
    `${paName} Law in ${state.name} \u2014 ${year} Guide`,
    `${state.name} ${paName} Attorney Guide (${year})`,
    `${paName} in ${state.name}: Costs, Laws & How to Find a Lawyer`,
    `Complete ${paName} Legal Guide for ${state.name}`,
    `Find a ${paName} Lawyer in ${state.name} \u2014 ${year}`,
  ]

  const descs = [
    `Everything you need to know about ${paName.toLowerCase()} law in ${state.name}. Find attorneys, understand costs, timelines, statute of limitations and your rights.`,
    `${year} guide to ${paName.toLowerCase()} in ${state.name}. Attorney fees, filing costs, statute of limitations, and how to find the right lawyer for your case.`,
    `${state.name} ${paName.toLowerCase()} guide: laws, costs, court fees, and top-rated attorneys. Free consultation available.`,
    `Navigate ${paName.toLowerCase()} legal issues in ${state.name}. Expert guide covering costs, deadlines, and how to choose the right attorney.`,
  ]

  const title = truncateTitle(titles[seed % titles.length], 60)
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'article', locale: 'en_US', images: [{ url: getServiceImage(typeSlug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(typeSlug).src] },
    alternates: { canonical: `${SITE_URL}/guides/${typeSlug}/${stateSlug}` },
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function GuidePage({ params }: PageProps) {
  const { type: typeSlug, state: stateSlug } = await params
  const state = getStateBySlug(stateSlug)
  if (!state) notFound()

  // --- How-to guide path ---
  const howToGuide = getGuideType(typeSlug)
  if (howToGuide) {
    return <HowToGuidePage guide={howToGuide} stateSlug={stateSlug} state={state} typeSlug={typeSlug} />
  }

  // --- PA x State legal guide path ---
  if (!isLegalGuidePASlug(typeSlug)) notFound()

  const paName = getPANameBySlug(typeSlug)!
  const guideContent = generateGuideContent(typeSlug, state.code, state.name, paName)
  const year = new Date().getFullYear()

  // JSON-LD: Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guideContent.title,
    description: `Complete guide to ${paName.toLowerCase()} law in ${state.name}. Costs, timelines, statute of limitations, and how to find an attorney.`,
    url: `${SITE_URL}/guides/${typeSlug}/${stateSlug}`,
    datePublished: `${year}-01-01`,
    dateModified: new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512x512.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/guides/${typeSlug}/${stateSlug}` },
    about: { '@type': 'Thing', name: `${paName} Law`, description: `${paName} legal services in ${state.name}` },
    inLanguage: 'en-US',
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: paName, url: `/practice-areas/${typeSlug}` },
    { name: state.name, url: `/guides/${typeSlug}/${stateSlug}` },
  ])

  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/guides/${typeSlug}/${stateSlug}`, title: guideContent.title })

  const schemas = [articleSchema, breadcrumbSchema, speakableSchema]

  // Related guides — other PAs in same state + same PA in other states
  const relatedPAs = staticPracticeAreas.filter(p => p.slug !== typeSlug).slice(0, 8)
  const otherStates = states.filter(s => s.slug !== stateSlug).slice(0, 12)

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: paName, href: `/practice-areas/${typeSlug}` }, { label: state.name }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold mb-3">
            <span>{year} Legal Guide</span>
            <span>&middot;</span>
            <span>{state.name}</span>
            <span>&middot;</span>
            <span>{guideContent.sections.length} Sections</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{guideContent.title}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            Your comprehensive guide to {paName.toLowerCase()} law in {state.name}. Find qualified attorneys, understand costs, know your rights, and navigate the legal process with confidence.
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">In This Guide</h2>
          <nav>
            <ul className="space-y-1">
              {guideContent.sections.map((section, idx) => (
                <li key={idx}>
                  <a href={`#section-${idx}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Guide Sections */}
      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {guideContent.sections.map((section, idx) => (
              <div key={idx} id={`section-${idx}`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.heading}</h2>
                <p className="text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-6 bg-blue-50 border-y border-blue-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-blue-800">
            <strong>Disclaimer:</strong> This guide provides general information about {paName.toLowerCase()} law in {state.name} and does not constitute legal advice. Laws and procedures may change. Consult a qualified attorney for advice specific to your situation.
          </p>
        </div>
      </section>

      {/* CTA: Find an Attorney */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Find a {paName} Attorney in {state.name}</h2>
          <p className="text-gray-600 mb-6">Connect with a verified, bar-licensed {paName.toLowerCase()} attorney in {state.name}. Compare profiles, read reviews, and request a free consultation.</p>
          <div className="flex flex-wrap gap-2">
            {state.cities.slice(0, 8).map(citySlug => {
              const cityName = citySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              return (
                <Link key={citySlug} href={`/practice-areas/${typeSlug}/${citySlug}`} className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 hover:bg-blue-100 transition-colors">
                  {paName} in {cityName}
                </Link>
              )
            })}
            <Link href={`/practice-areas/${typeSlug}`} className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 transition-colors">
              All {paName} Attorneys
            </Link>
          </div>
        </div>
      </section>

      {/* Sidebar: Same PA in other states */}
      <section className="py-10 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{paName} Law Guides in Other States</h2>
          <div className="flex flex-wrap gap-2">
            {otherStates.map(st => (
              <Link key={st.slug} href={`/guides/${typeSlug}/${st.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors">{st.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sidebar: Other PAs in same state */}
      <section className="py-10 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Legal Guides for {state.name}</h2>
          <div className="flex flex-wrap gap-2">
            {relatedPAs.map(pa => (
              <Link key={pa.slug} href={`/guides/${pa.slug}/${stateSlug}`} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm hover:border-blue-300 hover:text-blue-700 transition-colors">{pa.name}</Link>
            ))}
          </div>
        </div>
      </section>

      <CrossIntentLinks service={typeSlug} specialtyName={paName} currentIntent="services" />
    </>
  )
}

// ---------------------------------------------------------------------------
// How-to guide sub-component (existing behavior, extracted)
// ---------------------------------------------------------------------------

interface HowToGuideProps {
  guide: GuideType
  stateSlug: string
  state: { name: string; slug: string; code: string; cities: string[] }
  typeSlug: string
}

function HowToGuidePage({ guide, stateSlug, state, typeSlug }: HowToGuideProps) {
  const paData = staticPracticeAreas.find(p => p.slug === guide.paSlug)
  const paName = paData?.name || guide.title
  const year = new Date().getFullYear()

  const seed = Math.abs(hashCode(`guide-${typeSlug}-${stateSlug}`))

  const h1Variants = [
    `${guide.title} in ${state.name}`,
    `${guide.title} \u2014 ${state.name} ${year} Guide`,
    `${state.name}: ${guide.title}`,
    `Complete Guide: ${guide.title} in ${state.name}`,
    `${guide.title} in ${state.name} \u2014 Step by Step`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  const stateSteps = guide.steps.map(step => ({
    ...step,
    text: step.text.replace(/your state/gi, state.name).replace(/Most states/gi, state.name),
  }))

  const howToSchema = getHowToSchema(
    stateSteps.map(s => ({ name: s.name, text: s.text })),
    { name: `${guide.title} in ${state.name}`, description: `Step-by-step guide to ${guide.title.toLowerCase()} in ${state.name}.` }
  )

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: guide.title, url: `/guides/${typeSlug}` },
    { name: state.name, url: `/guides/${typeSlug}/${stateSlug}` },
  ])
  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/guides/${typeSlug}/${stateSlug}`, title: h1 })
  const schemas: Record<string, unknown>[] = [howToSchema, breadcrumbSchema, speakableSchema]

  const otherStates = states.filter(s => s.slug !== stateSlug).slice(0, 10)
  const otherGuides = guideTypes.filter(g => g.slug !== typeSlug).slice(0, 8)

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Guides', href: '/guides' }, { label: guide.title, href: `/guides/${typeSlug}` }, { label: state.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold mb-3">
            <span>{year} Guide</span>
            <span>&middot;</span>
            <span>{state.name}</span>
            <span>&middot;</span>
            <span>{guide.steps.length} Steps</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            This guide walks you through {guide.title.toLowerCase()} in {state.name}, covering state-specific requirements, costs and timelines. Each step includes practical advice and links to find qualified {paName.toLowerCase()} attorneys in {state.name}.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Step-by-Step Guide</h2>
          <div className="space-y-8">
            {stateSteps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">{idx + 1}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{step.name}</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-6 bg-emerald-50 border-y border-emerald-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-emerald-800">
            <strong>Disclaimer:</strong> This guide provides general information about {guide.title.toLowerCase()} in {state.name} and does not constitute legal advice. Laws and procedures may change. Consult a qualified attorney for advice specific to your situation.
          </p>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need a {paName} Attorney in {state.name}?</h2>
          <p className="text-gray-600 mb-6">Connect with a verified attorney who can guide you through the process.</p>
          <div className="flex flex-wrap gap-2">
            {state.cities.slice(0, 8).map(citySlug => {
              const cityName = citySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              return (
                <Link key={citySlug} href={`/practice-areas/${guide.paSlug}/${citySlug}`} className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 hover:bg-emerald-100 transition-colors">
                  {paName} in {cityName}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{guide.title} in Other States</h2>
          <div className="flex flex-wrap gap-2">
            {otherStates.map(st => (
              <Link key={st.slug} href={`/guides/${typeSlug}/${st.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-emerald-300 hover:text-emerald-700 transition-colors">{st.name}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Guides for {state.name}</h2>
          <div className="flex flex-wrap gap-2">
            {otherGuides.map(g => (
              <Link key={g.slug} href={`/guides/${g.slug}/${stateSlug}`} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm hover:border-emerald-300 hover:text-emerald-700 transition-colors">{g.title}</Link>
            ))}
          </div>
        </div>
      </section>

      <CrossIntentLinks service={guide.paSlug} specialtyName={paName} currentIntent="services" />
    </>
  )
}
