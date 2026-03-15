import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, MapPin, Users, ChevronRight, Map } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { states, usRegions, cities, services } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { getAttorneyCount, formatAttorneyCount } from '@/lib/data/stats'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Attorneys by State | US Attorneys',
  description: 'Find attorneys in all 50 US states and DC. Browse lawyers by state, read reviews, and get free consultations.',
  alternates: { canonical: `${SITE_URL}/states` },
  openGraph: {
    title: 'Attorneys by State | US Attorneys',
    description: 'Find attorneys in all 50 US states and DC. Browse lawyers by state, read reviews, and get free consultations.',
    url: `${SITE_URL}/states`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'US Attorneys — Attorneys by State' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorneys by State | US Attorneys',
    description: 'Find attorneys in all 50 US states and DC. Browse lawyers by state, read reviews, and get free consultations.',
  },
}

const deptsByRegion = states.reduce((acc, dept) => {
  if (!acc[dept.region]) acc[dept.region] = []
  acc[dept.region].push(dept)
  return acc
}, {} as Record<string, typeof states>)

// Sort regions alphabetically
const sortedRegions = Object.entries(deptsByRegion).sort(
  (a, b) => a[0].localeCompare(b[0])
)

export default async function DepartementsIndexPage() {
  const [cmsPage, attorneyCount] = await Promise.all([
    getPageContent('states', 'static'),
    getAttorneyCount(),
  ])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Attorneys by State in the US',
        description: 'Find attorneys in all 50 US states and DC.',
        url: `${SITE_URL}/states`,
        numberOfItems: states.length,
        isPartOf: { '@type': 'WebSite', name: 'US Attorneys', url: SITE_URL },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'States' }
          ]
        }
      }) }} />

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
              items={[{ label: 'States' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/15 backdrop-blur-sm rounded-full border border-indigo-400/25 mb-6">
              <Map className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-200">States</span>
              <span className="w-1 h-1 rounded-full bg-indigo-400/50" />
              <span className="text-sm font-medium text-white/90">Nationwide coverage</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold mb-6 tracking-[-0.025em] leading-[1.08]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-blue-300">
                {states.length}
              </span>{' '}
              states covered
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {attorneyCount > 0 ? `${formatAttorneyCount(attorneyCount)} attorneys listed` : 'Thousands of attorneys listed'} across all US states.
              Free search, free consultations.
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-10">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{states.length}</div>
                <div className="text-xs text-slate-400">States</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <MapPin className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{usRegions.length}</div>
                <div className="text-xs text-slate-400">Regions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{attorneyCount > 0 ? formatAttorneyCount(attorneyCount) : '—'}</div>
                <div className="text-xs text-slate-400">Listed attorneys</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DEPARTMENTS BY REGION ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            All states by region
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Select a state to browse attorneys in your area.
          </p>
        </div>

        {sortedRegions.map(([region, regionDepts]) => (
          <section key={region} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900 tracking-tight">{region}</h3>
              <span className="text-sm text-slate-400 font-medium">({regionDepts.length} states)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {regionDepts.map((dept) => (
                <Link
                  key={dept.slug}
                  href={`/states/${dept.slug}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0 group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                    {dept.code}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors block truncate">{dept.name}</span>
                    <span className="text-xs text-slate-400">{dept.population} pop.</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Need an attorney?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Describe your legal matter and get free consultations from qualified attorneys.
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
            Also explore
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Regions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">By region</h3>
              <div className="space-y-2">
                {usRegions.slice(0, 8).map((r) => (
                  <Link key={r.slug} href={`/regions/${r.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {r.name}
                  </Link>
                ))}
              </div>
              <Link href="/regions" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All regions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Villes */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Major cities</h3>
              <div className="space-y-2">
                {cities.slice(0, 12).map((v) => (
                  <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Attorneys in {v.name}
                  </Link>
                ))}
              </div>
              <Link href="/cities" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                All cities <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Popular practice areas</h3>
              <div className="space-y-2">
                {services.slice(0, 8).map((s) => (
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
          </div>
        </div>
      </section>
    </div>
  )
}
