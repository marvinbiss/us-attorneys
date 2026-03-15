import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ArrowRight, Shield, Clock, ChevronRight, Wrench, HelpCircle, Euro, CheckCircle, Building2, Users, Thermometer } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import { getBreadcrumbSchema, getFAQSchema, getServiceSchema } from '@/lib/seo/jsonld'
import { states, getStateBySlug, getCitiesByState, services, getRegionSlugByName } from '@/lib/data/usa'
import { getTradeContent, getTradesSlugs } from '@/lib/data/trade-content'
import { generateDepartementContent, hashCode, getRegionalMultiplier } from '@/lib/seo/location-content'
import { getServiceImage } from '@/lib/data/images'
import PriceTable from '@/components/seo/PriceTable'

const topServices = ['plombier', 'electricien', 'serrurier', 'chauffagiste', 'couvreur']

export function generateStaticParams() {
  return states.flatMap(d =>
    topServices.map(s => ({ departement: d.slug, service: s }))
  )
}

export const dynamicParams = true
export const revalidate = 86400

interface PageProps {
  params: Promise<{ departement: string; service: string }>
}

function truncateTitle(title: string, maxLen = 42): string {
  if (title.length <= maxLen) return title
  return title.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…'
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { departement: deptSlug, service: specialtySlug } = await params
  const dept = getStateBySlug(deptSlug)
  const trade = getTradeContent(specialtySlug)
  if (!dept || !trade) return { title: 'Page non trouvée' }

  const multiplier = getRegionalMultiplier(dept.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)

  const titleHash = Math.abs(hashCode(`title-dept-svc-${deptSlug}-${specialtySlug}`))
  const titleTemplates = [
    `${trade.name} ${dept.name} (${dept.code})`,
    `${trade.name} ${dept.name} — Devis gratuit`,
    `${trade.name} dans le ${dept.code} — Devis`,
    `${trade.name} ${dept.code} : tarifs et devis`,
    `${trade.name} ${dept.name} — Artisans vérifiés`,
  ]
  const title = truncateTitle(titleTemplates[titleHash % titleTemplates.length])

  const descHash = Math.abs(hashCode(`desc-dept-svc-${deptSlug}-${specialtySlug}`))
  const descTemplates = [
    `Trouvez un ${trade.name.toLowerCase()} qualifié dans le ${dept.name} (${dept.code}). Tarif moyen : ${minPrice}–${maxPrice} ${trade.priceRange.unit}. Devis gratuit, artisans vérifiés.`,
    `${trade.name} en ${dept.name} : comparez les devis de professionnels référencés SIREN. ${minPrice} à ${maxPrice} ${trade.priceRange.unit}. Devis gratuit.`,
    `Besoin d'un ${trade.name.toLowerCase()} dans le ${dept.code} ? ${minPrice}–${maxPrice} ${trade.priceRange.unit}. Artisans certifiés, devis gratuits en ligne.`,
    `${dept.name} (${dept.code}) : ${trade.name.toLowerCase()} disponible. Tarifs de ${minPrice} à ${maxPrice} ${trade.priceRange.unit}. Comparez gratuitement.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  const serviceImage = getServiceImage(specialtySlug)

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/states/${deptSlug}/${specialtySlug}` },
    openGraph: {
      locale: 'fr_FR',
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/states/${deptSlug}/${specialtySlug}`,
      images: [{ url: serviceImage.src, width: 800, height: 600, alt: `${trade.name} en ${dept.name}` }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [serviceImage.src],
    },
  }
}

export default async function DeptServicePage({ params }: PageProps) {
  const { departement: deptSlug, service: specialtySlug } = await params
  const dept = getStateBySlug(deptSlug)
  const trade = getTradeContent(specialtySlug)
  if (!dept || !trade) notFound()

  const content = generateDepartementContent(dept)
  const villesDuDepartement = getCitiesByState(dept.code)
  const regionSlug = getRegionSlugByName(dept.region)
  const multiplier = getRegionalMultiplier(dept.region)
  const minPrice = Math.round(trade.priceRange.min * multiplier)
  const maxPrice = Math.round(trade.priceRange.max * multiplier)
  const serviceMeta = services.find(s => s.slug === specialtySlug)

  // Other services in this dept
  const allTradeSlugs = getTradesSlugs()
  const otherServices = allTradeSlugs
    .filter(s => s !== specialtySlug)
    .slice(0, 8)
    .map(s => {
      const t = getTradeContent(s)
      return t ? { slug: s, name: t.name } : null
    })
    .filter(Boolean) as { slug: string; name: string }[]

  // Sibling depts with same service
  const siblingDepts = states
    .filter(d => d.region === dept.region && d.slug !== dept.slug)
    .slice(0, 8)

  // Hash-selected tips
  const selectedTips = trade.tips
    .map((tip, i) => ({ tip, score: Math.abs(hashCode(`tip-${i}-${deptSlug}`)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(t => t.tip)

  // Hash-selected FAQ
  const tradeFaq = trade.faq
    .map((f, i) => ({ ...f, score: Math.abs(hashCode(`faq-${i}-${deptSlug}`)) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
  const deptFaq = content.faqItems.slice(0, 2)
  const allFaq = [
    ...tradeFaq.map(f => ({ question: f.q, answer: f.a })),
    ...deptFaq,
  ]

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Départements', url: '/states' },
    { name: `${dept.name} (${dept.code})`, url: `/states/${deptSlug}` },
    { name: trade.name, url: `/states/${deptSlug}/${specialtySlug}` },
  ])

  const faqSchema = getFAQSchema(allFaq)

  const serviceSchema = getServiceSchema({
    name: `${trade.name} en ${dept.name}`,
    description: `Service de ${trade.name.toLowerCase()} dans le ${dept.name} (${dept.code}). Tarif moyen : ${minPrice}–${maxPrice} ${trade.priceRange.unit}.`,
    areaServed: dept.name,
    category: trade.name,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, faqSchema, serviceSchema]} />

      {/* ─── DARK HERO ──────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
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
          <div className="mb-10">
            <Breadcrumb
              items={[
                { label: 'Départements', href: '/states' },
                ...(regionSlug ? [{ label: dept.region, href: `/regions/${regionSlug}` }] : []),
                { label: `${dept.name} (${dept.code})`, href: `/states/${deptSlug}` },
                { label: trade.name },
              ]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/15 backdrop-blur-sm rounded-full border border-indigo-400/25">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-200">{serviceMeta?.name || trade.name}</span>
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

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-500/15 backdrop-blur rounded-2xl flex items-center justify-center border border-indigo-400/20">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">{dept.code}</span>
              </div>
              <div>
                {(() => {
                  const h1Hash = Math.abs(hashCode(`h1-dept-svc-${deptSlug}-${specialtySlug}`))
                  const h1Templates = [
                    `${trade.name} dans le ${dept.name}`,
                    `Trouver un ${trade.name.toLowerCase()} en ${dept.name}`,
                    `${trade.name} ${dept.name} (${dept.code})`,
                    `${dept.name} : votre ${trade.name.toLowerCase()} qualifié`,
                    `${trade.name} dans le ${dept.code} — ${dept.name}`,
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
              Trouvez un {trade.name.toLowerCase()} qualifié dans le {dept.name} ({dept.code}). Tarif moyen régional : {minPrice} à {maxPrice} {trade.priceRange.unit}. {content.profile.climateLabel}, {content.profile.housingLabel.toLowerCase()}.
            </p>

            <div className="flex flex-wrap gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>Chef-lieu : {dept.capital}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{dept.population} habitants</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{villesDuDepartement.length || dept.cities.length} cities</span>
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
        {/* ─── SERVICE OVERVIEW ──────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                {trade.name} dans le {dept.name}
              </h2>
              <p className="text-sm text-slate-500">Prestations courantes et certifications</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <PriceTable tasks={trade.commonTasks.slice(0, 6)} tradeName={trade.name} priceRange={{ min: minPrice, max: maxPrice, unit: trade.priceRange.unit }} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Certifications recommandées</h3>
              <ul className="space-y-3">
                {trade.certifications.map((cert, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <Shield className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400 mt-4">Délai moyen : {trade.averageResponseTime}</p>
            </div>
          </div>
        </section>

        {/* ─── DEPT PROFILE ─────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Thermometer className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Profil du {dept.name}
              </h2>
              <p className="text-sm text-slate-500">{content.profile.climateLabel} · {content.profile.economyLabel}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-cyan-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-cyan-700 uppercase tracking-wider mb-1">Climat</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.climateLabel}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Habitat</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.housingLabel}</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">Économie</div>
                <div className="text-sm text-slate-800 font-medium">{content.profile.economyLabel}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Population</div>
                <div className="text-sm text-slate-800 font-medium">{dept.population} habitants</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── REGIONAL PRICING ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Euro className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                Tarifs {trade.name.toLowerCase()} dans le {dept.name}
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
            <p className="text-sm text-slate-500">Les tarifs dans le {dept.name} sont {multiplier >= 1.05 ? 'supérieurs' : multiplier <= 0.95 ? 'inférieurs' : 'proches de'} la moyenne nationale (coefficient {multiplier.toFixed(2)}). Ces prix sont indicatifs et varient selon la complexité de l&apos;intervention.</p>
          </div>
        </section>

        {/* ─── CITIES GRID ──────────────────────────────────── */}
        {villesDuDepartement.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                  {trade.name} par ville dans le {dept.name}
                </h2>
                <p className="text-sm text-slate-500">{villesDuDepartement.length} cities référencées</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {villesDuDepartement.map((ville) => (
                <Link
                  key={ville.slug}
                  href={`/practice-areas/${specialtySlug}/${ville.slug}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-300 hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm truncate">{trade.name} à {ville.name}</div>
                      <div className="text-xs text-slate-400">{ville.population} hab.</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── TIPS ─────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Conseils pour choisir votre {trade.name.toLowerCase()}
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

        {/* ─── RELATED SERVICES ─────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
              Autres artisans dans le {dept.name}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {otherServices.map((s) => (
              <Link
                key={s.slug}
                href={`/states/${deptSlug}/${s.slug}`}
                className="bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {s.name}
              </Link>
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

        {/* ─── SIBLING DEPTS ────────────────────────────────── */}
        {siblingDepts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                {trade.name} dans les départements voisins
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {siblingDepts.map((d) => (
                <Link key={d.slug} href={`/states/${d.slug}/${specialtySlug}`} className="bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  {d.name} ({d.code})
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Besoin d&apos;un {trade.name.toLowerCase()} dans le {dept.name} ?
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
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">{trade.name} par ville</h3>
              <div className="space-y-2">
                {villesDuDepartement.slice(0, 6).map((v) => (
                  <Link key={v.slug} href={`/practice-areas/${specialtySlug}/${v.slug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {trade.name} à {v.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Département {dept.name}</h3>
              <div className="space-y-2">
                <Link href={`/states/${deptSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />
                  Tous les artisans du {dept.name}
                </Link>
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}/${specialtySlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    {trade.name} en {dept.region}
                  </Link>
                )}
                {regionSlug && (
                  <Link href={`/regions/${regionSlug}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                    <ChevronRight className="w-3 h-3" />
                    Artisans en {dept.region}
                  </Link>
                )}
              </div>
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
                <Link href="/states" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Tous les départements
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
              Les tarifs indiqués sont des estimations basées sur les données nationales ajustées par un coefficient régional. Les données démographiques proviennent de l&apos;INSEE. ServicesArtisans est un annuaire indépendant — nous ne réalisons pas de travaux.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
