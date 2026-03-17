import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight, Users, Building2, ChevronRight, Globe } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { usRegions, states, cities, services, getCitiesByState } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.locations

export const metadata: Metadata = {
  title: 'Attorneys by Region | US Attorneys',
  description: 'Browse attorneys across US regions: Northeast, South, Midwest, and West. Find lawyers by practice area, read reviews, and get free consultations.',
  alternates: { canonical: `${SITE_URL}/regions` },
  openGraph: {
    title: 'Attorneys by Region | US Attorneys',
    description: 'Browse attorneys across US regions: Northeast, South, Midwest, and West. Find lawyers by practice area.',
    url: `${SITE_URL}/regions`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'US Attorneys — Attorneys by Region' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorneys by Region | US Attorneys',
    description: 'Browse attorneys across US regions: Northeast, South, Midwest, and West. Find lawyers by practice area.',
  },
}

export default async function RegionsIndexPage() {
  const cmsPage = await getPageContent('regions', 'static')

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

  const totalDepartments = usRegions.reduce((acc, r) => acc + r.states.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Attorneys by Region in the US',
        description: 'Find attorneys across all US regions.',
        url: `${SITE_URL}/regions`,
        numberOfItems: usRegions.length,
        isPartOf: { '@type': 'WebSite', name: 'US Attorneys', url: SITE_URL },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Regions' }
          ]
        }
      }) }} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(51,65,85,0.30) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(71,85,105,0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(100,116,139,0.08) 0%, transparent 50%)',
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
              items={[{ label: 'Regions' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/15 backdrop-blur-sm rounded-full border border-slate-400/25 mb-6">
              <Globe className="w-4 h-4 text-slate-300" />
              <span className="text-sm font-medium text-slate-200">Regions</span>
              <span className="w-1 h-1 rounded-full bg-slate-400/50" />
              <span className="text-sm font-medium text-white/90">Nationwide coverage</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold mb-6 tracking-[-0.025em] leading-[1.08]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-slate-200 to-white">
                {usRegions.length} regions
              </span>
              , a national network
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Find verified attorneys across every region of the United States.
              Browse our comprehensive attorney directory.
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-10">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Globe className="w-5 h-5 text-slate-300" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{usRegions.length}</div>
                <div className="text-xs text-slate-400">Regions</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Building2 className="w-5 h-5 text-slate-300" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{totalDepartments}</div>
                <div className="text-xs text-slate-400">States</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-slate-300" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">SIREN</div>
                <div className="text-xs text-slate-400">Official data</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REGIONS GRID ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Choose your region
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Each region has qualified attorneys for all your legal needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {usRegions.map((region) => {
            const deptCount = region.states.length
            const cityCount = region.states.reduce((acc, d) => acc + getCitiesByState(d.code).length, 0)

            return (
              <Link
                key={region.slug}
                href={`/regions/${region.slug}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-slate-400 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-slate-700 transition-colors tracking-tight">
                      {region.name}
                    </h3>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{region.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{deptCount} state{deptCount > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{cityCount} cit{cityCount > 1 ? 'ies' : 'y'}</span>
                  </div>
                </div>

                {/* Preview cities */}
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  {region.states.flatMap(d => getCitiesByState(d.code)).slice(0, 4).map((city) => (
                    <span key={city.slug} className="text-xs bg-gray-100 text-slate-600 px-2.5 py-1 rounded-full group-hover:bg-slate-100 group-hover:text-slate-800 transition-colors">
                      {city.name}
                    </span>
                  ))}
                  {cityCount > 4 && (
                    <span className="text-xs text-slate-400 px-2 py-1">
                      +{cityCount - 4}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(51,65,85,0.15) 0%, transparent 60%)',
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
            {/* Departements */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Popular states</h3>
              <div className="space-y-2">
                {states.slice(0, 8).map((d) => (
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
