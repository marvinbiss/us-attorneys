import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Building2, Users, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle, Map } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import { getBreadcrumbSchema, getCollectionPageSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { states, getStateBySlug, getCitiesByState, services, getRegionSlugByName } from '@/lib/data/usa'
import { getAttorneyCountByDepartment, formatAttorneyCount } from '@/lib/data/stats'
import { getDepartmentImage } from '@/lib/data/images'
import { generateDepartementContent, hashCode } from '@/lib/seo/location-content'
import { Thermometer, Home, TrendingUp, AlertTriangle } from 'lucide-react'
import problems from '@/lib/data/problems'

export function generateStaticParams() {
  return states.map((dept) => ({ state: dept.slug }))
}

export const dynamicParams = false
export const revalidate = 86400

interface PageProps {
  params: Promise<{ state: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: deptSlug } = await params
  const dept = getStateBySlug(deptSlug)
  if (!dept) return { title: 'State not found' }

  const attorneyCount = await getAttorneyCountByDepartment(dept.name)

  const titleHash = Math.abs(hashCode(`title-dept-${dept.slug}`))
  const titleTemplates = [
    `${dept.name} Attorneys | US Attorneys`,
    `Find Attorneys in ${dept.name}`,
    `${dept.name} Lawyers — Free Consultation`,
    `Top Attorneys in ${dept.name}`,
    `${dept.name} — Attorney Directory`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-dept-${dept.slug}`))
  const attorneyStr = attorneyCount > 0 ? `${formatAttorneyCount(attorneyCount)} attorneys, ` : ''
  const descTemplates = [
    `Find top-rated attorneys in ${dept.name}. ${attorneyStr}${services.length} practice areas. Free consultations.`,
    `${dept.name} attorney directory. ${attorneyStr}browse lawyers by practice area. Read reviews, compare and get free consultations.`,
    `Attorneys in ${dept.name}, ${dept.region}. ${attorneyStr}capital ${dept.capital}. Browse lawyers and get free consultations.`,
    `${attorneyStr}${services.length} practice areas in ${dept.name}. Find qualified lawyers near you. Free consultation.`,
    `Browse all attorneys in ${dept.name}. ${attorneyStr}read reviews, compare lawyers. Free consultations.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const deptImage = getDepartmentImage(dept.code)

  return {
    title,
    description,
    // Hub pages are always indexed — rich geographic content has value even with 0 providers
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/states/${deptSlug}` },
    openGraph: {
      locale: 'en_US',
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/states/${deptSlug}`,
      images: [{ url: deptImage.src, width: 1200, height: 630, alt: `Attorneys in ${dept.name}` }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [deptImage.src],
    },
  }
}

export default async function StatePage({ params }: PageProps) {
  const { state: deptSlug } = await params
  const dept = getStateBySlug(deptSlug)
  if (!dept) notFound()

  const villesDuDepartement = getCitiesByState(dept.code)
  const content = generateDepartementContent(dept)
  const deptArtisanCount = await getAttorneyCountByDepartment(dept.name)

  // Other departments in the same region
  const siblingDepts = states.filter(
    (d) => d.region === dept.region && d.slug !== dept.slug
  )

  const regionSlug = getRegionSlugByName(dept.region)

  // Reorder services by profile priority
  const topServiceSlugsSet = new Set(content.profile.topServiceSlugs.slice(0, 5))
  const orderedServices = [...services].sort((a, b) => {
    const ai = content.profile.topServiceSlugs.indexOf(a.slug)
    const bi = content.profile.topServiceSlugs.indexOf(b.slug)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  // JSON-LD structured data
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'States', url: '/states' },
    { name: `${dept.name} (${dept.code})`, url: `/states/${dept.slug}` },
  ])

  const collectionPageSchema = getCollectionPageSchema({
    name: `Attorneys in ${dept.name} (${dept.code})`,
    description: `Find qualified attorneys in ${dept.name} (${dept.code}). ${services.length} practice areas covered.`,
    url: `/states/${dept.slug}`,
    itemCount: services.length,
  })

  const faqSchema = getFAQSchema(content.faqItems)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, collectionPageSchema, faqSchema]} />
      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(129,140,248,0.08) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[
                ...(regionSlug ? [{ label: dept.region, href: `/regions/${regionSlug}` }] : []),
                { label: 'States', href: '/states' },
                { label: `${dept.name} (${dept.code})` },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/15 backdrop-blur-sm rounded-full border border-indigo-400/25">
                <Map className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-200">State</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/15 backdrop-blur-sm rounded-full border border-cyan-400/25">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-200">{content.profile.climateLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <Home className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">{content.profile.housingLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-500/15 backdrop-blur rounded-2xl flex items-center justify-center border border-indigo-400/20">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">{dept.code}</span>
              </div>
              <div>
                {(() => {
                  const h1Hash = Math.abs(hashCode(`h1-dept-${dept.slug}`))
                  const h1Templates = [
                    `Attorneys in ${dept.name}`,
                    `Find an attorney in ${dept.name} (${dept.code})`,
                    `${dept.name}: lawyers by city`,
                    `${dept.code} Attorneys — ${dept.name}`,
                    `All attorneys in ${dept.name}, ${dept.region}`,
                  ]
                  return (
                    <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.025em] leading-[1.1]">
                      {h1Templates[h1Hash % h1Templates.length]}
                    </h1>
                  )
                })()}
                <p className="text-slate-400 mt-1">{dept.region}</p>
              </div>
            </div>

            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              {content.profile.climateLabel}, {content.profile.economyLabel.toLowerCase()}, {content.profile.housingLabel.toLowerCase()}. {services.length} practice areas available in this state.
            </p>

            {/* Location info */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              {deptArtisanCount > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{formatAttorneyCount(deptArtisanCount)} attorney{deptArtisanCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Capital: {dept.capital}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{dept.population} population</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{villesDuDepartement.length || dept.cities.length} cit{(villesDuDepartement.length || dept.cities.length) > 1 ? 'ies' : 'y'} covered</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Bar-verified attorneys</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Free consultations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ─── SERVICES ─────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Find an attorney in {dept.name}
              </h2>
              <p className="text-sm text-slate-500">{services.length} practice areas available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/states/${dept.slug}/${service.slug}`}
                className={`bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${topServiceSlugsSet.has(service.slug) ? 'border-2 border-indigo-200' : 'border border-gray-100'}`}
              >
                {topServiceSlugsSet.has(service.slug) && (
                  <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">Top rated</span>
                )}
                <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors block text-sm">{service.name}</span>
                <span className="block text-xs text-slate-400 mt-1.5">in {dept.code}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── PROFIL DU DÉPARTEMENT ────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Profile of {dept.name}
              </h2>
              <p className="text-sm text-slate-500">{content.profile.climateLabel} · {content.profile.economyLabel}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <p className="text-slate-700 leading-relaxed mb-6">{content.intro}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-cyan-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-1">Climate</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.climateLabel}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Housing</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.housingLabel}</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">Economy</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.economyLabel}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Population</div>
                <div className="text-sm text-slate-800 font-medium">{dept.population} residents</div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Common legal issues
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {content.profile.climaticIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {issue}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed">{content.contexteHabitat}</p>
          </div>
        </section>

        {/* ─── CONTENU SEO ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Legal services in {dept.name}
            </h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Top practice areas</h3>
              <p className="text-slate-700 leading-relaxed">{content.servicesPrioritaires}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Tips for finding the right attorney</h3>
              <p className="text-slate-700 leading-relaxed">{content.conseilsDepartement}</p>
            </div>
          </div>
        </section>

        {/* ─── PRINCIPALES VILLES ───────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Major cities in {dept.name}
              </h2>
              <p className="text-sm text-slate-500">{villesDuDepartement.length > 0 ? villesDuDepartement.length : dept.cities.length} cities listed</p>
            </div>
          </div>
          {villesDuDepartement.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {villesDuDepartement.map((ville) => (
                <Link key={ville.slug} href={`/cities/${ville.slug}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm truncate">{ville.name}</div>
                      <div className="text-xs text-slate-400">{ville.population} pop.</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {dept.cities.map((villeName) => (
                <span key={villeName} className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors">
                  {villeName}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ─── SERVICES PAR VILLE ───────────────────────────── */}
        {villesDuDepartement.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Wrench className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Practice areas by city in {dept.name}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {villesDuDepartement.slice(0, 12).map((ville) => (
                <div key={ville.slug} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-heading font-semibold text-slate-900 mb-4">Attorneys in {ville.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Link
                        key={`${service.slug}-${ville.slug}`}
                        href={`/practice-areas/${service.slug}/${ville.slug}`}
                        className="text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                  <Link href={`/cities/${ville.slug}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-4">
                    All attorneys <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── OTHER DEPARTMENTS ─────────────────────────────── */}
        {siblingDepts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Other states in {dept.region}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {siblingDepts.slice(0, 10).map((d) => (
                <Link key={d.slug} href={`/states/${d.slug}`} className="bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  {d.name} ({d.code})
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ ───────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {content.faqItems.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Need an attorney in {dept.name}?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Get up to 3 free consultations from qualified attorneys.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/quotes" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300">
              Get a free consultation
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors">
              Browse practice areas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            See also
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Popular practice areas</h3>
              <div className="space-y-2">
                {orderedServices.slice(0, 8).map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link href="/services" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All practice areas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Region */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Region: {dept.region}</h3>
              <div className="space-y-2">
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {dept.region}
                  </Link>
                )}
                {siblingDepts.slice(0, 5).map((d) => (
                  <Link key={d.slug} href={`/states/${d.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {d.name} ({d.code})
                  </Link>
                ))}
              </div>
              <Link href="/states" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All states <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                <Link href="/cities" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />All cities
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />All regions
                </Link>
                <Link href="/states" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />All states
                </Link>
                <Link href="/quotes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Request a consultation
                </Link>
                <Link href="/how-it-works" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />How it works
                </Link>
              </div>
            </div>
          </div>

          {/* Dept × Service cross-links */}
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Practice areas in {dept.name}</h3>
            <div className="flex flex-wrap gap-2">
              {orderedServices.slice(0, 10).map((s) => (
                <Link key={`dept-svc-${s.slug}`} href={`/states/${dept.slug}/${s.slug}`} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-100 hover:border-indigo-200">
                  {s.name} in {dept.code}
                </Link>
              ))}
            </div>
          </div>

          {/* Intent variant links — devis, avis, tarifs */}
          {villesDuDepartement.length > 0 && (
            <div className="mt-10 grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Consultations in {dept.name}</h3>
                <div className="space-y-1.5">
                  {villesDuDepartement.slice(0, 6).flatMap((ville) =>
                    orderedServices.slice(0, 5).map((s) => (
                      <Link key={`devis-${s.slug}-${ville.slug}`} href={`/quotes/${s.slug}/${ville.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        {s.name} consultation in {ville.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Reviews in {dept.name}</h3>
                <div className="space-y-1.5">
                  {villesDuDepartement.slice(0, 6).flatMap((ville) =>
                    orderedServices.slice(0, 5).map((s) => (
                      <Link key={`avis-${s.slug}-${ville.slug}`} href={`/reviews/${s.slug}/${ville.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        {s.name} reviews in {ville.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Pricing in {dept.name}</h3>
                <div className="space-y-1.5">
                  {villesDuDepartement.slice(0, 6).flatMap((ville) =>
                    orderedServices.slice(0, 5).map((s) => (
                      <Link key={`tarifs-${s.slug}-${ville.slug}`} href={`/pricing/${s.slug}/${ville.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        {s.name} pricing in {ville.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {villesDuDepartement.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-4">Emergency services in {dept.name}</h3>
              <div className="flex flex-wrap gap-2">
                {villesDuDepartement.slice(0, 6).flatMap((ville) =>
                  orderedServices.slice(0, 5).map((s) => (
                    <Link key={`urgence-${s.slug}-${ville.slug}`} href={`/emergency/${s.slug}/${ville.slug}`} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-100 hover:border-red-200">
                      Emergency {s.name.toLowerCase()} in {ville.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
          {villesDuDepartement.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-orange-700 uppercase tracking-wider mb-4">Common issues in {dept.name}</h3>
              <div className="flex flex-wrap gap-2">
                {villesDuDepartement.slice(0, 4).flatMap((ville) =>
                  problems.slice(0, 6).map((p) => (
                    <Link key={`prob-${p.slug}-${ville.slug}`} href={`/issues/${p.slug}/${ville.slug}`} className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 px-3 py-1.5 rounded-lg text-sm transition-colors border border-orange-100 hover:border-orange-200">
                      {p.name} in {ville.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

        {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
        <section className="mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Editorial methodology</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                State profiles are based on publicly available data. US Attorneys is an independent directory — we do not provide legal services.
              </p>
            </div>
          </div>
        </section>

      {/* Confiance & Sécurité */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trust & Safety</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/verification-process" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Verification process
            </Link>
            <Link href="/review-policy" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Review policy
            </Link>
            <Link href="/mediation" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Mediation
            </Link>
            <Link href="/terms" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Terms of service
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
