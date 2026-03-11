import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Users, Building2, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle, BarChart3, Thermometer, Zap, Home } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getCollectionPageSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { villes, services, getQuartierBySlug, getQuartiersByVille, getNearbyCities, getRegionSlugByName, getDepartementByCode } from '@/lib/data/france'
import { getCityImage, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { generateQuartierContent, hashCode } from '@/lib/seo/location-content'
import { formatNumber, formatEuro } from '@/lib/data/commune-data'

// Pre-render top 50 cities × their quartiers (~500+ pages)
const TOP_CITIES = 50
export function generateStaticParams() {
  return villes.slice(0, TOP_CITIES).flatMap(v =>
    getQuartiersByVille(v.slug).map(q => ({ ville: v.slug, quartier: q.slug }))
  )
}

export const dynamicParams = true
export const revalidate = 86400

interface PageProps {
  params: Promise<{ ville: string; quartier: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ville: villeSlug, quartier: quartierSlug } = await params
  const result = getQuartierBySlug(villeSlug, quartierSlug)
  if (!result) return { title: 'Quartier non trouvé' }

  const { ville, quartierName } = result
  const metaContent = generateQuartierContent(ville, quartierName)
  const cityImage = getCityImage(villeSlug)

  const titleHash = Math.abs(hashCode(`title-quartier-${villeSlug}-${quartierSlug}`))
  const titleTemplates = [
    `Artisans à ${quartierName}, ${ville.name}`,
    `${quartierName} (${ville.name}) — Artisans`,
    `Trouver un artisan à ${quartierName}`,
    `${quartierName}, ${ville.name} : devis gratuit`,
    `Artisans qualifiés — ${quartierName}`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-quartier-${villeSlug}-${quartierSlug}`))
  const descTemplates = [
    `Trouvez un artisan qualifié à ${quartierName}, ${ville.name}. ${metaContent.profile.eraLabel}, ${services.length} corps de métier. Devis gratuits.`,
    `${quartierName} à ${ville.name} (${ville.departementCode}) : artisans référencés SIREN. ${metaContent.profile.eraLabel}. Comparez les devis.`,
    `Artisans à ${quartierName}, ${ville.name}. ${metaContent.profile.densityLabel}, ${metaContent.profile.eraLabel.toLowerCase()}. Devis gratuit en ligne.`,
    `${services.length} métiers à ${quartierName} (${ville.name}). ${ville.departement}, ${metaContent.profile.eraLabel.toLowerCase()}. Devis gratuit.`,
    `Tous les artisans de ${quartierName}, ${ville.name} (${ville.departementCode}). ${metaContent.profile.eraLabel}. Comparez gratuitement.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    // All quartier pages indexed — each has unique content (profil bâti, FAQ, données)
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      type: 'website',
      images: [cityImage
        ? { url: cityImage.src, width: 1200, height: 630, alt: cityImage.alt }
        : { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `Artisans à ${quartierName}, ${ville.name}` }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cityImage ? cityImage.src : `${SITE_URL}/opengraph-image`],
    },
    alternates: { canonical: `${SITE_URL}/villes/${villeSlug}/${quartierSlug}` },
  }
}

export default async function QuartierPage({ params }: PageProps) {
  const { ville: villeSlug, quartier: quartierSlug } = await params
  const result = getQuartierBySlug(villeSlug, quartierSlug)
  if (!result) notFound()

  const { ville, quartierName } = result
  const quartiers = getQuartiersByVille(villeSlug).filter(q => q.slug !== quartierSlug)
  const nearbyVilles = getNearbyCities(villeSlug, 8)
  const regionSlug = getRegionSlugByName(ville.region)
  const dept = getDepartementByCode(ville.departementCode)
  const deptSlug = dept?.slug
  const cityImage = getCityImage(villeSlug)
  const content = generateQuartierContent(ville, quartierName)

  // Reorder services based on quartier building profile
  const orderedServices = [...services].sort((a, b) => {
    const aIdx = content.profile.topServiceSlugs.indexOf(a.slug)
    const bIdx = content.profile.topServiceSlugs.indexOf(b.slug)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })
  const topServiceSlugs = new Set(content.profile.topServiceSlugs.slice(0, 5))

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Villes', url: '/villes' },
    { name: ville.name, url: `/villes/${villeSlug}` },
    { name: quartierName, url: `/villes/${villeSlug}/${quartierSlug}` },
  ])
  const collectionSchema = getCollectionPageSchema({
    name: `Artisans à ${quartierName}, ${ville.name}`,
    description: `Annuaire d'artisans qualifiés dans le quartier ${quartierName} à ${ville.name}. ${services.length} corps de métier disponibles.`,
    url: `/villes/${villeSlug}/${quartierSlug}`,
    itemCount: services.length,
  })
  const faqSchema = getFAQSchema(content.faqItems)

  // Region villes for SEO links
  const regionVilles = villes.filter(v => v.region === ville.region && v.slug !== villeSlug).slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, collectionSchema, faqSchema]} />

      {/* ─── PREMIUM DARK HERO ──────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
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
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(16,185,129,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(52,211,153,0.06) 0%, transparent 50%)',
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
                { label: 'Villes', href: '/villes' },
                { label: ville.name, href: `/villes/${villeSlug}` },
                { label: quartierName },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 backdrop-blur-sm rounded-full border border-emerald-400/25">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-200">Quartier</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400/50" />
                <span className="text-sm font-medium text-white/90">{ville.name}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/15">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-white/80">{content.profile.eraLabel}</span>
              </div>
            </div>

            {(() => {
              const h1Hash = Math.abs(hashCode(`h1-quartier-${ville.slug}-${quartierSlug}`))
              const h1Templates = [
                `Artisans à ${quartierName}, ${ville.name}`,
                `Trouver un artisan à ${quartierName} (${ville.name})`,
                `${quartierName}, ${ville.name} : artisans qualifiés`,
                `Artisans dans le quartier ${quartierName} à ${ville.name}`,
                `${ville.name} ${quartierName} — artisans de confiance`,
              ]
              return (
                <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
                  {h1Templates[h1Hash % h1Templates.length]}
                </h1>
              )
            })()}
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-8">
              {services.length} corps de métier disponibles dans le quartier {quartierName}. {content.profile.eraLabel} en {content.profile.densityLabel.toLowerCase()}. Devis gratuits.
            </p>

            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{ville.name} ({ville.codePostal})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{ville.departement} ({ville.departementCode})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>{ville.population} habitants</span>
              </div>
            </div>

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

      {/* ─── QUARTIER PROFILE ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Caractéristiques du quartier {quartierName}
              </h2>
              <p className="text-sm text-slate-500">{content.profile.eraLabel} · {content.profile.densityLabel}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Type de bâti</p>
                  <p className="text-sm text-slate-500">{content.profile.eraLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Densité urbaine</p>
                  <p className="text-sm text-slate-500">{content.profile.densityLabel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Population</p>
                  <p className="text-sm text-slate-500">{ville.population} habitants</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{content.profile.architecturalNote}</p>
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Problématiques courantes à {quartierName} :</p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {(() => {
                  const issueHash = Math.abs(hashCode(`issues-${villeSlug}-${quartierSlug}`))
                  const allIssues = content.profile.commonIssues
                  const selected = Array.from({ length: Math.min(3, allIssues.length) }, (_, i) =>
                    allIssues[(issueHash + i) % allIssues.length]
                  )
                  return selected.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Wrench className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))
                })()}
              </ul>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">
              * Profil estimé à partir des caractéristiques urbaines de la ville. Les données réelles peuvent varier selon les constructions du quartier.
            </p>
          </div>
        </section>

        {/* ─── SERVICES GRID (ordered by profile) ─────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Services recommandés à {quartierName}
              </h2>
              <p className="text-sm text-slate-500">{services.length} corps de métier · classés par pertinence pour ce bâti</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {orderedServices.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}/${villeSlug}/${quartierSlug}`}
                className={`rounded-xl shadow-sm p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${topServiceSlugs.has(service.slug) ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-white border border-gray-100'}`}
              >
                <h3 className="font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors text-sm">{service.name}</h3>
                <p className="text-xs text-slate-400 mt-1.5">à {quartierName}</p>
                {topServiceSlugs.has(service.slug) && (
                  <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Prioritaire</span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* ─── SEO CONTENT (5 unique sections per profile) ──── */}
        <section className="mb-16 prose prose-slate max-w-none">
          <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
            Trouver un artisan dans le quartier {quartierName}
          </h2>
          <p className="text-slate-600 leading-relaxed">{content.intro}</p>

          <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight mt-8">
            Le bâti à {quartierName} : ce qu&apos;il faut savoir
          </h3>
          <p className="text-slate-600 leading-relaxed">{content.batimentContext}</p>

          <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight mt-8">
            Services les plus demandés à {quartierName}
          </h3>
          <p className="text-slate-600 leading-relaxed">{content.servicesDemandes}</p>

          <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight mt-8">
            Conseils pour vos travaux à {quartierName}
          </h3>
          <p className="text-slate-600 leading-relaxed">{content.conseils}</p>

          <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight mt-8">
            Pourquoi choisir un artisan proche de {quartierName} ?
          </h3>
          <p className="text-slate-600 leading-relaxed">{content.proximite}</p>
        </section>

        {/* ─── DATA-DRIVEN CONTENT (unique per quartier) ──────── */}
        {content.dataDriven && (
          <section className="mb-16 space-y-8">
            {/* Immobilier quartier */}
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                  Immobilier dans le quartier {quartierName}
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{content.dataDriven.immobilierQuartier}</p>
              {content.dataDriven.statCards.prixM2Quartier > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                    <div className="text-lg font-bold text-amber-700">{formatEuro(content.dataDriven.statCards.prixM2Quartier)}/m²</div>
                    <div className="text-xs text-slate-500 mt-1">Prix estimé quartier</div>
                  </div>
                  {content.dataDriven.statCards.artisansProximite > 0 && (
                    <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                      <div className="text-lg font-bold text-amber-700">{formatNumber(content.dataDriven.statCards.artisansProximite)}</div>
                      <div className="text-xs text-slate-500 mt-1">Artisans à proximité</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Marché artisanal */}
            <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 rounded-2xl border border-emerald-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                  Artisans autour de {quartierName}
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{content.dataDriven.marcheArtisanalQuartier}</p>
              {content.dataDriven.statCards.artisansBtp > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                    <div className="text-lg font-bold text-emerald-700">{formatNumber(content.dataDriven.statCards.artisansBtp)}</div>
                    <div className="text-xs text-slate-500 mt-1">Artisans BTP du secteur</div>
                  </div>
                  {content.dataDriven.statCards.artisansProximite > 0 && (
                    <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                      <div className="text-lg font-bold text-emerald-700">{formatNumber(content.dataDriven.statCards.artisansProximite)}</div>
                      <div className="text-xs text-slate-500 mt-1">Entreprises artisanales</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Énergie / DPE */}
            <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 rounded-2xl border border-orange-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                  Performance énergétique à {quartierName}
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{content.dataDriven.energetiqueQuartier}</p>
              {content.dataDriven.statCards.passoiresDpe > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                    <div className="text-lg font-bold text-orange-700">{content.dataDriven.statCards.passoiresDpe} %</div>
                    <div className="text-xs text-slate-500 mt-1">Passoires thermiques estimées</div>
                  </div>
                </div>
              )}
            </div>

            {/* Climat et travaux */}
            <div className="bg-gradient-to-br from-sky-50/50 to-cyan-50/30 rounded-2xl border border-sky-100 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-sky-600" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                  Climat et travaux à {quartierName}
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{content.dataDriven.climatQuartier}</p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {content.dataDriven.statCards.joursGel != null && (
                  <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                    <div className="text-lg font-bold text-sky-700">{content.dataDriven.statCards.joursGel}</div>
                    <div className="text-xs text-slate-500 mt-1">Jours de gel/an</div>
                  </div>
                )}
                {content.dataDriven.statCards.periodeTravaux && (
                  <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                    <div className="text-sm font-bold text-sky-700">{content.dataDriven.statCards.periodeTravaux}</div>
                    <div className="text-xs text-slate-500 mt-1">Période travaux ext.</div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ─── EDITORIAL CREDIBILITY ──────────────────────────── */}
        <section className="mb-16">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Méthodologie éditoriale</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les informations de cette page sont compilées à partir de données publiques (INSEE, base SIRENE, cadastre).
              Le profil de bâti est estimé selon les caractéristiques urbaines de {ville.name} et peut varier d&apos;un immeuble à l&apos;autre.
              {content.dataDriven?.statCards.prixM2Quartier
                ? <> Le prix immobilier estimé à {quartierName} ({formatEuro(content.dataDriven.statCards.prixM2Quartier)}/m²) est dérivé des moyennes communales ajustées par époque de construction ({content.profile.eraLabel.toLowerCase()}) et densité urbaine ({content.profile.densityLabel.toLowerCase()}).</>
                : <> Les tarifs sont indicatifs et basés sur des moyennes régionales ({ville.region}).</>
              }{' '}
              ServicesArtisans est un annuaire indépendant — nous ne réalisons pas de travaux et ne garantissons pas les prestations des artisans référencés.
            </p>
            {content.dataDriven?.dataSources && content.dataDriven.dataSources.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                <strong className="text-slate-500">Sources :</strong>{' '}
                {content.dataDriven.dataSources.join(' · ')}.
              </p>
            )}
          </div>
        </section>

        {/* ─── OTHER QUARTIERS ─────────────────────────────── */}
        {quartiers.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                  Autres quartiers à {ville.name}
                </h2>
                <p className="text-sm text-slate-500">{quartiers.length} autres quartiers</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-wrap gap-2.5">
                {quartiers.map(({ name, slug }) => (
                  <Link
                    key={slug}
                    href={`/villes/${villeSlug}/${slug}`}
                    className="bg-gray-50 text-slate-700 px-4 py-2 rounded-full text-sm border border-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── NEARBY VILLES ──────────────────────────────── */}
        {nearbyVilles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Villes proches de {ville.name}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {nearbyVilles.map((v) => (
                <Link key={v.slug} href={`/villes/${v.slug}`} className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-200 p-3.5 hover:border-emerald-300 hover:shadow-md transition-all group">
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 group-hover:text-emerald-600 truncate transition-colors">{v.name}</span>
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
            {content.faqItems.map((item) => (
              <div key={item.question} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{item.question}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(16,185,129,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          {(() => {
            const ctaHash = Math.abs(hashCode(`cta-${villeSlug}-${quartierSlug}`))
            const ctaTemplates = [
              { h: `Besoin d'un artisan à ${quartierName} ?`, p: `Décrivez votre projet et recevez des devis gratuits d'artisans qualifiés à ${ville.name}.` },
              { h: `Travaux sur du ${content.profile.eraLabel.toLowerCase()} à ${quartierName} ?`, p: `Nos artisans connaissent les spécificités du bâti de votre quartier. Devis gratuit et sans engagement.` },
              { h: `Rénovation à ${quartierName}, ${ville.name}`, p: `Trouvez l'artisan adapté au ${content.profile.eraLabel.toLowerCase()} de votre quartier. ${services.length} métiers disponibles.` },
            ]
            const cta = ctaTemplates[ctaHash % ctaTemplates.length]
            return (
              <>
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                  {cta.h}
                </h2>
                <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                  {cta.p}
                </p>
              </>
            )
          })()}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/devis" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300">
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
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Services à {quartierName}</h3>
              <div className="space-y-2">
                {services.slice(0, 6).map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}/${villeSlug}/${quartierSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} à {quartierName}
                  </Link>
                ))}
                {services.slice(6, 10).map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {s.name} à {ville.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Villes en {ville.region}</h3>
              <div className="space-y-2">
                {regionVilles.map((v) => (
                  <Link key={v.slug} href={`/villes/${v.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Artisans à {v.name}
                  </Link>
                ))}
              </div>
              <Link href="/villes" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-3">
                Toutes les villes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                <Link href={`/villes/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Artisans à {ville.name}
                </Link>
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Région {ville.region}
                  </Link>
                )}
                {deptSlug && (
                  <Link href={`/departements/${deptSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {ville.departement} ({ville.departementCode})
                  </Link>
                )}
                <Link href={`/devis/plombier/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Devis plombier à {ville.name}
                </Link>
                <Link href={`/devis/electricien/${villeSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Devis électricien à {ville.name}
                </Link>
                <Link href="/services" className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Tous les services
                </Link>
                <Link href="/devis" className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Demander un devis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Confiance & Sécurité */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Confiance & Sécurité</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/notre-processus-de-verification" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Processus de vérification
            </Link>
            <Link href="/politique-avis" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Politique d&apos;avis
            </Link>
            <Link href="/mediation" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              Médiation
            </Link>
            <Link href="/cgv" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
              CGV
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
