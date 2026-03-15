import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight, Building2, Users, ChevronRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { SITE_URL } from '@/lib/seo/config'
import { cities, usRegions, states, services, getStateByCode } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Artisans par ville — Des milliers de professionnels',
  description: `Trouvez un artisan référencé dans votre ville. ${cities.length} cities couvertes, Des milliers de professionnels dans 101 départements. Devis gratuits, sans engagement.`,
  alternates: { canonical: `${SITE_URL}/cities` },
  openGraph: {
    title: 'Artisans par ville — Des milliers de professionnels',
    description: `Trouvez un artisan référencé dans votre ville. ${cities.length} cities couvertes, Des milliers de professionnels dans 101 départements.`,
    url: `${SITE_URL}/cities`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Artisans par ville' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artisans par ville — Des milliers de professionnels',
    description: `Trouvez un artisan référencé dans votre ville. ${cities.length} cities couvertes, Des milliers de professionnels dans 101 départements. Devis gratuits, sans engagement.`,
  },
}

// Group cities by region (derived from state)
const villesByRegion = cities.reduce((acc, ville) => {
  const region = getStateByCode(ville.stateCode)?.region ?? 'Other'
  if (!acc[region]) acc[region] = []
  acc[region].push(ville)
  return acc
}, {} as Record<string, typeof cities>)

// Sort regions by number of cities (biggest first)
const sortedRegions = Object.entries(villesByRegion).sort(
  (a, b) => b[1].length - a[1].length
)

export default async function VillesIndexPage() {
  const cmsPage = await getPageContent('cities', 'static')

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
        name: 'Artisans par ville en France',
        description: `Annuaire d'artisans référencés dans ${cities.length} cities de France.`,
        url: `${SITE_URL}/cities`,
        numberOfItems: cities.length,
        isPartOf: { '@type': 'WebSite', name: 'ServicesArtisans', url: SITE_URL },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Villes' }
          ]
        }
      }) }} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        {/* Background effects */}
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

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          {/* Breadcrumb */}
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Villes' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 backdrop-blur-sm rounded-full border border-blue-400/25 mb-6">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-200">Villes</span>
              <span className="w-1 h-1 rounded-full bg-blue-400/50" />
              <span className="text-sm font-medium text-white/90">{cities.length}+ cities couvertes</span>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold mb-6 tracking-[-0.025em] leading-[1.08]">
              Artisans par{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300">
                ville
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Des artisans référencés dans plus de {cities.length} cities de France.
              Trouvez un professionnel qualifié près de chez vous.
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-10">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{cities.length}+</div>
                <div className="text-xs text-slate-400">Villes</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Building2 className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">{states.length}</div>
                <div className="text-xs text-slate-400">Départements</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="text-xl font-bold text-white">SIREN</div>
                <div className="text-xs text-slate-400">Données officielles</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VILLES BY REGION ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick-search intro */}
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            Toutes les cities par région
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Sélectionnez votre ville pour découvrir les artisans disponibles dans votre secteur.
          </p>
        </div>

        {/* Region quick-nav */}
        <nav className="flex flex-wrap gap-2 mb-10">
          {sortedRegions.map(([region]) => (
            <a
              key={region}
              href={`#region-${region.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
            >
              {region}
            </a>
          ))}
        </nav>

        {sortedRegions.map(([region, regionVilles]) => {
          const regionId = region.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
          return (
            <details key={region} id={`region-${regionId}`} className="mb-4 bg-white rounded-xl border border-gray-200 group">
              <summary className="flex items-center gap-3 p-4 cursor-pointer list-none select-none hover:bg-gray-50 rounded-xl transition-colors">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <h3 className="font-heading text-base font-bold text-slate-900 tracking-tight">{region}</h3>
                <span className="text-sm text-slate-400 font-medium">({regionVilles.length} cities)</span>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-open:rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                  {regionVilles.map((ville, i) => (
                    <span key={ville.slug}>
                      <Link
                        href={`/cities/${ville.slug}`}
                        className="text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors"
                      >
                        {ville.name}
                      </Link>
                      {i < regionVilles.length - 1 && <span className="text-slate-300 mx-1">&middot;</span>}
                    </span>
                  ))}
                </div>
              </div>
            </details>
          )
        })}
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Besoin d&apos;un artisan ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Décrivez votre projet et recevez des devis gratuits de professionnels référencés.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/quotes" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300">
              Demander un devis gratuit
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors">
              Voir les services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ─────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            Explorer également
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Regions */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Par région</h3>
              <div className="space-y-2">
                {usRegions.slice(0, 8).map((r) => (
                  <Link key={r.slug} href={`/regions/${r.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Artisans en {r.name}
                  </Link>
                ))}
              </div>
              <Link href="/regions" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                Toutes les régions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Departements */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Par département</h3>
              <div className="space-y-2">
                {states.slice(0, 8).map((d) => (
                  <Link key={d.slug} href={`/states/${d.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {d.name} ({d.code})
                  </Link>
                ))}
              </div>
              <Link href="/states" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                Tous les départements <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Services populaires</h3>
              <div className="space-y-2">
                {services.slice(0, 8).map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name}
                  </Link>
                ))}
              </div>
              <Link href="/services" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                Tous les services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
