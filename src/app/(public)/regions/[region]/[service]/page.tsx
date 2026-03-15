import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle, Euro, CheckCircle, Building2, Users, Globe, Thermometer } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import { getBreadcrumbSchema, getFAQSchema, getServiceSchema } from '@/lib/seo/jsonld'
import { usRegions, getRegionBySlug, practiceAreas as allServices, getCitiesByState } from '@/lib/data/usa'
import { getTradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { generateRegionContent, hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getServiceImage } from '@/lib/data/images'
import PriceTable from '@/components/seo/PriceTable'

export function generateStaticParams() {
  // Pre-render ALL services per region (16 × 46 = 736 pages)
  const allSlugs = getTradesSlugs()
  return usRegions.flatMap(r =>
    allSlugs.map(s => ({ region: r.slug, service: s }))
  )
}

export const dynamicParams = true
export const revalidate = 86400

interface PageProps {
  params: Promise<{ region: string; service: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { region: regionSlug, service: specialtySlug } = await params
  const region = getRegionBySlug(regionSlug)
  const trade = getTradeContent(specialtySlug)
  if (!region || !trade) return { title: 'Page non trouvée' }

  const multiplier = getRegionalMultiplier(region.name)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)
  const stateCount = region.states.length

  const titleHash = Math.abs(hashCode(`title-region-svc-${regionSlug}-${specialtySlug}`))
  const titleTemplates = [
    `${trade.name} ${region.name} — Devis Gratuit`,
    `${trade.name} ${region.name} — Annuaire`,
    `${trade.name} en ${region.name} : artisans`,
    `${trade.name} ${region.name} — Tarifs et devis`,
    `${trade.name} ${region.name} : comparez`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-region-svc-${regionSlug}-${specialtySlug}`))
  const descTemplates = [
    `Trouvez un ${trade.name.toLowerCase()} en ${region.name}. Tarif moyen : ${minPrice}–${maxPrice} ${trade.priceRange.unit}. ${stateCount} départements couverts. Devis gratuit.`,
    `${trade.name} en ${region.name} : comparez les devis. ${minPrice} à ${maxPrice} ${trade.priceRange.unit}. Artisans référencés dans ${stateCount} départements.`,
    `Besoin d’un ${trade.name.toLowerCase()} en ${region.name} ? ${minPrice}–${maxPrice} ${trade.priceRange.unit}. Comparez gratuitement les artisans.`,
    `${region.name} : ${trade.name.toLowerCase()} disponible dans ${stateCount} départements. De ${minPrice} à ${maxPrice} ${trade.priceRange.unit}. Devis gratuits.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(specialtySlug)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/regions/${regionSlug}/${specialtySlug}` },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/regions/${regionSlug}/${specialtySlug}`,
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `${trade.name} en ${region.name}` }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

export default async function RegionServicePage({ params }: PageProps) {
  const { region: regionSlug, service: specialtySlug } = await params
  const region = getRegionBySlug(regionSlug)
  const trade = getTradeContent(specialtySlug)
  if (!region || !trade) notFound()

  const content = generateRegionContent(region as never)
  const stateCount = region.states.length
  const stateCitiesMap = Object.fromEntries(
    region.states.map(st => [st.code, getCitiesByState(st.code)])
  )
  const allCities = region.states.flatMap(st => stateCitiesMap[st.code])
  const cityCount = allCities.length
  const multiplier = getRegionalMultiplier(region.name)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  // Other services
  const allTradeSlugs = getTradesSlugs()
  const otherServices = allTradeSlugs
    .filter(s => s !== specialtySlug)
    .slice(0, 8)
    .map(s => { const t = getTradeContent(s); return t ? { slug: s, name: t.name } : null })
    .filter(Boolean) as { slug: string; name: string }[]

  // Other regions
  const otherRegions = usRegions.filter(r => r.slug !== regionSlug).slice(0, 6)

  // Hash-selected tips
  const selectedTips = trade.tips
    .map((tip, i) => ({ tip, score: Math.abs(hashCode(`tip-region-${i}-${regionSlug}`)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(t => t.tip)

  // FAQ
  const tradeFaq = trade.faq
    .map((f, i) => ({ ...f, score: Math.abs(hashCode(`faq-region-${i}-${regionSlug}`)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
  const regionFaq = content.faqItems.slice(0, 2)
  const allFaq = [
    ...tradeFaq.map(f => ({ question: f.q, answer: f.a })),
    ...regionFaq,
  ]

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Régions', url: '/regions' },
    { name: region.name, url: `/regions/${regionSlug}` },
    { name: trade.name, url: `/regions/${regionSlug}/${specialtySlug}` },
  ])

  const faqSchema = getFAQSchema(allFaq)

  const serviceSchema = getServiceSchema({
    name: `${trade.name} en ${region.name}`,
    description: `Service de ${trade.name.toLowerCase()} en ${region.name}. Tarif moyen : ${minPrice}–${maxPrice} ${trade.priceRange.unit}. ${stateCount} départements couverts.`,
    areaServed: region.name,
    category: trade.name,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema]} />

      {/* ─── DARK HERO ──────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
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
          <div className="mb-10">
            <Breadcrumb
              items={[
                { label: 'Régions', href: '/regions' },
                { label: region.name, href: `/regions/${regionSlug}` },
                { label: trade.name },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-500/15 backdrop-blur-sm rounded-full border border-slate-400/25">
                <Globe className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-medium text-slate-200">{region.name}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/15 backdrop-blur-sm rounded-full border border-cyan-400/25">
                <Thermometer className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-200">{content.profile.climateLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <Euro className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">{minPrice}–{maxPrice} {trade.priceRange.unit}</span>
              </div>
            </div>

            {(() => {
              const h1Hash = Math.abs(hashCode(`h1-region-svc-${regionSlug}-${specialtySlug}`))
              const h1Templates = [
                `${trade.name} en ${region.name}`,
                `Trouver un ${trade.name.toLowerCase()} en ${region.name}`,
                `${region.name} : ${trade.name.toLowerCase()} par département`,
                `${trade.name} qualifié en ${region.name}`,
                `Tous les ${trade.name.toLowerCase()}s de ${region.name}`,
              ]
              return (
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}

            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              Trouvez un {trade.name.toLowerCase()} qualifié en {region.name}. {stateCount} départements, {cityCount} cities couvertes. Tarif moyen régional : {minPrice} à {maxPrice} {trade.priceRange.unit}.
            </p>

            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{stateCount} département{stateCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{cityCount} ville{cityCount > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{allServices.length} corps de métier</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Artisans vérifiés SIREN</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Devis 100 % gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ─── SERVICE OVERVIEW + REGIONAL PRICING ──────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Euro className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Tarifs {trade.name.toLowerCase()} en {region.name}
              </h2>
              <p className="text-sm text-slate-500">Coefficient régional : {multiplier.toFixed(2)}x</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tarif horaire min.</div>
                <div className="text-2xl font-bold text-slate-900">{minPrice} €</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-xl">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Tarif horaire max.</div>
                <div className="text-2xl font-bold text-indigo-700">{maxPrice} €</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Moyenne nationale</div>
                <div className="text-2xl font-bold text-slate-900">{trade.priceRange.min}–{trade.priceRange.max} €</div>
              </div>
            </div>
            <p className="text-sm text-slate-500">Les tarifs en {region.name} sont {multiplier >= 1.05 ? 'supérieurs' : multiplier <= 0.95 ? 'inférieurs' : 'proches de'} la moyenne nationale (coefficient {multiplier.toFixed(2)}). {content.profile.economyLabel}.</p>
          </div>
        </section>

        {/* ─── PRICE TABLE (CommonTasks) ─────────────────────── */}
        {trade.commonTasks && trade.commonTasks.length > 0 && (
          <section className="mb-16">
            <PriceTable
              tasks={trade.commonTasks}
              tradeName={trade.name}
              priceRange={{ min: minPrice, max: maxPrice, unit: trade.priceRange.unit }}
            />
          </section>
        )}

        {/* ─── DEPARTMENTS GRID ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                {trade.name} par département en {region.name}
              </h2>
              <p className="text-sm text-slate-500">{stateCount} département{stateCount > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {region.states.map((st) => (
              <Link
                key={st.code}
                href={`/states/${st.slug}/${specialtySlug}`}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                      <span className="text-indigo-700 font-bold text-sm">{st.code}</span>
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{trade.name} in {st.name}</h3>
                      <span className="text-xs text-slate-400">{stateCitiesMap[st.code].length} cit{stateCitiesMap[st.code].length > 1 ? 'ies' : 'y'}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {stateCitiesMap[st.code].slice(0, 3).map((city) => (
                    <span key={city.slug} className="text-xs bg-gray-50 text-slate-500 px-2.5 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {city.name}
                    </span>
                  ))}
                  {stateCitiesMap[st.code].length > 3 && (
                    <span className="text-xs text-slate-400 px-2 py-1">+{stateCitiesMap[st.code].length - 3}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── TOP CITIES ───────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                {trade.name} dans les principales cities
              </h2>
              <p className="text-sm text-slate-500">Accès rapide par ville</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allCities.slice(0, 10).map((city) => (
              <Link
                key={city.slug}
                href={`/practice-areas/${specialtySlug}/${city.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all group text-center"
              >
                <div className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm">{city.name}</div>
                <div className="text-xs text-slate-400 mt-1">{trade.name}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── TIPS ─────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Conseils pour choisir votre {trade.name.toLowerCase()} en {region.name}
            </h2>
          </div>
          <div className="space-y-4">
            {selectedTips.map((tip, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-slate-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-4">
            {allFaq.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RELATED SERVICES ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
              Autres services en {region.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {otherServices.map((s) => (
              <Link
                key={s.slug}
                href={`/regions/${regionSlug}/${s.slug}`}
                className="bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(51,65,85,0.15) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Besoin d&apos;un {trade.name.toLowerCase()} en {region.name} ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Recevez jusqu&apos;à 3 devis gratuits de professionnels qualifiés.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/quotes/${specialtySlug}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300">
              Demander un devis gratuit
            </Link>
            <Link href={`/practice-areas/${specialtySlug}`} className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors">
              Voir le service <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ───────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            Voir aussi
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">{trade.name} par département</h3>
              <div className="space-y-2">
                {region.states.slice(0, 6).map((st) => (
                  <Link key={st.slug} href={`/states/${st.slug}/${specialtySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {trade.name} in {st.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Autres régions</h3>
              <div className="space-y-2">
                {otherRegions.map((r) => (
                  <Link key={r.slug} href={`/regions/${r.slug}/${specialtySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {trade.name} en {r.name}
                  </Link>
                ))}
              </div>
              <Link href="/regions" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                Toutes les régions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                <Link href={`/practice-areas/${specialtySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />{trade.name} en France
                </Link>
                <Link href={`/quotes/${specialtySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Devis {trade.name.toLowerCase()}
                </Link>
                <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Artisans en {region.name}
                </Link>
                <Link href="/services" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Tous les services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Méthodologie éditoriale</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les tarifs indiqués sont des estimations basées sur les données nationales ajustées par un coefficient régional. Les données proviennent de sources publiques (INSEE, base SIRENE). ServicesArtisans est un annuaire indépendant — nous ne réalisons pas de travaux.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
