import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Shield, Scale, ChevronRight, ArrowRight, Building2 } from 'lucide-react'
import { getBreadcrumbSchema, getCollectionPageSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SPANISH_SEO_CONFIG } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { states, getStateBySlug, getCitiesByState, type City } from '@/lib/data/usa'
import { getAttorneyCountByDepartment, formatAttorneyCount } from '@/lib/data/stats'
import { hashCode } from '@/lib/seo/location-content'
import { REVALIDATE } from '@/lib/cache'
import JsonLd from '@/components/JsonLd'

// ---------------------------------------------------------------------------
// This page handles /abogados/[state] routes.
// The [especialidad] param can be a state slug (e.g., "california", "texas").
// Two-segment routes /abogados/[especialidad]/[ciudad] go to [ciudad]/page.tsx.
// ---------------------------------------------------------------------------

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.locations
export const dynamicParams = false

// Pre-render all 51 state pages at build time
export function generateStaticParams() {
  return states.map((s) => ({ especialidad: s.slug }))
}

// ---------------------------------------------------------------------------
// Spanish practice area data — organized by category for the state hub
// ---------------------------------------------------------------------------
interface SpanishPA {
  esSlug: string
  esName: string
  enSlug: string
  category: string
}

const SPANISH_PRACTICE_AREAS: SpanishPA[] = [
  // Personal Injury
  { esSlug: 'lesiones-personales', esName: 'Lesiones Personales', enSlug: 'personal-injury', category: 'Lesiones Personales' },
  { esSlug: 'accidentes-de-auto', esName: 'Accidentes de Auto', enSlug: 'car-accidents', category: 'Lesiones Personales' },
  { esSlug: 'accidentes-de-camion', esName: 'Accidentes de Camion', enSlug: 'truck-accidents', category: 'Lesiones Personales' },
  { esSlug: 'accidentes-de-moto', esName: 'Accidentes de Moto', enSlug: 'motorcycle-accidents', category: 'Lesiones Personales' },
  { esSlug: 'negligencia-medica', esName: 'Negligencia Medica', enSlug: 'medical-malpractice', category: 'Lesiones Personales' },
  { esSlug: 'muerte-injusta', esName: 'Muerte Injusta', enSlug: 'wrongful-death', category: 'Lesiones Personales' },
  { esSlug: 'compensacion-laboral', esName: 'Compensacion Laboral', enSlug: 'workers-compensation', category: 'Lesiones Personales' },
  // Criminal Defense
  { esSlug: 'defensa-criminal', esName: 'Defensa Criminal', enSlug: 'criminal-defense', category: 'Defensa Criminal' },
  { esSlug: 'dui-dwi', esName: 'DUI y DWI', enSlug: 'dui-dwi', category: 'Defensa Criminal' },
  { esSlug: 'delitos-de-drogas', esName: 'Delitos de Drogas', enSlug: 'drug-crimes', category: 'Defensa Criminal' },
  { esSlug: 'delitos-federales', esName: 'Delitos Federales', enSlug: 'federal-crimes', category: 'Defensa Criminal' },
  { esSlug: 'crimenes-violentos', esName: 'Crimenes Violentos', enSlug: 'violent-crimes', category: 'Defensa Criminal' },
  // Family Law
  { esSlug: 'divorcio', esName: 'Divorcio', enSlug: 'divorce', category: 'Derecho Familiar' },
  { esSlug: 'custodia-de-menores', esName: 'Custodia de Menores', enSlug: 'child-custody', category: 'Derecho Familiar' },
  { esSlug: 'manutencion-infantil', esName: 'Manutencion Infantil', enSlug: 'child-support', category: 'Derecho Familiar' },
  { esSlug: 'adopcion', esName: 'Adopcion', enSlug: 'adoption', category: 'Derecho Familiar' },
  { esSlug: 'violencia-domestica', esName: 'Violencia Domestica', enSlug: 'domestic-violence', category: 'Derecho Familiar' },
  // Immigration
  { esSlug: 'inmigracion', esName: 'Inmigracion', enSlug: 'immigration-law', category: 'Inmigracion' },
  { esSlug: 'residencia-permanente', esName: 'Residencia Permanente', enSlug: 'green-cards', category: 'Inmigracion' },
  { esSlug: 'solicitud-de-visa', esName: 'Solicitud de Visa', enSlug: 'visa-applications', category: 'Inmigracion' },
  { esSlug: 'defensa-contra-deportacion', esName: 'Defensa contra Deportacion', enSlug: 'deportation-defense', category: 'Inmigracion' },
  { esSlug: 'asilo', esName: 'Asilo', enSlug: 'asylum', category: 'Inmigracion' },
  { esSlug: 'ciudadania-naturalizacion', esName: 'Ciudadania y Naturalizacion', enSlug: 'citizenship-naturalization', category: 'Inmigracion' },
  // Business
  { esSlug: 'derecho-empresarial', esName: 'Derecho Empresarial', enSlug: 'business-law', category: 'Derecho Empresarial' },
  { esSlug: 'derecho-corporativo', esName: 'Derecho Corporativo', enSlug: 'corporate-law', category: 'Derecho Empresarial' },
  { esSlug: 'litigio-comercial', esName: 'Litigio Comercial', enSlug: 'business-litigation', category: 'Derecho Empresarial' },
  { esSlug: 'propiedad-intelectual', esName: 'Propiedad Intelectual', enSlug: 'intellectual-property', category: 'Derecho Empresarial' },
  // Real Estate
  { esSlug: 'derecho-inmobiliario', esName: 'Derecho Inmobiliario', enSlug: 'real-estate-law', category: 'Derecho Inmobiliario' },
  { esSlug: 'propietario-inquilino', esName: 'Propietario e Inquilino', enSlug: 'landlord-tenant', category: 'Derecho Inmobiliario' },
  { esSlug: 'ejecucion-hipotecaria', esName: 'Ejecucion Hipotecaria', enSlug: 'foreclosure', category: 'Derecho Inmobiliario' },
  // Estate Planning
  { esSlug: 'planificacion-patrimonial', esName: 'Planificacion Patrimonial', enSlug: 'estate-planning', category: 'Planificacion Patrimonial' },
  { esSlug: 'testamentos-fideicomisos', esName: 'Testamentos y Fideicomisos', enSlug: 'wills-trusts', category: 'Planificacion Patrimonial' },
  { esSlug: 'sucesiones', esName: 'Sucesiones', enSlug: 'probate', category: 'Planificacion Patrimonial' },
  // Employment
  { esSlug: 'derecho-laboral', esName: 'Derecho Laboral', enSlug: 'employment-law', category: 'Derecho Laboral' },
  { esSlug: 'despido-injustificado', esName: 'Despido Injustificado', enSlug: 'wrongful-termination', category: 'Derecho Laboral' },
  { esSlug: 'discriminacion-laboral', esName: 'Discriminacion Laboral', enSlug: 'workplace-discrimination', category: 'Derecho Laboral' },
  { esSlug: 'acoso-sexual', esName: 'Acoso Sexual', enSlug: 'sexual-harassment', category: 'Derecho Laboral' },
  // Bankruptcy
  { esSlug: 'bancarrota', esName: 'Bancarrota', enSlug: 'bankruptcy', category: 'Bancarrota' },
  { esSlug: 'capitulo-7', esName: 'Capitulo 7', enSlug: 'chapter-7-bankruptcy', category: 'Bancarrota' },
  { esSlug: 'capitulo-13', esName: 'Capitulo 13', enSlug: 'chapter-13-bankruptcy', category: 'Bancarrota' },
  // Tax
  { esSlug: 'derecho-fiscal', esName: 'Derecho Fiscal', enSlug: 'tax-law', category: 'Derecho Fiscal' },
  // Other
  { esSlug: 'derechos-civiles', esName: 'Derechos Civiles', enSlug: 'civil-rights', category: 'Otras Especialidades' },
  { esSlug: 'proteccion-al-consumidor', esName: 'Proteccion al Consumidor', enSlug: 'consumer-protection', category: 'Otras Especialidades' },
  { esSlug: 'seguro-social-discapacidad', esName: 'Seguro Social por Discapacidad', enSlug: 'social-security-disability', category: 'Otras Especialidades' },
  { esSlug: 'demanda-colectiva', esName: 'Demanda Colectiva', enSlug: 'class-action', category: 'Otras Especialidades' },
  { esSlug: 'mediacion-arbitraje', esName: 'Mediacion y Arbitraje', enSlug: 'mediation-arbitration', category: 'Otras Especialidades' },
]

// Group practice areas by category
function groupByCategory(pas: SpanishPA[]): Record<string, SpanishPA[]> {
  return pas.reduce((acc, pa) => {
    if (!acc[pa.category]) acc[pa.category] = []
    acc[pa.category].push(pa)
    return acc
  }, {} as Record<string, SpanishPA[]>)
}

// Top 10 most-searched practice areas in Spanish — shown prominently
const TOP_PA_SLUGS = new Set([
  'lesiones-personales', 'accidentes-de-auto', 'defensa-criminal',
  'inmigracion', 'divorcio', 'compensacion-laboral', 'dui-dwi',
  'bancarrota', 'custodia-de-menores', 'derecho-laboral',
])

interface PageProps {
  params: Promise<{ especialidad: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { especialidad: stateSlug } = await params
  const state = getStateBySlug(stateSlug)
  if (!state) return { title: 'No Encontrado', robots: { index: false, follow: false } }

  const attorneyCount = await getAttorneyCountByDepartment(state.name)
  const stateCities = getCitiesByState(state.code)

  const titleHash = Math.abs(hashCode(`es-hub-title-${stateSlug}`))
  const attorneyStr = attorneyCount > 0 ? `${formatAttorneyCount(attorneyCount)} abogados, ` : ''
  const titleTemplates = [
    `Abogados en ${state.name} — Directorio en Espanol`,
    `Encuentre Abogados en ${state.name} (${state.code})`,
    `Abogados en ${state.name} — Consulta Gratis`,
    `${state.name}: Directorio de Abogados Verificados`,
    `Abogados en ${state.name} — ${SPANISH_PRACTICE_AREAS.length} Especialidades`,
  ]
  const title = titleTemplates[titleHash % titleTemplates.length]

  const descHash = Math.abs(hashCode(`es-hub-desc-${stateSlug}`))
  const descTemplates = [
    `Encuentre abogados verificados en ${state.name}. ${attorneyStr}${SPANISH_PRACTICE_AREAS.length} especialidades legales. Consulta gratis, sin compromiso.`,
    `Directorio de abogados en ${state.name} (${state.code}). ${attorneyStr}${stateCities.length} ciudades cubiertas. Consulta gratis.`,
    `${attorneyStr}abogados verificados en ${state.name}. Compare perfiles, lea opiniones. Consulta gratis en espanol.`,
    `Abogados en ${state.name}: ${SPANISH_PRACTICE_AREAS.length} especialidades, ${stateCities.length} ciudades. Verificados por el colegio de abogados. Consulta gratis.`,
    `Busque abogados que hablan espanol en ${state.name}. ${attorneyStr}todas las especialidades. Consulta gratis.`,
  ]
  const description = descTemplates[descHash % descTemplates.length]

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const, 'max-video-preview': -1 },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_US',
      url: `${SITE_URL}/abogados/${stateSlug}`,
      siteName: SPANISH_SEO_CONFIG.siteName,
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/abogados/${stateSlug}`,
      languages: getAlternateLanguages(`/abogados/${stateSlug}`),
    },
  }
}

export default async function AbogadosStatePage({ params }: PageProps) {
  const { especialidad: stateSlug } = await params
  const state = getStateBySlug(stateSlug)
  if (!state) notFound()

  const stateCities = getCitiesByState(state.code)
  const attorneyCount = await getAttorneyCountByDepartment(state.name)
  const paByCategory = groupByCategory(SPANISH_PRACTICE_AREAS)

  // Sort practice areas: top searched first
  const topPAs = SPANISH_PRACTICE_AREAS.filter(pa => TOP_PA_SLUGS.has(pa.esSlug))

  // Sibling states in same region
  const siblingStates = states
    .filter(s => s.region === state.region && s.slug !== state.slug)
    .slice(0, 10)

  // H1 variation
  const h1Hash = Math.abs(hashCode(`es-hub-h1-${stateSlug}`))
  const h1Templates = [
    `Abogados en ${state.name}`,
    `Encuentre un Abogado en ${state.name} (${state.code})`,
    `Directorio de Abogados en ${state.name}`,
    `Abogados en ${state.name} — Hablan Espanol`,
    `${state.name}: Abogados Verificados en Espanol`,
  ]
  const h1Text = h1Templates[h1Hash % h1Templates.length]

  // JSON-LD
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Abogados', url: '/abogados' },
    { name: state.name, url: `/abogados/${stateSlug}` },
  ])

  const collectionSchema = getCollectionPageSchema({
    name: `Abogados en ${state.name}`,
    description: `Directorio de abogados verificados en ${state.name}. ${SPANISH_PRACTICE_AREAS.length} especialidades legales.`,
    url: `/abogados/${stateSlug}`,
    itemCount: SPANISH_PRACTICE_AREAS.length,
  })

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      {/* Breadcrumbs */}
      <div className="bg-white border-b" lang="es">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/abogados" className="hover:text-blue-600">Abogados</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{state.name}</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50" lang="es">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded">ESPANOL</span>
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-lg font-bold">{state.code}</span>
              </div>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              {h1Text}
            </h1>
            <p className="text-lg text-blue-100 max-w-3xl leading-relaxed">
              {attorneyCount > 0
                ? `${formatAttorneyCount(attorneyCount)} abogados verificados en ${state.name}. ${SPANISH_PRACTICE_AREAS.length} especialidades legales, ${stateCities.length} ciudades cubiertas. Consulta gratis.`
                : `Encuentre abogados verificados en ${state.name}. ${SPANISH_PRACTICE_AREAS.length} especialidades legales en ${stateCities.length} ciudades. Consulta gratis.`
              }
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 md:gap-10 mt-8">
              {attorneyCount > 0 && (
                <div className="flex flex-col">
                  <span className="font-heading text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                    {formatAttorneyCount(attorneyCount)}
                  </span>
                  <span className="text-sm text-blue-200 mt-1">abogados verificados</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-heading text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
                  {stateCities.length}
                </span>
                <span className="text-sm text-blue-200 mt-1">ciudades</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">
                  {SPANISH_PRACTICE_AREAS.length}
                </span>
                <span className="text-sm text-blue-200 mt-1">especialidades</span>
              </div>
            </div>

            {/* Trust badges + language switch */}
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Abogados verificados</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Scale className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Consulta gratis</span>
              </div>
              <Link
                href={`/states/${stateSlug}`}
                className="text-sm text-blue-200 hover:text-white underline ml-2 transition-colors"
              >
                View in English →
              </Link>
            </div>
          </div>
        </section>

        {/* Top practice areas */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 tracking-tight">
              Especialidades mas buscadas en {state.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {topPAs.map((pa) => {
                const firstCity = stateCities[0]?.slug || 'houston'
                return (
                  <Link
                    key={pa.esSlug}
                    href={`/abogados/${pa.esSlug}/${firstCity}`}
                    className="bg-white rounded-xl border-2 border-blue-100 p-4 text-center hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <span className="font-semibold text-gray-800 group-hover:text-blue-600 text-sm block">
                      {pa.esName}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 block">en {state.code}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Cities in this state */}
        {stateCities.length > 0 && (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900 tracking-tight">
                    Ciudades principales en {state.name}
                  </h2>
                  <p className="text-sm text-gray-500">{stateCities.length} ciudades con abogados</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stateCities.map((city: City) => (
                  <div key={city.slug} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      {city.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {topPAs.slice(0, 4).map((pa) => (
                        <Link
                          key={`${pa.esSlug}-${city.slug}`}
                          href={`/abogados/${pa.esSlug}/${city.slug}`}
                          className="text-xs text-gray-600 hover:text-blue-600 px-2 py-1 bg-white rounded border border-gray-100 hover:border-blue-200 transition-colors"
                        >
                          {pa.esName}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={`/cities/${city.slug}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                    >
                      Ver todos <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All practice areas by category */}
        <section className="py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 tracking-tight">
              Todas las especialidades legales en {state.name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(paByCategory).map(([category, pas]) => {
                const firstCity = stateCities[0]?.slug || 'houston'
                return (
                  <div key={category} className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-blue-600" />
                      {category}
                    </h3>
                    <div className="space-y-1.5">
                      {pas.map((pa) => (
                        <Link
                          key={pa.esSlug}
                          href={`/abogados/${pa.esSlug}/${firstCity}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors group"
                        >
                          <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                          {pa.esName}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Specialty x City cross-links for top combos */}
        {stateCities.length > 0 && (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-6 tracking-tight">
                Especialidades por ciudad en {state.name}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stateCities.slice(0, 9).map((city: City) => (
                  <div key={city.slug} className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                    <h3 className="font-heading font-semibold text-gray-900 mb-3">Abogados en {city.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {topPAs.map((pa) => (
                        <Link
                          key={`cross-${pa.esSlug}-${city.slug}`}
                          href={`/abogados/${pa.esSlug}/${city.slug}`}
                          className="text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        >
                          {pa.esName}
                        </Link>
                      ))}
                    </div>
                    <Link href={`/cities/${city.slug}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium mt-3">
                      Todos los abogados <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other Spanish intent cross-links */}
        <section className="py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6 tracking-tight">
              Mas recursos en espanol para {state.name}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Costo de abogados</h3>
                <div className="space-y-1.5">
                  {stateCities.slice(0, 5).map((city: City) => (
                    <Link key={`cost-${city.slug}`} href={`/costo/lesiones-personales/${city.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Costo de abogado en {city.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Opiniones de abogados</h3>
                <div className="space-y-1.5">
                  {stateCities.slice(0, 5).map((city: City) => (
                    <Link key={`rev-${city.slug}`} href={`/opiniones/lesiones-personales/${city.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Opiniones de abogados en {city.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Emergencia legal</h3>
                <div className="space-y-1.5">
                  {stateCities.slice(0, 5).map((city: City) => (
                    <Link key={`emer-${city.slug}`} href={`/emergencia/defensa-criminal/${city.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Emergencia legal en {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sibling states */}
        {siblingStates.length > 0 && (
          <section className="py-12 bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="font-heading text-xl font-bold text-gray-900 tracking-tight">
                  Otros estados en {state.region}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {siblingStates.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/abogados/${s.slug}`}
                    className="bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-gray-700 hover:text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    {s.name} ({s.code})
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Necesita un abogado en {state.name}?
            </h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              Obtenga hasta 3 consultas gratuitas de abogados calificados. Sin compromiso.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quotes"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-8 py-4 rounded-xl shadow-lg transition-colors"
              >
                Solicitar consulta gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href={`/states/${stateSlug}`}
                className="text-blue-200 hover:text-white font-medium transition-colors"
              >
                Ver en ingles →
              </Link>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="py-10 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Navegacion</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/abogados" className="text-blue-600 hover:text-blue-800">Todos los abogados</Link>
              <Link href={`/states/${stateSlug}`} className="text-blue-600 hover:text-blue-800">{state.name} (English)</Link>
              <Link href="/states" className="text-blue-600 hover:text-blue-800">All States</Link>
              <Link href="/quotes" className="text-blue-600 hover:text-blue-800">Consulta gratis</Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contacto</Link>
            </div>
          </div>
        </section>

        {/* Editorial methodology */}
        <section className="pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Metodologia editorial</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Los datos de abogados en {state.name} provienen de fuentes oficiales incluyendo el colegio de abogados de {state.name}, registros publicos y fuentes gubernamentales. US Attorneys es un directorio independiente — no proporcionamos servicios legales directamente.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
