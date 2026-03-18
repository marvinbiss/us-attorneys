import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSpecialtyBySlug,
  getLocationBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema, getHowToSchema, getSpeakableSchema, getItemListSchema } from '@/lib/seo/jsonld'
import Breadcrumb from '@/components/Breadcrumb'
import CrossIntentLinks from '@/components/seo/CrossIntentLinks'
import { getAttorneyUrl } from '@/lib/utils'
import { getServiceImage } from '@/lib/data/images'
import {
  practiceAreas as staticPracticeAreas,
  getCityBySlug,
  getNearbyCities,
  getCitiesByState,
  getStateByCode,
} from '@/lib/data/usa'
import { isZipSlug, getNearbyZipCodes } from '@/lib/location-resolver'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import type { Service, Location as LocationType, Provider } from '@/types'
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

// ---------------------------------------------------------------------------
// Situation definitions — top 50 situations mapped to practice areas
// ---------------------------------------------------------------------------

const situations = [
  { slug: 'rear-end-collision', name: 'Rear End Collision', paSlug: 'car-accidents', description: 'Injured in a rear-end collision? Learn your rights and find an attorney.' },
  { slug: 'hit-and-run', name: 'Hit and Run', paSlug: 'car-accidents', description: 'Victim of a hit-and-run accident? Get legal help now.' },
  { slug: 'drunk-driver-accident', name: 'Drunk Driver Accident', paSlug: 'car-accidents', description: 'Hit by a drunk driver? You may be entitled to punitive damages.' },
  { slug: 'pedestrian-accident', name: 'Pedestrian Accident', paSlug: 'personal-injury', description: 'Struck as a pedestrian? Drivers owe a duty of care.' },
  { slug: 'bicycle-accident', name: 'Bicycle Accident', paSlug: 'personal-injury', description: 'Injured while cycling? Get compensation for your injuries.' },
  { slug: 'uber-lyft-accident', name: 'Uber/Lyft Accident', paSlug: 'car-accidents', description: 'Injured in a rideshare accident? Insurance coverage can be complex.' },
  { slug: 'uninsured-motorist', name: 'Uninsured Motorist', paSlug: 'car-accidents', description: 'Hit by an uninsured driver? You still have options.' },
  { slug: 'whiplash-injury', name: 'Whiplash Injury', paSlug: 'personal-injury', description: 'Suffering whiplash after an accident? Document and protect your claim.' },
  { slug: 'workplace-injury', name: 'Workplace Injury', paSlug: 'workers-compensation', description: 'Hurt on the job? Workers comp may cover your medical bills and lost wages.' },
  { slug: 'construction-accident', name: 'Construction Accident', paSlug: 'workers-compensation', description: 'Injured on a construction site? Multiple parties may be liable.' },
  { slug: 'dog-bite', name: 'Dog Bite', paSlug: 'personal-injury', description: 'Bitten by a dog? Most states hold owners strictly liable.' },
  { slug: 'medical-misdiagnosis', name: 'Medical Misdiagnosis', paSlug: 'medical-malpractice', description: 'Misdiagnosed by a doctor? This can constitute medical malpractice.' },
  { slug: 'surgical-error', name: 'Surgical Error', paSlug: 'medical-malpractice', description: 'Suffered from a surgical mistake? Explore your legal options.' },
  { slug: 'birth-injury', name: 'Birth Injury', paSlug: 'medical-malpractice', description: 'Child injured during birth? Hospital negligence claims may apply.' },
  { slug: 'nursing-home-neglect', name: 'Nursing Home Neglect', paSlug: 'nursing-home-abuse', description: 'Is a loved one being neglected in a facility? Take action now.' },
  { slug: 'wrongful-termination-retaliation', name: 'Wrongful Termination Retaliation', paSlug: 'wrongful-termination', description: 'Fired for whistleblowing or filing a complaint? That may be illegal.' },
  { slug: 'workplace-harassment', name: 'Workplace Harassment', paSlug: 'sexual-harassment', description: 'Experiencing harassment at work? You have legal protections.' },
  { slug: 'discrimination-at-work', name: 'Discrimination at Work', paSlug: 'workplace-discrimination', description: 'Facing workplace discrimination? Federal and state laws protect you.' },
  { slug: 'unpaid-wages', name: 'Unpaid Wages', paSlug: 'wage-hour-claims', description: 'Not getting paid what you are owed? You can recover unpaid wages.' },
  { slug: 'dui-first-offense', name: 'DUI First Offense', paSlug: 'dui-dwi', description: 'Charged with a first DUI? Consequences vary by state.' },
  { slug: 'arrested-for-assault', name: 'Arrested for Assault', paSlug: 'criminal-defense', description: 'Facing assault charges? A criminal defense attorney can help.' },
  { slug: 'drug-possession-charge', name: 'Drug Possession Charge', paSlug: 'drug-crimes', description: 'Charged with possession? Penalties depend on substance and amount.' },
  { slug: 'domestic-violence-accusation', name: 'Domestic Violence Accusation', paSlug: 'domestic-violence', description: 'Accused of domestic violence? Get legal representation immediately.' },
  { slug: 'filing-for-divorce', name: 'Filing for Divorce', paSlug: 'divorce', description: 'Ready to file for divorce? Understand the process and your rights.' },
  { slug: 'custody-dispute', name: 'Custody Dispute', paSlug: 'child-custody', description: 'Fighting for custody? Courts prioritize the best interest of the child.' },
  { slug: 'child-support-modification', name: 'Child Support Modification', paSlug: 'child-support', description: 'Need to modify child support? Changed circumstances may qualify.' },
  { slug: 'eviction-notice', name: 'Eviction Notice', paSlug: 'landlord-tenant', description: 'Received an eviction notice? Know your rights as a tenant.' },
  { slug: 'foreclosure-notice', name: 'Foreclosure Notice', paSlug: 'foreclosure', description: 'Facing foreclosure? There may be options to save your home.' },
  { slug: 'denied-insurance-claim', name: 'Denied Insurance Claim', paSlug: 'insurance-law', description: 'Insurance claim denied? Bad faith practices may give you grounds to sue.' },
  { slug: 'green-card-denied', name: 'Green Card Denied', paSlug: 'green-cards', description: 'Green card application denied? An immigration attorney can help appeal.' },
  { slug: 'deportation-order', name: 'Deportation Order', paSlug: 'deportation-defense', description: 'Facing deportation? Time-sensitive legal options may be available.' },
  { slug: 'will-contest', name: 'Will Contest', paSlug: 'wills-trusts', description: 'Disputing a will? Undue influence or incapacity claims require proof.' },
  { slug: 'business-partnership-dispute', name: 'Business Partnership Dispute', paSlug: 'business-litigation', description: 'Partner dispute? Legal intervention may be needed to protect your interests.' },
  { slug: 'contract-breach', name: 'Contract Breach', paSlug: 'contract-law', description: 'Other party broke the contract? You may be entitled to damages.' },
  { slug: 'slip-in-store', name: 'Slip in Store', paSlug: 'slip-and-fall', description: 'Slipped and fell in a store? The property owner may be liable.' },
  { slug: 'defective-product-injury', name: 'Defective Product Injury', paSlug: 'product-liability', description: 'Injured by a defective product? Manufacturers can be held strictly liable.' },
  { slug: 'social-security-denied', name: 'Social Security Denied', paSlug: 'social-security-disability', description: 'SSDI claim denied? Most initial applications are denied — appeal with an attorney.' },
  { slug: 'irs-audit', name: 'IRS Audit', paSlug: 'irs-disputes', description: 'Being audited by the IRS? A tax attorney can protect your rights.' },
  { slug: 'trademark-infringement', name: 'Trademark Infringement', paSlug: 'trademark', description: 'Someone using your trademark? Act quickly to protect your brand.' },
  { slug: 'patent-infringement', name: 'Patent Infringement', paSlug: 'patent', description: 'Patent being infringed? Enforce your intellectual property rights.' },
  { slug: 'filing-bankruptcy', name: 'Filing Bankruptcy', paSlug: 'bankruptcy', description: 'Considering bankruptcy? Chapter 7 and 13 offer different paths to debt relief.' },
  { slug: 'wage-garnishment', name: 'Wage Garnishment', paSlug: 'debt-relief', description: 'Wages being garnished? Legal options may reduce or stop garnishments.' },
  { slug: 'false-arrest', name: 'False Arrest', paSlug: 'civil-rights', description: 'Wrongfully arrested? You may have a civil rights claim.' },
  { slug: 'police-brutality', name: 'Police Brutality', paSlug: 'civil-rights', description: 'Victim of police brutality? File a complaint and explore legal action.' },
  { slug: '18-wheeler-accident', name: '18-Wheeler Accident', paSlug: 'truck-accidents', description: 'Involved in a truck accident? Multiple parties may share liability.' },
  { slug: 'motorcycle-crash', name: 'Motorcycle Crash', paSlug: 'motorcycle-accidents', description: 'Injured in a motorcycle crash? Bikers often face biased investigations.' },
  { slug: 'elder-financial-abuse', name: 'Elder Financial Abuse', paSlug: 'elder-law', description: 'Elderly family member being financially exploited? Legal remedies exist.' },
  { slug: 'asylum-application', name: 'Asylum Application', paSlug: 'asylum', description: 'Seeking asylum in the US? An immigration attorney can guide the process.' },
  { slug: 'class-action-lawsuit', name: 'Class Action Lawsuit', paSlug: 'class-action', description: 'Part of a class action? Understand your rights and potential compensation.' },
  { slug: 'federal-investigation', name: 'Federal Investigation', paSlug: 'federal-crimes', description: 'Under federal investigation? Get an attorney before speaking to agents.' },
]

function getSituation(slug: string) {
  return situations.find(s => s.slug === slug) || null
}

// Pre-render: 1 seed page only, ISR 24h handles the rest
export function generateStaticParams() {
  return [{ situation: 'car-accident', location: 'new-york' }]
}

function cityToLocation(slug: string): LocationType | null {
  const c = getCityBySlug(slug)
  if (!c) return null
  return { id: '', name: c.name, slug: c.slug, postal_code: c.zipCode, region_name: getStateByCode(c.stateCode)?.region || '', department_name: c.stateName, department_code: c.stateCode, is_active: true, created_at: '' }
}

interface PageProps { params: Promise<{ situation: string; location: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { situation: sitSlug, location: locSlug } = await params

  const sit = getSituation(sitSlug)
  if (!sit) return { title: 'Not Found', robots: { index: false, follow: false } }

  let locationName = '', deptCode = '', count = 1
  try {
    const [loc, cnt] = await Promise.all([
      getLocationBySlug(locSlug) as Promise<LocationType | null>,
      getAttorneyCountByServiceAndLocation(sit.paSlug, locSlug),
    ])
    if (loc) { locationName = loc.name; deptCode = loc.department_code || '' }
    count = cnt
  } catch {
    const c = getCityBySlug(locSlug)
    if (c) { locationName = c.name; deptCode = c.stateCode }
  }

  if (!locationName) return { title: 'Not Found', robots: { index: false, follow: false } }

  const seed = Math.abs(hashCode(`sit-${sitSlug}-${locSlug}`))
  const paName = staticPracticeAreas.find(p => p.slug === sit.paSlug)?.name || sit.name

  const titles = [
    `${sit.name} Attorney in ${locationName} — Get Help Now`,
    `${sit.name} Lawyer in ${locationName}${deptCode ? ` (${deptCode})` : ''}`,
    `${locationName} ${sit.name} — Legal Help Available`,
    `Need a ${sit.name} Attorney? ${locationName}`,
    `${sit.name} in ${locationName} — Find an Attorney`,
  ]

  const descs = [
    `${sit.description} Find a qualified ${paName.toLowerCase()} attorney in ${locationName}. ${count} verified attorneys available.`,
    `Dealing with a ${sit.name.toLowerCase()} in ${locationName}? ${count} attorneys ready to help. Free consultation.`,
    `${sit.name} legal help in ${locationName}${deptCode ? ` (${deptCode})` : ''}. Know your rights and find qualified legal representation.`,
    `Experienced ${sit.name.toLowerCase()} attorneys in ${locationName}. Understand your options and protect your rights.`,
    `${sit.description} Connect with a ${paName.toLowerCase()} attorney in ${locationName} today.`,
  ]

  const title = truncateTitle(titles[seed % titles.length])
  const description = descs[seed % descs.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'en_US', images: [{ url: getServiceImage(sit.paSlug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(sit.paSlug).src] },
    alternates: { canonical: `${SITE_URL}/situations/${sitSlug}/${locSlug}` },
  }
}

export default async function SituationPage({ params }: PageProps) {
  const { situation: sitSlug, location: locSlug } = await params

  const sit = getSituation(sitSlug)
  if (!sit) notFound()

  const paData = staticPracticeAreas.find(p => p.slug === sit.paSlug)
  const paName = paData?.name || sit.name

  let service: Service
  try { service = await getSpecialtyBySlug(sit.paSlug); if (!service) service = { id: '', name: paName, slug: sit.paSlug, is_active: true, created_at: '' } }
  catch { service = { id: '', name: paName, slug: sit.paSlug, is_active: true, created_at: '' } }

  let location: LocationType
  try { const db = await getLocationBySlug(locSlug); if (!db) { const f = cityToLocation(locSlug); if (!f) notFound(); location = f } else location = { ...db, id: (db as Record<string, unknown>).code_insee as string || '' } }
  catch { const f = cityToLocation(locSlug); if (!f) notFound(); location = f }

  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(sit.paSlug, locSlug),
    getAttorneyCountByServiceAndLocation(sit.paSlug, locSlug).catch(() => 0),
  ])

  const seed = Math.abs(hashCode(`sit-${sitSlug}-${locSlug}`))

  const h1Variants = [
    `Injured in a ${sit.name} in ${location.name}?`,
    `${sit.name} in ${location.name} — Know Your Rights`,
    `Dealing With a ${sit.name}? Find an Attorney in ${location.name}`,
    `${sit.name} Legal Help in ${location.name}${location.department_code ? `, ${location.department_code}` : ''}`,
    `${location.name} ${sit.name} — Get Legal Advice Now`,
  ]
  const h1 = h1Variants[seed % h1Variants.length]

  // HowTo JSON-LD
  const howToSchema = getHowToSchema(
    [
      { name: 'Ensure Safety & Document Everything', text: `If you are involved in a ${sit.name.toLowerCase()}, prioritize safety. Take photos, get witness information and save all records.` },
      { name: 'Seek Medical Attention', text: 'Get medical attention even if injuries seem minor. Medical records are critical evidence for your case.' },
      { name: 'Contact an Attorney', text: `Consult a ${paName.toLowerCase()} attorney in ${location.name}. Many offer free initial consultations.` },
      { name: 'File a Claim', text: 'Your attorney will help you file the appropriate claim, negotiate with insurance companies or pursue litigation if needed.' },
    ],
    { name: `What to Do After a ${sit.name} in ${location.name}`, description: `Step-by-step guide for handling a ${sit.name.toLowerCase()} in ${location.name}.` }
  )

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Situations', url: '/situations' },
    { name: sit.name, url: `/situations/${sitSlug}` },
    { name: location.name, url: `/situations/${sitSlug}/${locSlug}` },
  ])

  const itemListSchema = providers.length > 0
    ? getItemListSchema({ name: `${sit.name} Attorneys in ${location.name}`, description: `Attorneys for ${sit.name.toLowerCase()} cases in ${location.name}`, url: `/situations/${sitSlug}/${locSlug}`, items: providers.slice(0, 20).map((p, i) => ({ name: p.name, url: getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty?.name, city: p.address_city }), position: i + 1, image: getServiceImage(sit.paSlug).src, rating: p.rating_average ?? undefined, reviewCount: p.review_count ?? undefined })) })
    : null

  const speakableSchema = getSpeakableSchema({ url: `${SITE_URL}/situations/${sitSlug}/${locSlug}`, title: h1 })
  const schemas: Record<string, unknown>[] = [howToSchema, breadcrumbSchema, speakableSchema, ...(itemListSchema ? [itemListSchema] : [])]

  const nearbyCities = isZipSlug(locSlug)
    ? await getNearbyZipCodes(locSlug, 8)
    : getNearbyCities(locSlug, 8)
  const stateCities = location.department_code ? getCitiesByState(location.department_code).filter(c => c.slug !== locSlug).slice(0, 6) : []

  return (
    <>
      {schemas.map((s, i) => (<script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(s) }} />))}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb items={[{ label: 'Situations', href: '/situations' }, { label: sit.name, href: `/situations/${sitSlug}` }, { label: location.name }]} />
        </div>
      </div>

      <section className="bg-gradient-to-b from-red-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">{h1}</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            {sit.description} Our directory connects you with experienced {paName.toLowerCase()} attorneys in {location.name} who handle {sit.name.toLowerCase()} cases. {totalCount > 0 ? `${totalCount} verified attorneys.` : ''}
          </p>
          <div className="mt-6">
            <Link href={`/practice-areas/${sit.paSlug}/${locSlug}`} className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Find a {paName} Attorney
            </Link>
          </div>
        </div>
      </section>

      {/* What To Do */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What to Do After a {sit.name}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Ensure Safety', desc: 'Prioritize your safety and the safety of others. Call 911 if there are injuries.' },
              { step: '2', title: 'Document Everything', desc: 'Take photos, get witness contacts, and keep all medical records and correspondence.' },
              { step: '3', title: 'Seek Medical Attention', desc: 'Get checked by a doctor even if you feel fine. Some injuries appear days later.' },
              { step: '4', title: 'Contact an Attorney', desc: `Consult a ${paName.toLowerCase()} attorney in ${location.name}. Most offer free initial consultations.` },
            ].map(item => (
              <div key={item.step} className="p-5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="inline-block w-8 h-8 rounded-full bg-red-600 text-white text-center leading-8 font-bold text-sm mb-3">{item.step}</span>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Legal Rights</h2>
          <ul className="space-y-3 max-w-3xl">
            <li className="flex gap-3"><span className="text-green-600 font-bold">&#10003;</span><span className="text-gray-700">You have the right to seek compensation for medical bills, lost wages and pain and suffering.</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">&#10003;</span><span className="text-gray-700">You are not required to give a recorded statement to insurance companies without an attorney.</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">&#10003;</span><span className="text-gray-700">Statute of limitations apply — do not wait too long to file your claim.</span></li>
            <li className="flex gap-3"><span className="text-green-600 font-bold">&#10003;</span><span className="text-gray-700">Many attorneys work on a contingency basis — no fee unless you recover compensation.</span></li>
          </ul>
        </div>
      </section>

      {/* Attorney Listings */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{paName} Attorneys for {sit.name} in {location.name}</h2>
          {providers.length > 0 ? (
            <div className="grid gap-4">
              {(providers as Provider[]).slice(0, 20).map((p, idx) => (
                <Link key={p.stable_id || idx} href={getAttorneyUrl({ stable_id: p.stable_id, slug: p.slug, specialty: p.specialty?.name, city: p.address_city })} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.address_city}{p.address_county ? `, ${p.address_county}` : ''}</p>
                  </div>
                  {p.rating_average != null && <span className="text-sm font-semibold text-red-600">★ {p.rating_average.toFixed(1)}</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">Our directory for {sit.name.toLowerCase()} attorneys in {location.name} is growing. Explore nearby cities or contact a {paName.toLowerCase()} attorney directly.</p>
          )}
        </div>
      </section>

      {(nearbyCities.length > 0 || stateCities.length > 0) && (
        <section className="py-10 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{sit.name} Attorneys Nearby</h2>
            <div className="flex flex-wrap gap-2">
              {[...nearbyCities, ...stateCities].slice(0, 12).map(c => (
                <Link key={c.slug} href={`/situations/${sitSlug}/${c.slug}`} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm hover:border-red-300 hover:text-red-700 transition-colors">{c.name}</Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CrossIntentLinks service={sit.paSlug} specialtyName={paName} city={locSlug} cityName={location.name} currentIntent="emergency" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonStringify({
            '@context': 'https://schema.org',
            '@type': 'LegalService',
            name: h1,
            description: `${sit.description} Find a qualified ${paName.toLowerCase()} attorney in ${location.name}.`,
            url: `${SITE_URL}/situations/${sitSlug}/${locSlug}`,
            areaServed: {
              '@type': 'City',
              name: location.name,
            },
            serviceType: paName,
            isPartOf: {
              '@type': 'WebSite',
              name: 'Lawtendr',
              url: 'https://lawtendr.com',
            },
          }),
        }}
      />
    </>
  )
}
