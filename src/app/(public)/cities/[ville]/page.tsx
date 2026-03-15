import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Users, Building2, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle, Thermometer, Home, TrendingUp, AlertTriangle } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getPlaceSchema, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { cities, getCityBySlug, practiceAreas, getRegionSlugByName, getStateByCode, getNeighborhoodsByCity } from '@/lib/data/usa'
import { getCityImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { generateVilleContent, hashCode } from '@/lib/seo/location-content'
import problems from '@/lib/data/problems'

// Pre-render top 20 cities, rest generated on-demand via ISR
const TOP_CITIES_COUNT = 20
export function generateStaticParams() {
  return cities.slice(0, TOP_CITIES_COUNT).map((ville) => ({ ville: ville.slug }))
}

export const dynamicParams = true
export const revalidate = 86400

interface PageProps {
  params: Promise<{ ville: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ville: villeSlug } = await params
  const ville = getCityBySlug(villeSlug)
  if (!ville) return { title: 'City non trouvée' }
  const villeRegion = getStateByCode(ville.stateCode)?.region ?? ''

  const cityImage = getCityImage(villeSlug)
  const metaContent = generateVilleContent(ville as never)


  const titleHash = Math.abs(hashCode(`title-ville-${ville.slug}`))
  const titleTemplates = [
    `Artisans ${ville.name} (${ville.stateCode}) — Devis`,
    `Artisan ${ville.name} — Devis Gratuit`,
    `${ville.name} : artisans qualifiés — Devis`,
    `Artisans à ${ville.name} — Comparez`,
    `${ville.name} (${ville.stateCode}) — Annuaire`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-ville-${ville.slug}`))
  const descTemplates = [
    `Trouvez des artisans qualifiés à ${ville.name} (${ville.stateCode}). ${metaContent.profile.climateLabel}, ${practiceAreas.length} corps de métier. Devis gratuits.`,
    `${ville.name}, ${ville.stateName} : artisans référencés SIREN. ${metaContent.profile.citySizeLabel}, climat ${metaContent.profile.climateLabel.toLowerCase()}. Devis gratuit.`,
    `Annuaire de ${practiceAreas.length} métiers à ${ville.name} (${ville.stateCode}), ${villeRegion}. ${metaContent.profile.climateLabel}. Comparez les devis.`,
    `Artisans à ${ville.name} : plombier, électricien, serrurier et plus. ${ville.population} hab., ${ville.stateName}. Devis gratuits en ligne.`,
    `Tous les artisans de ${ville.name} (${ville.stateCode}). ${metaContent.profile.citySizeLabel} en ${villeRegion}. ${practiceAreas.length} spécialités, devis gratuit.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    // Hub pages are always indexed — rich geographic content has value even with 0 providers
    robots: { index: true, follow: true },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      type: 'website',
      images: [cityImage
        ? { url: cityImage.src, width: 1200, height: 630, alt: cityImage.alt }
        : { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `Artisans à ${ville.name}` }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cityImage ? cityImage.src : `${SITE_URL}/opengraph-image`],
    },
    alternates: { canonical: `${SITE_URL}/cities/${villeSlug}` },
  }
}

export default async function VillePage({ params }: PageProps) {
  const { ville: villeSlug } = await params
  const ville = getCityBySlug(villeSlug)
  if (!ville) notFound()
  const villeRegion = getStateByCode(ville.stateCode)?.region ?? ''

  // Get other cities in the same departement
  const nearbyVilles = cities.filter(
    (v) => v.stateCode === ville.stateCode && v.slug !== ville.slug
  )

  // Get other cities in the same region
  const regionVilles = cities.filter(
    (v) => getStateByCode(v.stateCode)?.region === villeRegion && v.slug !== ville.slug
  ).slice(0, 8)

  const regionSlug = getRegionSlugByName(villeRegion)
  const dept = getStateByCode(ville.stateCode)
  const deptSlug = dept?.slug

  // Generate unique SEO content
  const content = generateVilleContent(ville as never)
  const topServiceSlugsSet = new Set(content.profile.topServiceSlugs.slice(0, 5))
  const orderedServices = [...practiceAreas].sort((a, b) => {
    const aIdx = content.profile.topServiceSlugs.indexOf(a.slug)
    const bIdx = content.profile.topServiceSlugs.indexOf(b.slug)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })

  // JSON-LD structured data
  const cityImage = getCityImage(ville.slug)
  const placeSchema = getPlaceSchema({
    name: ville.name,
    slug: ville.slug,
    region: villeRegion,
    department: ville.stateName,
    description: `Trouvez des artisans qualifiés à ${ville.name}. Plombiers, électriciens, serruriers et plus.`,
    image: cityImage?.src,
  })
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Villes', url: '/cities' },
    { name: ville.name, url: `/cities/${ville.slug}` },
  ])

  const faqSchema = getFAQSchema(content.faqItems)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[placeSchema, breadcrumbSchema, faqSchema]} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
            {cityImage && (
              <Image
                src={cityImage.src}
                alt={cityImage.alt}
                fill
                className="object-cover opacity-15"
                sizes="100vw"
                priority
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            )}
            <div className="absolute inset-0 bg-[#0a0f1e]/80" />
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
              items={[
                ...(regionSlug ? [{ label: villeRegion, href: `/regions/${regionSlug}` }] : []),
                ...(deptSlug ? [{ label: `${ville.stateName} (${ville.stateCode})`, href: `/states/${deptSlug}` }] : []),
                { label: ville.name },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 backdrop-blur-sm rounded-full border border-blue-400/25">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">{content.profile.citySizeLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">{content.profile.climateLabel}</span>
              </div>
            </div>

            {(() => {
              const h1Hash = Math.abs(hashCode(`h1-ville-${ville.slug}`))
              const h1Templates = [
                `Artisans à ${ville.name}`,
                `Trouver un artisan à ${ville.name} (${ville.stateCode})`,
                `${ville.name} : artisans qualifiés pour vos travaux`,
                `Artisans à ${ville.name}, ${ville.stateName}`,
                `${practiceAreas.length} corps de métier à ${ville.name}`,
              ]
              return (
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              {content.intro}
            </p>

            {/* Location info */}
            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{villeRegion}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>{ville.stateName} ({ville.stateCode})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{ville.population} habitants</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Données SIREN officielles</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" /><span className="text-sm font-medium">Devis gratuits</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES GRID ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Trouver un artisan à {ville.name}
              </h2>
              <p className="text-sm text-slate-500">{practiceAreas.length} corps de métier disponibles</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/practice-areas/${service.slug}/${villeSlug}`}
                className={`bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${topServiceSlugsSet.has(service.slug) ? 'border-2 border-indigo-200' : 'border border-gray-100'}`}
              >
                {topServiceSlugsSet.has(service.slug) && (
                  <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2">Prioritaire</span>
                )}
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">{service.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5">à {ville.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── QUARTIERS ────────────────────────────────────── */}
        {ville.neighborhoods && ville.neighborhoods.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                  Quartiers desservis à {ville.name}
                </h2>
                <p className="text-sm text-slate-500">{ville.neighborhoods.length} quartiers couverts</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2.5">
                {getNeighborhoodsByCity(villeSlug).map(({ name, slug }) => (
                  <Link key={slug} href={`/cities/${villeSlug}/${slug}`} className="bg-gray-50 text-slate-700 px-4 py-2 rounded-full text-sm border border-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── PROFIL DE LA VILLE ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Home className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Profil de {ville.name}
              </h2>
              <p className="text-sm text-slate-500">{content.profile.citySizeLabel} · {content.profile.climateLabel}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Climat</span>
              </div>
              <p className="font-bold text-slate-900">{content.profile.climateLabel}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Habitat</span>
              </div>
              <p className="font-bold text-slate-900">{content.profile.citySizeLabel}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Population</span>
              </div>
              <p className="font-bold text-slate-900">{ville.population} hab.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Département</span>
              </div>
              <p className="font-bold text-slate-900">{ville.stateName} ({ville.stateCode})</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h3 className="font-semibold text-slate-900 mb-3">Habitat à {ville.name}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{content.profile.habitatDescription}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h3 className="font-semibold text-slate-900 mb-3">Contexte urbain</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{content.contexteUrbain}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {content.profile.climaticIssues.slice(0, 4).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg border border-amber-100 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-800">{issue}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CONTENU SEO : SERVICES & CONSEILS ─────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Artisanat à {ville.name}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Services prioritaires</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{content.servicesPrioritaires}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-3">Conseils pour {ville.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{content.conseilsVille}</p>
            </div>
          </div>
        </section>

        {/* ─── DEVIS RAPIDES ─────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Devis artisan à {ville.name}
              </h2>
              <p className="text-sm text-slate-500">Demandez un devis gratuit en ligne</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { slug: 'plombier', label: 'Plombier' },
              { slug: 'electricien', label: 'Électricien' },
              { slug: 'chauffagiste', label: 'Chauffagiste' },
              { slug: 'serrurier', label: 'Serrurier' },
            ].map((s) => (
              <Link
                key={s.slug}
                href={`/quotes/${s.slug}/${villeSlug}`}
                className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:border-amber-300 hover:shadow-md transition-all group"
              >
                <h3 className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors text-sm">
                  Devis {s.label}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5">à {ville.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── NEARBY VILLES ────────────────────────────────── */}
        {nearbyVilles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Autres cities du {ville.stateName}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {nearbyVilles.map((v) => (
                <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-blue-300 hover:shadow-md transition-all group">
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 group-hover:text-blue-600 truncate transition-colors">{v.name}</span>
                    <span className="text-xs text-slate-400">{v.population} hab.</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ SECTION ──────────────────────────────────── */}
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
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Besoin d&apos;un artisan à {ville.name} ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Décrivez votre projet et recevez des devis gratuits d&apos;artisans qualifiés.
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
            Voir aussi
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Services in this city */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Services à {ville.name}</h3>
              <div className="space-y-2">
                {practiceAreas.map((s) => (
                  <Link key={s.slug} href={`/practice-areas/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} à {ville.name}
                  </Link>
                ))}
              </div>
              <Link href="/services" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                {practiceAreas.length} métiers d&apos;artisanat <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Region cities */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Villes en {villeRegion}</h3>
              <div className="space-y-2">
                {regionVilles.slice(0, 10).map((v) => (
                  <Link key={v.slug} href={`/cities/${v.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Artisans à {v.name}
                  </Link>
                ))}
              </div>
              <Link href="/cities" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                Toutes les cities <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Geographic navigation */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Région {villeRegion}
                  </Link>
                )}
                <Link href="/states" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Tous les départements
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Toutes les régions
                </Link>
                <Link href="/cities" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Toutes les cities
                </Link>
                <Link href="/quotes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Demander un devis
                </Link>
                <Link href={`/quotes/plombier/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Devis plombier à {ville.name}
                </Link>
                <Link href={`/quotes/electricien/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Devis électricien à {ville.name}
                </Link>
                <Link href={`/quotes/chauffagiste/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Devis chauffagiste à {ville.name}
                </Link>
                <Link href={`/quotes/serrurier/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Devis serrurier à {ville.name}
                </Link>
              </div>
            </div>
          </div>

          {/* Intent variant links — devis, avis, tarifs, urgence, problèmes */}
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Devis à {ville.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`devis-${s.slug}`} href={`/quotes/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Devis {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Avis à {ville.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`avis-${s.slug}`} href={`/reviews/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Avis {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Tarifs à {ville.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`tarifs-${s.slug}`} href={`/pricing/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Tarifs {s.name.toLowerCase()}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Urgence à {ville.name}</h3>
              <div className="space-y-1.5">
                {orderedServices.slice(0, 15).map((s) => (
                  <Link key={`urgence-${s.slug}`} href={`/emergency/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} urgence
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Problèmes à {ville.name}</h3>
              <div className="space-y-1.5">
                {problems.slice(0, 15).map((p) => (
                  <Link key={`prob-${p.slug}`} href={`/issues/${p.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600 py-1 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {p.name}
                  </Link>
                ))}
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
                Les données de cette page sont issues de sources publiques (INSEE, base SIRENE). Les profils climatiques et économiques sont des estimations régionales. ServicesArtisans est un annuaire indépendant — nous ne réalisons pas de travaux et ne garantissons pas les prestations des artisans référencés.
              </p>
            </div>
          </div>
        </section>

      {/* Confiance & Sécurité */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Confiance & Sécurité</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/verification-process" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Processus de vérification
            </Link>
            <Link href="/review-policy" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Politique d&apos;avis
            </Link>
            <Link href="/mediation" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Médiation
            </Link>
            <Link href="/terms" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              CGV
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
