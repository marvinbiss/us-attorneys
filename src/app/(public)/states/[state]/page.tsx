import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Building2,
  Users,
  ArrowRight,
  Shield,
  Clock,
  ChevronRight,
  Wrench,
  HelpCircle,
  Map,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import {
  getBreadcrumbSchema,
  getCollectionPageSchema,
  getFAQSchema,
  getStateFAQItems,
} from '@/lib/seo/jsonld'
import {
  states,
  getStateBySlug,
  getCitiesByState,
  services,
  getRegionSlugByName,
} from '@/lib/data/usa'
import { getAttorneyCountByDepartment, formatAttorneyCount } from '@/lib/data/stats'
import { getDepartmentImage } from '@/lib/data/images'
import { generateStateContent, hashCode } from '@/lib/seo/location-content'
import { Thermometer, Home, TrendingUp, AlertTriangle } from 'lucide-react'
import problems from '@/lib/data/problems'
import { getCountiesByState as getCountiesByStateData } from '@/lib/data/counties'
import { REVALIDATE } from '@/lib/cache'

export function generateStaticParams() {
  return states.map((dept) => ({ state: dept.slug }))
}

export const dynamicParams = false
export const revalidate = REVALIDATE.locations

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

  const stateCities = getCitiesByState(dept.code)
  const content = generateStateContent(dept)
  const deptAttorneyCount = await getAttorneyCountByDepartment(dept.name)

  // Other departments in the same region
  const siblingDepts = states.filter((d) => d.region === dept.region && d.slug !== dept.slug)

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
    { name: 'Home', url: '/', semanticType: 'Organization' },
    { name: 'States', url: '/states', semanticType: 'CollectionPage' },
    {
      name: `${dept.name} (${dept.code})`,
      url: `/states/${dept.slug}`,
      semanticType: 'AdministrativeArea',
    },
  ])

  const collectionPageSchema = getCollectionPageSchema({
    name: `Attorneys in ${dept.name} (${dept.code})`,
    description: `Find qualified attorneys in ${dept.name} (${dept.code}). ${services.length} practice areas covered.`,
    url: `/states/${dept.slug}`,
    itemCount: services.length,
  })

  // Merge editorial FAQs (from location-content) with programmatic SEO FAQs
  const programmaticStateFaqs = getStateFAQItems(dept.name, dept.code, {
    attorneyCount: deptAttorneyCount || undefined,
    cityCount: stateCities.length || dept.cities.length || undefined,
    // barAssociationUrl not in static data yet — omitted
  })
  const allStateFaqs = [...content.faqItems, ...programmaticStateFaqs]
  const faqSchema = getFAQSchema(allStateFaqs)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, collectionPageSchema, faqSchema]} />
      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(129,140,248,0.08) 0%, transparent 50%)',
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
              items={[
                ...(regionSlug ? [{ label: dept.region, href: `/regions/${regionSlug}` }] : []),
                { label: 'States', href: '/states' },
                { label: `${dept.name} (${dept.code})` },
              ]}
              className="text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/15 px-4 py-2 backdrop-blur-sm">
                <Map className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-200">State</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-500/15 px-4 py-2 backdrop-blur-sm">
                <Thermometer className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-200">
                  {content.profile.climateLabel}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 backdrop-blur-sm">
                <Home className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">
                  {content.profile.housingLabel}
                </span>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/15 backdrop-blur">
                <span className="bg-gradient-to-r from-indigo-400 to-blue-300 bg-clip-text text-2xl font-bold text-transparent">
                  {dept.code}
                </span>
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
                    <h1 className="font-heading text-3xl font-extrabold leading-[1.1] tracking-[-0.025em] md:text-4xl lg:text-5xl">
                      {h1Templates[h1Hash % h1Templates.length]}
                    </h1>
                  )
                })()}
                <p className="mt-1 text-slate-400">{dept.region}</p>
              </div>
            </div>

            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-400">
              {content.profile.climateLabel}, {content.profile.economyLabel.toLowerCase()},{' '}
              {content.profile.housingLabel.toLowerCase()}. {services.length} practice areas
              available in this state.
            </p>

            {/* Location info */}
            <div className="mb-8 flex flex-wrap gap-4 text-sm">
              {deptAttorneyCount > 0 && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>
                    {formatAttorneyCount(deptAttorneyCount)} attorney
                    {deptAttorneyCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <span>Capital: {dept.capital}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>{dept.population} population</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <span>
                  {stateCities.length || dept.cities.length} cit
                  {(stateCities.length || dept.cities.length) > 1 ? 'ies' : 'y'} covered
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Bar-verified attorneys</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Free consultations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ─── SERVICES ─────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Wrench className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Find an attorney in {dept.name}
              </h2>
              <p className="text-sm text-slate-500">{services.length} practice areas available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/states/${dept.slug}/${service.slug}`}
                className={`group rounded-xl bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${topServiceSlugsSet.has(service.slug) ? 'border-2 border-indigo-200' : 'border border-gray-100'}`}
              >
                {topServiceSlugsSet.has(service.slug) && (
                  <span className="mb-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                    Top rated
                  </span>
                )}
                <span className="block text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">
                  {service.name}
                </span>
                <span className="mt-1.5 block text-xs text-slate-400">in {dept.code}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── STATE PROFILE ────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
              <Thermometer className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Profile of {dept.name}
              </h2>
              <p className="text-sm text-slate-500">
                {content.profile.climateLabel} · {content.profile.economyLabel}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <p className="mb-6 leading-relaxed text-slate-700">{content.intro}</p>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-cyan-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">
                  Climate
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {content.profile.climateLabel}
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Housing
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {content.profile.housingLabel}
                </div>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
                  Economy
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {content.profile.economyLabel}
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Population
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {dept.population} residents
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Common legal issues
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {content.profile.climaticIssues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 text-amber-500">•</span>
                    {issue}
                  </div>
                ))}
              </div>
            </div>
            <p className="leading-relaxed text-slate-700">{content.housingContext}</p>
          </div>
        </section>

        {/* ─── SEO CONTENT ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Legal services in {dept.name}
            </h2>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="mb-4 font-heading text-lg font-bold text-slate-900">
                Top practice areas
              </h3>
              <p className="leading-relaxed text-slate-700">{content.priorityServices}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="mb-4 font-heading text-lg font-bold text-slate-900">
                Tips for finding the right attorney
              </h3>
              <p className="leading-relaxed text-slate-700">{content.stateAdvice}</p>
            </div>
          </div>
        </section>

        {/* ─── PRINCIPALES VILLES ───────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                Major cities in {dept.name}
              </h2>
              <p className="text-sm text-slate-500">
                {stateCities.length > 0 ? stateCities.length : dept.cities.length} cities listed
              </p>
            </div>
          </div>
          {stateCities.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {stateCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/cities/${city.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 transition-colors group-hover:from-indigo-100 group-hover:to-indigo-200">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-600">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-400">{city.population} pop.</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {dept.cities.map((cityName) => (
                <span
                  key={cityName}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {cityName}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ─── COUNTIES (hierarchical navigation) ──────────── */}
        {(() => {
          const stateCounties = getCountiesByStateData(dept.code)
            .sort((a, b) => b.population - a.population)
            .slice(0, 20)
          if (stateCounties.length === 0) return null
          return (
            <section className="mb-16">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                  <Building2 className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
                    Counties in {dept.name}
                  </h2>
                  <p className="text-sm text-slate-500">Browse attorneys by county</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {stateCounties.map((county) => (
                  <Link
                    key={county.fips}
                    href={`/counties/${county.slug}/personal-injury`}
                    className="group rounded-xl border border-gray-200 bg-white p-3 text-center transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
                  >
                    <div className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-violet-600">
                      {county.name}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {county.population.toLocaleString()} pop. · {county.seat}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })()}

        {/* ─── SERVICES BY CITY ───────────────────────────── */}
        {stateCities.length > 0 && (
          <section className="mb-16">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <Wrench className="h-5 w-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
                Practice areas by city in {dept.name}
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stateCities.slice(0, 12).map((city) => (
                <div key={city.slug} className="rounded-2xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 font-heading font-semibold text-slate-900">
                    Attorneys in {city.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Link
                        key={`${service.slug}-${city.slug}`}
                        href={`/practice-areas/${service.slug}/${city.slug}`}
                        className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/cities/${city.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    All attorneys <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── OTHER DEPARTMENTS ─────────────────────────────── */}
        {siblingDepts.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">
                Other states in {dept.region}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {siblingDepts.slice(0, 10).map((d) => (
                <Link
                  key={d.slug}
                  href={`/states/${d.slug}`}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {d.name} ({d.code})
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ ───────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <HelpCircle className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {allStateFaqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-2 font-semibold text-slate-900">{faq.question}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0f1e]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:py-20">
          <h2 className="mb-4 font-heading text-2xl font-bold tracking-tight text-white md:text-3xl">
            Need an attorney in {dept.name}?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-slate-400">
            Get up to 3 free consultations from qualified attorneys.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/quotes"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/35"
            >
              Get a free consultation
            </Link>
            <Link
              href="/practice-areas"
              className="inline-flex items-center gap-2 font-medium text-slate-300 transition-colors hover:text-white"
            >
              Browse practice areas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-heading text-xl font-bold tracking-tight text-slate-900">
            See also
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {/* Services */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Popular practice areas
              </h3>
              <div className="space-y-2">
                {orderedServices.slice(0, 8).map((s) => (
                  <Link
                    key={s.slug}
                    href={`/practice-areas/${s.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link
                href="/practice-areas"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                All practice areas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Region */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Region: {dept.region}
              </h3>
              <div className="space-y-2">
                {regionSlug && (
                  <Link
                    href={`/regions/${regionSlug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Attorneys in {dept.region}
                  </Link>
                )}
                {siblingDepts.slice(0, 5).map((d) => (
                  <Link
                    key={d.slug}
                    href={`/states/${d.slug}`}
                    className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {d.name} ({d.code})
                  </Link>
                ))}
              </div>
              <Link
                href="/states"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                All states <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                Navigation
              </h3>
              <div className="space-y-2">
                <Link
                  href="/cities"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All cities
                </Link>
                <Link
                  href="/regions"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All regions
                </Link>
                <Link
                  href="/states"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  All states
                </Link>
                <Link
                  href="/quotes"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  Request a consultation
                </Link>
                <Link
                  href="/how-it-works"
                  className="flex items-center gap-2 py-2 text-sm text-slate-600 transition-colors hover:text-blue-600"
                >
                  <ChevronRight className="h-3 w-3" />
                  How it works
                </Link>
              </div>
            </div>
          </div>

          {/* Dept × Service cross-links */}
          <div className="mt-10">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Practice areas in {dept.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {orderedServices.slice(0, 10).map((s) => (
                <Link
                  key={`dept-svc-${s.slug}`}
                  href={`/states/${dept.slug}/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 transition-colors hover:border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800"
                >
                  {s.name} in {dept.code}
                </Link>
              ))}
            </div>
          </div>

          {/* Intent variant links -- quotes, reviews, pricing */}
          {stateCities.length > 0 && (
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                  Consultations in {dept.name}
                </h3>
                <div className="space-y-1.5">
                  {stateCities.slice(0, 6).flatMap((city) =>
                    orderedServices.slice(0, 5).map((s) => (
                      <Link
                        key={`quotes-${s.slug}-${city.slug}`}
                        href={`/quotes/${s.slug}/${city.slug}`}
                        className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {s.name} consultation in {city.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                  Reviews in {dept.name}
                </h3>
                <div className="space-y-1.5">
                  {stateCities.slice(0, 6).flatMap((city) =>
                    orderedServices.slice(0, 5).map((s) => (
                      <Link
                        key={`reviews-${s.slug}-${city.slug}`}
                        href={`/reviews/${s.slug}/${city.slug}`}
                        className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {s.name} reviews in {city.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
                  Pricing in {dept.name}
                </h3>
                <div className="space-y-1.5">
                  {stateCities.slice(0, 6).flatMap((city) =>
                    orderedServices.slice(0, 5).map((s) => (
                      <Link
                        key={`pricing-${s.slug}-${city.slug}`}
                        href={`/pricing/${s.slug}/${city.slug}`}
                        className="flex items-center gap-2 py-1 text-sm text-slate-600 transition-colors hover:text-blue-600"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {s.name} pricing in {city.name}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {stateCities.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-700">
                Emergency services in {dept.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {stateCities.slice(0, 6).flatMap((city) =>
                  orderedServices.slice(0, 5).map((s) => (
                    <Link
                      key={`emergency-${s.slug}-${city.slug}`}
                      href={`/emergency/${s.slug}/${city.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition-colors hover:border-red-200 hover:bg-red-100 hover:text-red-800"
                    >
                      Emergency {s.name.toLowerCase()} in {city.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
          {stateCities.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-orange-700">
                Common issues in {dept.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {stateCities.slice(0, 4).flatMap((city) =>
                  problems.slice(0, 6).map((p) => (
                    <Link
                      key={`issue-${p.slug}-${city.slug}`}
                      href={`/issues/${p.slug}/${city.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50 px-3 py-1.5 text-sm text-orange-700 transition-colors hover:border-orange-200 hover:bg-orange-100 hover:text-orange-800"
                    >
                      {p.name} in {city.name}
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Editorial methodology</h3>
            <p className="text-xs leading-relaxed text-slate-500">
              State profiles are based on publicly available data. US Attorneys is an independent
              directory — we do not provide legal services.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Trust & Safety</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/verification-process"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Verification process
            </Link>
            <Link
              href="/review-policy"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Review policy
            </Link>
            <Link
              href="/mediation"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Mediation
            </Link>
            <Link
              href="/terms"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
            >
              Terms of service
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
