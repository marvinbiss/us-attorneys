import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Shield, Scale, ChevronRight, Users, ArrowRight } from 'lucide-react'
import { getBreadcrumbSchema, getCollectionPageSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SPANISH_SEO_CONFIG } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { states } from '@/lib/data/usa'
import { REVALIDATE } from '@/lib/cache'
import JsonLd from '@/components/JsonLd'

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.staticPages

// ---------------------------------------------------------------------------
// Spanish practice area categories with all 75 entries
// Grouped by legal category for the hub page display
// ---------------------------------------------------------------------------
interface SpanishPA {
  esSlug: string
  esName: string
  enSlug: string
}

const PA_CATEGORIES: { category: string; icon: string; items: SpanishPA[] }[] = [
  {
    category: 'Lesiones Personales',
    icon: 'Shield',
    items: [
      { esSlug: 'lesiones-personales', esName: 'Lesiones Personales', enSlug: 'personal-injury' },
      { esSlug: 'accidentes-de-auto', esName: 'Accidentes de Auto', enSlug: 'car-accidents' },
      { esSlug: 'accidentes-de-camion', esName: 'Accidentes de Camion', enSlug: 'truck-accidents' },
      { esSlug: 'accidentes-de-moto', esName: 'Accidentes de Moto', enSlug: 'motorcycle-accidents' },
      { esSlug: 'caidas-y-resbalones', esName: 'Caidas y Resbalones', enSlug: 'slip-and-fall' },
      { esSlug: 'negligencia-medica', esName: 'Negligencia Medica', enSlug: 'medical-malpractice' },
      { esSlug: 'muerte-injusta', esName: 'Muerte Injusta', enSlug: 'wrongful-death' },
      { esSlug: 'responsabilidad-del-producto', esName: 'Responsabilidad del Producto', enSlug: 'product-liability' },
      { esSlug: 'compensacion-laboral', esName: 'Compensacion Laboral', enSlug: 'workers-compensation' },
      { esSlug: 'abuso-en-asilos', esName: 'Abuso en Asilos', enSlug: 'nursing-home-abuse' },
    ],
  },
  {
    category: 'Defensa Criminal',
    icon: 'Scale',
    items: [
      { esSlug: 'defensa-criminal', esName: 'Defensa Criminal', enSlug: 'criminal-defense' },
      { esSlug: 'dui-dwi', esName: 'DUI y DWI', enSlug: 'dui-dwi' },
      { esSlug: 'delitos-de-drogas', esName: 'Delitos de Drogas', enSlug: 'drug-crimes' },
      { esSlug: 'delitos-de-cuello-blanco', esName: 'Delitos de Cuello Blanco', enSlug: 'white-collar-crime' },
      { esSlug: 'delitos-federales', esName: 'Delitos Federales', enSlug: 'federal-crimes' },
      { esSlug: 'delitos-juveniles', esName: 'Delitos Juveniles', enSlug: 'juvenile-crimes' },
      { esSlug: 'delitos-sexuales', esName: 'Delitos Sexuales', enSlug: 'sex-crimes' },
      { esSlug: 'robo-y-hurto', esName: 'Robo y Hurto', enSlug: 'theft-robbery' },
      { esSlug: 'crimenes-violentos', esName: 'Crimenes Violentos', enSlug: 'violent-crimes' },
      { esSlug: 'infracciones-de-transito', esName: 'Infracciones de Transito', enSlug: 'traffic-violations' },
    ],
  },
  {
    category: 'Derecho Familiar',
    icon: 'Users',
    items: [
      { esSlug: 'divorcio', esName: 'Divorcio', enSlug: 'divorce' },
      { esSlug: 'custodia-de-menores', esName: 'Custodia de Menores', enSlug: 'child-custody' },
      { esSlug: 'manutencion-infantil', esName: 'Manutencion Infantil', enSlug: 'child-support' },
      { esSlug: 'adopcion', esName: 'Adopcion', enSlug: 'adoption' },
      { esSlug: 'pension-alimenticia', esName: 'Pension Alimenticia', enSlug: 'alimony-spousal-support' },
      { esSlug: 'violencia-domestica', esName: 'Violencia Domestica', enSlug: 'domestic-violence' },
      { esSlug: 'acuerdos-prenupciales', esName: 'Acuerdos Prenupciales', enSlug: 'prenuptial-agreements' },
      { esSlug: 'paternidad', esName: 'Paternidad', enSlug: 'paternity' },
      { esSlug: 'derecho-familiar', esName: 'Derecho Familiar', enSlug: 'family-law' },
    ],
  },
  {
    category: 'Derecho Empresarial',
    icon: 'Building',
    items: [
      { esSlug: 'derecho-empresarial', esName: 'Derecho Empresarial', enSlug: 'business-law' },
      { esSlug: 'derecho-corporativo', esName: 'Derecho Corporativo', enSlug: 'corporate-law' },
      { esSlug: 'fusiones-y-adquisiciones', esName: 'Fusiones y Adquisiciones', enSlug: 'mergers-acquisitions' },
      { esSlug: 'derecho-contractual', esName: 'Derecho Contractual', enSlug: 'contract-law' },
      { esSlug: 'litigio-comercial', esName: 'Litigio Comercial', enSlug: 'business-litigation' },
      { esSlug: 'propiedad-intelectual', esName: 'Propiedad Intelectual', enSlug: 'intellectual-property' },
      { esSlug: 'marcas-registradas', esName: 'Marcas Registradas', enSlug: 'trademark' },
      { esSlug: 'patentes', esName: 'Patentes', enSlug: 'patent' },
      { esSlug: 'derechos-de-autor', esName: 'Derechos de Autor', enSlug: 'copyright' },
    ],
  },
  {
    category: 'Inmigracion',
    icon: 'Globe',
    items: [
      { esSlug: 'inmigracion', esName: 'Inmigracion', enSlug: 'immigration-law' },
      { esSlug: 'residencia-permanente', esName: 'Residencia Permanente', enSlug: 'green-cards' },
      { esSlug: 'solicitud-de-visa', esName: 'Solicitud de Visa', enSlug: 'visa-applications' },
      { esSlug: 'defensa-contra-deportacion', esName: 'Defensa contra Deportacion', enSlug: 'deportation-defense' },
      { esSlug: 'asilo', esName: 'Asilo', enSlug: 'asylum' },
      { esSlug: 'ciudadania-naturalizacion', esName: 'Ciudadania y Naturalizacion', enSlug: 'citizenship-naturalization' },
    ],
  },
  {
    category: 'Derecho Inmobiliario',
    icon: 'Home',
    items: [
      { esSlug: 'derecho-inmobiliario', esName: 'Derecho Inmobiliario', enSlug: 'real-estate-law' },
      { esSlug: 'propietario-inquilino', esName: 'Propietario e Inquilino', enSlug: 'landlord-tenant' },
      { esSlug: 'ejecucion-hipotecaria', esName: 'Ejecucion Hipotecaria', enSlug: 'foreclosure' },
      { esSlug: 'zonificacion-uso-de-suelo', esName: 'Zonificacion y Uso de Suelo', enSlug: 'zoning-land-use' },
      { esSlug: 'derecho-de-construccion', esName: 'Derecho de Construccion', enSlug: 'construction-law' },
    ],
  },
  {
    category: 'Planificacion Patrimonial',
    icon: 'FileText',
    items: [
      { esSlug: 'planificacion-patrimonial', esName: 'Planificacion Patrimonial', enSlug: 'estate-planning' },
      { esSlug: 'testamentos-fideicomisos', esName: 'Testamentos y Fideicomisos', enSlug: 'wills-trusts' },
      { esSlug: 'sucesiones', esName: 'Sucesiones', enSlug: 'probate' },
      { esSlug: 'derecho-de-ancianos', esName: 'Derecho de Ancianos', enSlug: 'elder-law' },
      { esSlug: 'tutela-legal', esName: 'Tutela Legal', enSlug: 'guardianship' },
    ],
  },
  {
    category: 'Derecho Laboral',
    icon: 'Briefcase',
    items: [
      { esSlug: 'derecho-laboral', esName: 'Derecho Laboral', enSlug: 'employment-law' },
      { esSlug: 'despido-injustificado', esName: 'Despido Injustificado', enSlug: 'wrongful-termination' },
      { esSlug: 'discriminacion-laboral', esName: 'Discriminacion Laboral', enSlug: 'workplace-discrimination' },
      { esSlug: 'acoso-sexual', esName: 'Acoso Sexual', enSlug: 'sexual-harassment' },
      { esSlug: 'reclamos-salariales', esName: 'Reclamos Salariales', enSlug: 'wage-hour-claims' },
    ],
  },
  {
    category: 'Bancarrota y Deudas',
    icon: 'DollarSign',
    items: [
      { esSlug: 'bancarrota', esName: 'Bancarrota', enSlug: 'bankruptcy' },
      { esSlug: 'capitulo-7', esName: 'Capitulo 7', enSlug: 'chapter-7-bankruptcy' },
      { esSlug: 'capitulo-13', esName: 'Capitulo 13', enSlug: 'chapter-13-bankruptcy' },
      { esSlug: 'alivio-de-deudas', esName: 'Alivio de Deudas', enSlug: 'debt-relief' },
    ],
  },
  {
    category: 'Derecho Fiscal',
    icon: 'Receipt',
    items: [
      { esSlug: 'derecho-fiscal', esName: 'Derecho Fiscal', enSlug: 'tax-law' },
      { esSlug: 'disputas-con-irs', esName: 'Disputas con el IRS', enSlug: 'irs-disputes' },
      { esSlug: 'planificacion-fiscal', esName: 'Planificacion Fiscal', enSlug: 'tax-planning' },
    ],
  },
  {
    category: 'Otras Especialidades',
    icon: 'MoreHorizontal',
    items: [
      { esSlug: 'derecho-del-entretenimiento', esName: 'Derecho del Entretenimiento', enSlug: 'entertainment-law' },
      { esSlug: 'derecho-ambiental', esName: 'Derecho Ambiental', enSlug: 'environmental-law' },
      { esSlug: 'derecho-de-salud', esName: 'Derecho de Salud', enSlug: 'health-care-law' },
      { esSlug: 'derecho-de-seguros', esName: 'Derecho de Seguros', enSlug: 'insurance-law' },
      { esSlug: 'derechos-civiles', esName: 'Derechos Civiles', enSlug: 'civil-rights' },
      { esSlug: 'proteccion-al-consumidor', esName: 'Proteccion al Consumidor', enSlug: 'consumer-protection' },
      { esSlug: 'seguro-social-discapacidad', esName: 'Seguro Social por Discapacidad', enSlug: 'social-security-disability' },
      { esSlug: 'beneficios-para-veteranos', esName: 'Beneficios para Veteranos', enSlug: 'veterans-benefits' },
      { esSlug: 'demanda-colectiva', esName: 'Demanda Colectiva', enSlug: 'class-action' },
      { esSlug: 'apelaciones', esName: 'Apelaciones', enSlug: 'appeals' },
      { esSlug: 'mediacion-arbitraje', esName: 'Mediacion y Arbitraje', enSlug: 'mediation-arbitration' },
    ],
  },
]

// Flatten all PAs for counting
const ALL_PRACTICE_AREAS = PA_CATEGORIES.flatMap(c => c.items)

// Top 15 cities with large Hispanic populations for quick links
const TOP_HISPANIC_CITIES = [
  { name: 'Houston', slug: 'houston', stateCode: 'TX' },
  { name: 'Los Angeles', slug: 'los-angeles', stateCode: 'CA' },
  { name: 'Miami', slug: 'miami', stateCode: 'FL' },
  { name: 'San Antonio', slug: 'san-antonio', stateCode: 'TX' },
  { name: 'Dallas', slug: 'dallas', stateCode: 'TX' },
  { name: 'Chicago', slug: 'chicago', stateCode: 'IL' },
  { name: 'Phoenix', slug: 'phoenix', stateCode: 'AZ' },
  { name: 'New York', slug: 'new-york', stateCode: 'NY' },
  { name: 'San Diego', slug: 'san-diego', stateCode: 'CA' },
  { name: 'El Paso', slug: 'el-paso', stateCode: 'TX' },
  { name: 'San Jose', slug: 'san-jose', stateCode: 'CA' },
  { name: 'Austin', slug: 'austin', stateCode: 'TX' },
  { name: 'Fort Worth', slug: 'fort-worth', stateCode: 'TX' },
  { name: 'Jacksonville', slug: 'jacksonville', stateCode: 'FL' },
  { name: 'Orlando', slug: 'orlando', stateCode: 'FL' },
]

// States with highest Hispanic populations
const TOP_HISPANIC_STATES = ['CA', 'TX', 'FL', 'NY', 'IL', 'AZ', 'NJ', 'CO', 'NM', 'GA', 'NC', 'NV', 'PA', 'WA', 'MD']

export async function generateMetadata(): Promise<Metadata> {
  const title = 'Abogados en Estados Unidos — Directorio de Abogados Verificados'
  const description = `Encuentre abogados verificados en Estados Unidos. ${ALL_PRACTICE_AREAS.length} especialidades legales en los 50 estados. Compare perfiles, lea opiniones y solicite una consulta gratis.`

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const, 'max-video-preview': -1 },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_US',
      url: `${SITE_URL}/abogados`,
      siteName: SPANISH_SEO_CONFIG.siteName,
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/abogados`,
      languages: getAlternateLanguages('/abogados'),
    },
  }
}

export default function AbogadosHubPage() {
  // JSON-LD structured data
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Abogados', url: '/abogados' },
  ])

  const collectionSchema = getCollectionPageSchema({
    name: 'Abogados en Estados Unidos',
    description: `Directorio completo de abogados verificados en Estados Unidos. ${ALL_PRACTICE_AREAS.length} especialidades legales en los 50 estados.`,
    url: '/abogados',
    itemCount: ALL_PRACTICE_AREAS.length,
  })

  const prioritizedStates = states
    .sort((a, b) => {
      const aIdx = TOP_HISPANIC_STATES.indexOf(a.code)
      const bIdx = TOP_HISPANIC_STATES.indexOf(b.code)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return a.name.localeCompare(b.name)
    })

  return (
    <>
      {/* JSON-LD */}
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      {/* Breadcrumbs */}
      <div className="bg-white border-b" lang="es">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Abogados</span>
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
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded">ESPANOL</span>
              <span className="text-blue-200 text-sm">Servicio completo en espanol</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Abogados en Estados Unidos
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl leading-relaxed">
              Directorio completo de abogados verificados por el colegio de abogados. {ALL_PRACTICE_AREAS.length} especialidades legales en los 50 estados. Compare perfiles, lea opiniones y solicite una consulta gratis.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 md:gap-10 mt-10">
              <div className="flex flex-col">
                <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
                  {ALL_PRACTICE_AREAS.length}
                </span>
                <span className="text-sm text-blue-200 mt-1">especialidades legales</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
                  50
                </span>
                <span className="text-sm text-blue-200 mt-1">estados cubiertos</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">
                  100%
                </span>
                <span className="text-sm text-blue-200 mt-1">datos verificados</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Abogados verificados</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Scale className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Consulta gratis</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
                <Users className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Hablan espanol</span>
              </div>
            </div>

            {/* Language switch */}
            <div className="mt-8">
              <Link
                href="/practice-areas"
                className="text-sm text-blue-200 hover:text-white underline transition-colors"
              >
                View in English →
              </Link>
            </div>
          </div>
        </section>

        {/* Quick city links */}
        <section className="py-10 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 tracking-tight">
              Buscar abogados por ciudad
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TOP_HISPANIC_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/abogados/${city.slug}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    <span className="font-medium text-gray-900 group-hover:text-blue-600 truncate text-sm">
                      {city.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">({city.stateCode})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Practice areas by category */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-8 tracking-tight">
              Especialidades legales en espanol
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PA_CATEGORIES.map((cat) => (
                <div key={cat.category} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                  <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Scale className="w-4 h-4 text-blue-600" />
                    </span>
                    {cat.category}
                  </h3>
                  <div className="space-y-1.5">
                    {cat.items.map((pa) => (
                      <Link
                        key={pa.esSlug}
                        href={`/abogados/${pa.esSlug}/houston`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1.5 transition-colors group"
                      >
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                        {pa.esName}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* States listing */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4 tracking-tight">
              Abogados por estado
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Encuentre abogados que hablan espanol en cada estado. Los estados con mayor poblacion hispana aparecen primero.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {prioritizedStates.map((state) => {
                const isHighHispanic = TOP_HISPANIC_STATES.includes(state.code)
                return (
                  <Link
                    key={state.code}
                    href={`/abogados/${state.slug}`}
                    className={`rounded-xl p-4 transition-all group ${
                      isHighHispanic
                        ? 'bg-blue-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-md'
                        : 'bg-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        isHighHispanic ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {state.code}
                      </span>
                      <span className="font-medium text-gray-900 group-hover:text-blue-600 text-sm truncate">
                        {state.name}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Popular specialty + city combinations */}
        <section className="py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 tracking-tight">
              Busquedas populares
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Lesiones Personales</h3>
                <div className="space-y-1.5">
                  {TOP_HISPANIC_CITIES.slice(0, 8).map((city) => (
                    <Link key={`pi-${city.slug}`} href={`/abogados/lesiones-personales/${city.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Lesiones personales en {city.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Inmigracion</h3>
                <div className="space-y-1.5">
                  {TOP_HISPANIC_CITIES.slice(0, 8).map((city) => (
                    <Link key={`imm-${city.slug}`} href={`/abogados/inmigracion/${city.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Inmigracion en {city.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Defensa Criminal</h3>
                <div className="space-y-1.5">
                  {TOP_HISPANIC_CITIES.slice(0, 8).map((city) => (
                    <Link key={`cd-${city.slug}`} href={`/abogados/defensa-criminal/${city.slug}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1 transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Defensa criminal en {city.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Other Spanish intents cross-links */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-6 tracking-tight">
              Mas recursos en espanol
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Costo de abogados</h3>
                <div className="space-y-1.5">
                  {['lesiones-personales', 'inmigracion', 'divorcio', 'defensa-criminal', 'bancarrota'].map((slug) => {
                    const pa = ALL_PRACTICE_AREAS.find(p => p.esSlug === slug)
                    if (!pa) return null
                    return (
                      <Link key={`cost-${slug}`} href={`/costo/${slug}/houston`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        Costo de {pa.esName.toLowerCase()}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Opiniones de abogados</h3>
                <div className="space-y-1.5">
                  {['lesiones-personales', 'inmigracion', 'divorcio', 'defensa-criminal', 'bancarrota'].map((slug) => {
                    const pa = ALL_PRACTICE_AREAS.find(p => p.esSlug === slug)
                    if (!pa) return null
                    return (
                      <Link key={`rev-${slug}`} href={`/opiniones/${slug}/houston`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        Opiniones de {pa.esName.toLowerCase()}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Contratar abogados</h3>
                <div className="space-y-1.5">
                  {['lesiones-personales', 'inmigracion', 'divorcio', 'defensa-criminal', 'bancarrota'].map((slug) => {
                    const pa = ALL_PRACTICE_AREAS.find(p => p.esSlug === slug)
                    if (!pa) return null
                    return (
                      <Link key={`hire-${slug}`} href={`/contratar/${slug}/houston`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        Contratar {pa.esName.toLowerCase()}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Emergencia legal</h3>
                <div className="space-y-1.5">
                  {['lesiones-personales', 'defensa-criminal', 'violencia-domestica', 'dui-dwi', 'inmigracion'].map((slug) => {
                    const pa = ALL_PRACTICE_AREAS.find(p => p.esSlug === slug)
                    if (!pa) return null
                    return (
                      <Link key={`emer-${slug}`} href={`/emergencia/${slug}/houston`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        Emergencia: {pa.esName.toLowerCase()}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informational / why us section */}
        <section className="py-12 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Como funciona nuestro directorio</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Abogados verificados</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Todos los abogados en nuestro directorio estan verificados por el colegio de abogados de su estado. Puede confiar en sus credenciales y licencias.
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Servicio en espanol</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Encuentre abogados que hablan espanol y entienden las necesidades de la comunidad hispana. Servicio bilingue disponible.
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Consulta gratuita</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Solicite una consulta gratuita sin compromiso. Compare perfiles, lea opiniones de otros clientes y tome una decision informada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Necesita un abogado que hable espanol?
            </h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              Obtenga hasta 3 consultas gratuitas de abogados calificados en su area. Sin compromiso.
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
                href="/practice-areas"
                className="text-blue-200 hover:text-white font-medium transition-colors"
              >
                Ver en ingles →
              </Link>
            </div>
          </div>
        </section>

        {/* SEO footer links */}
        <section className="py-10 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Navegacion</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/" className="text-blue-600 hover:text-blue-800">Inicio</Link>
              <Link href="/practice-areas" className="text-blue-600 hover:text-blue-800">Practice Areas (English)</Link>
              <Link href="/states" className="text-blue-600 hover:text-blue-800">States</Link>
              <Link href="/cities" className="text-blue-600 hover:text-blue-800">Cities</Link>
              <Link href="/quotes" className="text-blue-600 hover:text-blue-800">Consulta gratis</Link>
              <Link href="/faq" className="text-blue-600 hover:text-blue-800">FAQ</Link>
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
                Los datos de abogados provienen de fuentes oficiales incluyendo colegios de abogados estatales, registros publicos y fuentes de datos gubernamentales. US Attorneys es un directorio independiente — no proporcionamos servicios legales directamente. Toda la informacion es verificada y actualizada regularmente.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
