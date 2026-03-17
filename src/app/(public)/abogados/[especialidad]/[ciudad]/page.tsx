import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSpecialtyBySlug,
  getAttorneysByServiceAndLocation,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { practiceAreas as staticPracticeAreas, getCityBySlug, getStateByCode } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { hashCode } from '@/lib/seo/location-content'
import { getServiceImage } from '@/lib/data/images'
import { getAttorneyUrl } from '@/lib/utils'
import type { Location as LocationType, Provider } from '@/types'
import { REVALIDATE } from '@/lib/cache'

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.attorneyProfile
export const dynamicParams = true

// ---------------------------------------------------------------------------
// Spanish ↔ English practice area slug mapping (75 entries)
// ---------------------------------------------------------------------------
const SPANISH_PA_MAP: Record<string, { esSlug: string; esName: string; enSlug: string }> = {
  'lesiones-personales': { esSlug: 'lesiones-personales', esName: 'Lesiones Personales', enSlug: 'personal-injury' },
  'accidentes-de-auto': { esSlug: 'accidentes-de-auto', esName: 'Accidentes de Auto', enSlug: 'car-accidents' },
  'accidentes-de-camion': { esSlug: 'accidentes-de-camion', esName: 'Accidentes de Camión', enSlug: 'truck-accidents' },
  'accidentes-de-moto': { esSlug: 'accidentes-de-moto', esName: 'Accidentes de Moto', enSlug: 'motorcycle-accidents' },
  'caidas-y-resbalones': { esSlug: 'caidas-y-resbalones', esName: 'Caídas y Resbalones', enSlug: 'slip-and-fall' },
  'negligencia-medica': { esSlug: 'negligencia-medica', esName: 'Negligencia Médica', enSlug: 'medical-malpractice' },
  'muerte-injusta': { esSlug: 'muerte-injusta', esName: 'Muerte Injusta', enSlug: 'wrongful-death' },
  'responsabilidad-del-producto': { esSlug: 'responsabilidad-del-producto', esName: 'Responsabilidad del Producto', enSlug: 'product-liability' },
  'compensacion-laboral': { esSlug: 'compensacion-laboral', esName: 'Compensación Laboral', enSlug: 'workers-compensation' },
  'abuso-en-asilos': { esSlug: 'abuso-en-asilos', esName: 'Abuso en Asilos', enSlug: 'nursing-home-abuse' },
  'defensa-criminal': { esSlug: 'defensa-criminal', esName: 'Defensa Criminal', enSlug: 'criminal-defense' },
  'dui-dwi': { esSlug: 'dui-dwi', esName: 'DUI y DWI', enSlug: 'dui-dwi' },
  'delitos-de-drogas': { esSlug: 'delitos-de-drogas', esName: 'Delitos de Drogas', enSlug: 'drug-crimes' },
  'delitos-de-cuello-blanco': { esSlug: 'delitos-de-cuello-blanco', esName: 'Delitos de Cuello Blanco', enSlug: 'white-collar-crime' },
  'delitos-federales': { esSlug: 'delitos-federales', esName: 'Delitos Federales', enSlug: 'federal-crimes' },
  'delitos-juveniles': { esSlug: 'delitos-juveniles', esName: 'Delitos Juveniles', enSlug: 'juvenile-crimes' },
  'delitos-sexuales': { esSlug: 'delitos-sexuales', esName: 'Delitos Sexuales', enSlug: 'sex-crimes' },
  'robo-y-hurto': { esSlug: 'robo-y-hurto', esName: 'Robo y Hurto', enSlug: 'theft-robbery' },
  'crimenes-violentos': { esSlug: 'crimenes-violentos', esName: 'Crímenes Violentos', enSlug: 'violent-crimes' },
  'infracciones-de-transito': { esSlug: 'infracciones-de-transito', esName: 'Infracciones de Tránsito', enSlug: 'traffic-violations' },
  'divorcio': { esSlug: 'divorcio', esName: 'Divorcio', enSlug: 'divorce' },
  'custodia-de-menores': { esSlug: 'custodia-de-menores', esName: 'Custodia de Menores', enSlug: 'child-custody' },
  'manutencion-infantil': { esSlug: 'manutencion-infantil', esName: 'Manutención Infantil', enSlug: 'child-support' },
  'adopcion': { esSlug: 'adopcion', esName: 'Adopción', enSlug: 'adoption' },
  'pension-alimenticia': { esSlug: 'pension-alimenticia', esName: 'Pensión Alimenticia', enSlug: 'alimony-spousal-support' },
  'violencia-domestica': { esSlug: 'violencia-domestica', esName: 'Violencia Doméstica', enSlug: 'domestic-violence' },
  'acuerdos-prenupciales': { esSlug: 'acuerdos-prenupciales', esName: 'Acuerdos Prenupciales', enSlug: 'prenuptial-agreements' },
  'paternidad': { esSlug: 'paternidad', esName: 'Paternidad', enSlug: 'paternity' },
  'derecho-empresarial': { esSlug: 'derecho-empresarial', esName: 'Derecho Empresarial', enSlug: 'business-law' },
  'derecho-corporativo': { esSlug: 'derecho-corporativo', esName: 'Derecho Corporativo', enSlug: 'corporate-law' },
  'fusiones-y-adquisiciones': { esSlug: 'fusiones-y-adquisiciones', esName: 'Fusiones y Adquisiciones', enSlug: 'mergers-acquisitions' },
  'derecho-contractual': { esSlug: 'derecho-contractual', esName: 'Derecho Contractual', enSlug: 'contract-law' },
  'litigio-comercial': { esSlug: 'litigio-comercial', esName: 'Litigio Comercial', enSlug: 'business-litigation' },
  'propiedad-intelectual': { esSlug: 'propiedad-intelectual', esName: 'Propiedad Intelectual', enSlug: 'intellectual-property' },
  'marcas-registradas': { esSlug: 'marcas-registradas', esName: 'Marcas Registradas', enSlug: 'trademark' },
  'patentes': { esSlug: 'patentes', esName: 'Patentes', enSlug: 'patent' },
  'derechos-de-autor': { esSlug: 'derechos-de-autor', esName: 'Derechos de Autor', enSlug: 'copyright' },
  'derecho-inmobiliario': { esSlug: 'derecho-inmobiliario', esName: 'Derecho Inmobiliario', enSlug: 'real-estate-law' },
  'propietario-inquilino': { esSlug: 'propietario-inquilino', esName: 'Propietario e Inquilino', enSlug: 'landlord-tenant' },
  'ejecucion-hipotecaria': { esSlug: 'ejecucion-hipotecaria', esName: 'Ejecución Hipotecaria', enSlug: 'foreclosure' },
  'zonificacion-uso-de-suelo': { esSlug: 'zonificacion-uso-de-suelo', esName: 'Zonificación y Uso de Suelo', enSlug: 'zoning-land-use' },
  'derecho-de-construccion': { esSlug: 'derecho-de-construccion', esName: 'Derecho de Construcción', enSlug: 'construction-law' },
  'inmigracion': { esSlug: 'inmigracion', esName: 'Inmigración', enSlug: 'immigration-law' },
  'residencia-permanente': { esSlug: 'residencia-permanente', esName: 'Residencia Permanente', enSlug: 'green-cards' },
  'solicitud-de-visa': { esSlug: 'solicitud-de-visa', esName: 'Solicitud de Visa', enSlug: 'visa-applications' },
  'defensa-contra-deportacion': { esSlug: 'defensa-contra-deportacion', esName: 'Defensa contra Deportación', enSlug: 'deportation-defense' },
  'asilo': { esSlug: 'asilo', esName: 'Asilo', enSlug: 'asylum' },
  'ciudadania-naturalizacion': { esSlug: 'ciudadania-naturalizacion', esName: 'Ciudadanía y Naturalización', enSlug: 'citizenship-naturalization' },
  'planificacion-patrimonial': { esSlug: 'planificacion-patrimonial', esName: 'Planificación Patrimonial', enSlug: 'estate-planning' },
  'testamentos-fideicomisos': { esSlug: 'testamentos-fideicomisos', esName: 'Testamentos y Fideicomisos', enSlug: 'wills-trusts' },
  'sucesiones': { esSlug: 'sucesiones', esName: 'Sucesiones', enSlug: 'probate' },
  'derecho-de-ancianos': { esSlug: 'derecho-de-ancianos', esName: 'Derecho de Ancianos', enSlug: 'elder-law' },
  'tutela-legal': { esSlug: 'tutela-legal', esName: 'Tutela Legal', enSlug: 'guardianship' },
  'derecho-laboral': { esSlug: 'derecho-laboral', esName: 'Derecho Laboral', enSlug: 'employment-law' },
  'despido-injustificado': { esSlug: 'despido-injustificado', esName: 'Despido Injustificado', enSlug: 'wrongful-termination' },
  'discriminacion-laboral': { esSlug: 'discriminacion-laboral', esName: 'Discriminación Laboral', enSlug: 'workplace-discrimination' },
  'acoso-sexual': { esSlug: 'acoso-sexual', esName: 'Acoso Sexual', enSlug: 'sexual-harassment' },
  'reclamos-salariales': { esSlug: 'reclamos-salariales', esName: 'Reclamos Salariales', enSlug: 'wage-hour-claims' },
  'bancarrota': { esSlug: 'bancarrota', esName: 'Bancarrota', enSlug: 'bankruptcy' },
  'capitulo-7': { esSlug: 'capitulo-7', esName: 'Capítulo 7', enSlug: 'chapter-7-bankruptcy' },
  'capitulo-13': { esSlug: 'capitulo-13', esName: 'Capítulo 13', enSlug: 'chapter-13-bankruptcy' },
  'alivio-de-deudas': { esSlug: 'alivio-de-deudas', esName: 'Alivio de Deudas', enSlug: 'debt-relief' },
  'derecho-fiscal': { esSlug: 'derecho-fiscal', esName: 'Derecho Fiscal', enSlug: 'tax-law' },
  'disputas-con-irs': { esSlug: 'disputas-con-irs', esName: 'Disputas con el IRS', enSlug: 'irs-disputes' },
  'planificacion-fiscal': { esSlug: 'planificacion-fiscal', esName: 'Planificación Fiscal', enSlug: 'tax-planning' },
  'derecho-del-entretenimiento': { esSlug: 'derecho-del-entretenimiento', esName: 'Derecho del Entretenimiento', enSlug: 'entertainment-law' },
  'derecho-ambiental': { esSlug: 'derecho-ambiental', esName: 'Derecho Ambiental', enSlug: 'environmental-law' },
  'derecho-de-salud': { esSlug: 'derecho-de-salud', esName: 'Derecho de Salud', enSlug: 'health-care-law' },
  'derecho-de-seguros': { esSlug: 'derecho-de-seguros', esName: 'Derecho de Seguros', enSlug: 'insurance-law' },
  'derechos-civiles': { esSlug: 'derechos-civiles', esName: 'Derechos Civiles', enSlug: 'civil-rights' },
  'proteccion-al-consumidor': { esSlug: 'proteccion-al-consumidor', esName: 'Protección al Consumidor', enSlug: 'consumer-protection' },
  'seguro-social-discapacidad': { esSlug: 'seguro-social-discapacidad', esName: 'Seguro Social por Discapacidad', enSlug: 'social-security-disability' },
  'beneficios-para-veteranos': { esSlug: 'beneficios-para-veteranos', esName: 'Beneficios para Veteranos', enSlug: 'veterans-benefits' },
  'demanda-colectiva': { esSlug: 'demanda-colectiva', esName: 'Demanda Colectiva', enSlug: 'class-action' },
  'apelaciones': { esSlug: 'apelaciones', esName: 'Apelaciones', enSlug: 'appeals' },
  'mediacion-arbitraje': { esSlug: 'mediacion-arbitraje', esName: 'Mediación y Arbitraje', enSlug: 'mediation-arbitration' },
  'derecho-familiar': { esSlug: 'derecho-familiar', esName: 'Derecho Familiar', enSlug: 'family-law' },
}

// 1 seed page — ISR 24h handles the rest (dynamicParams = true)
export function generateStaticParams() {
  return [{ especialidad: 'lesiones-personales', ciudad: 'houston' }]
}

function safeJsonStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

/** Resolve city from static data */
function cityToLocation(slug: string): LocationType | null {
  const cityData = getCityBySlug(slug)
  if (!cityData) return null
  return {
    id: '',
    name: cityData.name,
    slug: cityData.slug,
    postal_code: cityData.zipCode,
    region_name: getStateByCode(cityData.stateCode)?.region || '',
    department_name: cityData.stateName,
    department_code: cityData.stateCode,
    is_active: true,
    created_at: '',
  }
}

interface PageProps {
  params: Promise<{ especialidad: string; ciudad: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { especialidad, ciudad } = await params

  const esEntry = SPANISH_PA_MAP[especialidad]
  if (!esEntry) return { title: 'No Encontrado', robots: { index: false, follow: false } }

  const enSlug = esEntry.enSlug
  let specialtyName = esEntry.esName
  let locationName = ''
  let departmentCode = ''
  let attorneyCount = 1

  try {
    const [service, count] = await Promise.all([
      getSpecialtyBySlug(enSlug),
      getAttorneyCountByServiceAndLocation(enSlug, ciudad),
    ])
    if (service) specialtyName = esEntry.esName
    attorneyCount = count
  } catch {
    attorneyCount = 1
  }

  const fallbackCity = getCityBySlug(ciudad)
  if (fallbackCity) {
    locationName = fallbackCity.name
    departmentCode = fallbackCity.stateCode
  }

  if (!locationName) return { title: 'No Encontrado', robots: { index: false, follow: false } }

  const seoHash = Math.abs(hashCode(`es-seo-${especialidad}-${ciudad}`))

  const titleVariants = attorneyCount > 0
    ? [
        `Abogados de ${specialtyName} en ${locationName} — Consulta Gratis`,
        `${specialtyName} en ${locationName} — ${attorneyCount} Abogados Verificados`,
        `Abogados de ${specialtyName} en ${locationName}${departmentCode ? ` (${departmentCode})` : ''}`,
        `${specialtyName} ${locationName} — Comparar Abogados`,
        `Mejores Abogados de ${specialtyName} en ${locationName}`,
      ]
    : [
        `Abogados de ${specialtyName} en ${locationName} — Directorio`,
        `${specialtyName} en ${locationName} — Consulta Gratis`,
        `Abogados de ${specialtyName} en ${locationName}${departmentCode ? ` (${departmentCode})` : ''}`,
        `${specialtyName} ${locationName} — Abogados Calificados`,
        `Buscar Abogado de ${specialtyName} en ${locationName}`,
      ]

  const title = titleVariants[seoHash % titleVariants.length]

  const descHash = Math.abs(hashCode(`es-desc-${especialidad}-${ciudad}`))
  const descVariants = attorneyCount > 0
    ? [
        `${attorneyCount} abogados verificados de ${specialtyName.toLowerCase()} en ${locationName}. Compare perfiles, honorarios y opiniones. Consulta gratis.`,
        `Encuentre el mejor abogado de ${specialtyName.toLowerCase()} en ${locationName} entre ${attorneyCount} profesionales verificados. Consulta gratis.`,
        `${specialtyName} en ${locationName}: ${attorneyCount} abogados verificados. Compare y solicite una consulta gratis sin compromiso.`,
        `¿Necesita un abogado de ${specialtyName.toLowerCase()} en ${locationName}? ${attorneyCount} abogados verificados. Consulta gratis.`,
        `Abogados de ${specialtyName.toLowerCase()} en ${locationName} (${departmentCode}). ${attorneyCount} profesionales verificados. Consulta gratis.`,
      ]
    : [
        `Encuentre un abogado calificado de ${specialtyName.toLowerCase()} en ${locationName}. Abogados verificados. Consulta gratis.`,
        `${specialtyName} en ${locationName}: abogados verificados por el colegio de abogados. Consulta gratis.`,
        `¿Necesita un abogado de ${specialtyName.toLowerCase()} en ${locationName}? Directorio de abogados verificados. Consulta gratis.`,
        `${specialtyName} en ${locationName}. Profesionales verificados. Consulta gratuita e inmediata.`,
        `${locationName}: encuentre un abogado de ${specialtyName.toLowerCase()} de confianza. Consulta gratis.`,
      ]

  const description = descVariants[descHash % descVariants.length]

  return {
    title,
    description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_US',
      images: [{ url: getServiceImage(enSlug).src, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getServiceImage(enSlug).src],
    },
    alternates: {
      canonical: `${SITE_URL}/abogados/${especialidad}/${ciudad}`,
      languages: {
        'en': `${SITE_URL}/practice-areas/${enSlug}/${ciudad}`,
        'es': `${SITE_URL}/abogados/${especialidad}/${ciudad}`,
      },
    },
  }
}

function generateJsonLd(
  esName: string,
  _enSlug: string,
  especialidad: string,
  locationName: string,
  ciudad: string,
  departmentName: string,
) {
  const legalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'LegalService',
    name: `Abogados de ${esName} en ${locationName}`,
    description: `Encuentre abogados calificados de ${esName.toLowerCase()} en ${locationName}. Verificados por el colegio de abogados, consulta gratis y opiniones de clientes.`,
    url: `${SITE_URL}/abogados/${especialidad}/${ciudad}`,
    availableLanguage: ['Spanish', 'English'],
    areaServed: {
      '@type': 'City',
      name: locationName,
      containedInPlace: { '@type': 'AdministrativeArea', name: departmentName },
    },
    provider: { '@id': `${SITE_URL}#organization` },
    inLanguage: 'es-US',
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Abogados', url: '/abogados' },
    { name: esName, url: `/abogados/${especialidad}` },
    { name: locationName, url: `/abogados/${especialidad}/${ciudad}` },
  ])

  return [legalServiceSchema, breadcrumbSchema]
}

export default async function AbogadosPage({ params }: PageProps) {
  const { especialidad, ciudad } = await params

  const esEntry = SPANISH_PA_MAP[especialidad]
  if (!esEntry) notFound()

  const enSlug = esEntry.enSlug

  // Resolve service (verify the specialty exists, even though we only use enSlug below)
  try {
    const dbService = await getSpecialtyBySlug(enSlug)
    if (!dbService) {
      const staticSvc = staticPracticeAreas.find(s => s.slug === enSlug)
      if (!staticSvc) notFound()
    }
  } catch {
    const staticSvc = staticPracticeAreas.find(s => s.slug === enSlug)
    if (!staticSvc) notFound()
  }

  // Resolve location
  let location: LocationType
  const fallback = cityToLocation(ciudad)
  if (!fallback) notFound()
  location = fallback

  // Fetch attorneys
  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(enSlug, ciudad).catch(() => [] as Provider[]),
    getAttorneyCountByServiceAndLocation(enSlug, ciudad).catch(() => 0),
  ])

  const jsonLdSchemas = generateJsonLd(
    esEntry.esName,
    enSlug,
    especialidad,
    location.name,
    ciudad,
    location.department_name || '',
  )

  // H1
  const seoHash = Math.abs(hashCode(`es-seo-${especialidad}-${ciudad}`))
  const h1Variants = totalCount > 0
    ? [
        `Abogados de ${esEntry.esName} en ${location.name}, ${location.department_code}`,
        `Encuentre un Abogado de ${esEntry.esName} en ${location.name}`,
        `${esEntry.esName} en ${location.name} — ${totalCount} Abogados Verificados`,
        `Mejores Abogados de ${esEntry.esName} en ${location.name}`,
        `Abogados de ${esEntry.esName} en ${location.name} — Consulta Gratis`,
      ]
    : [
        `Abogados de ${esEntry.esName} en ${location.name}, ${location.department_code}`,
        `Encuentre un Abogado de ${esEntry.esName} en ${location.name}`,
        `${esEntry.esName} en ${location.name} — Abogados Calificados`,
        `Buscar Abogado de ${esEntry.esName} en ${location.name}`,
        `Abogados de ${esEntry.esName} en ${location.name}`,
      ]
  const h1Text = h1Variants[seoHash % h1Variants.length]

  return (
    <>
      {jsonLdSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(schema) }} />
      ))}

      <div className="bg-white border-b" lang="es">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href={`/abogados/${especialidad}`} className="hover:text-blue-600">{esEntry.esName}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{location.name}</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50" lang="es">
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">ESPAÑOL</span>
              <span className="text-blue-200 text-sm">Servicio en español disponible</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">{h1Text}</h1>
            <p className="text-blue-100 text-lg max-w-3xl">
              {totalCount > 0
                ? `${totalCount} abogados verificados de ${esEntry.esName.toLowerCase()} listos para ayudarle en ${location.name}. Consulta gratis, sin compromiso.`
                : `Encuentre abogados verificados de ${esEntry.esName.toLowerCase()} en ${location.name}. Solicite una consulta gratis hoy.`}
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm">✓ Abogados verificados</span>
              <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm">✓ Consulta gratis</span>
              <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm">✓ Hablan español</span>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {totalCount > 0 ? `${totalCount} Abogados Encontrados` : 'Abogados en esta área'}
            </h2>
            <Link
              href={`/practice-areas/${enSlug}/${ciudad}`}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View in English →
            </Link>
          </div>

          {providers.length > 0 ? (
            <div className="grid gap-6">
              {(providers as Provider[]).slice(0, 20).map((attorney) => (
                <div key={attorney.stable_id || attorney.slug} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{attorney.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{esEntry.esName} — {location.name}, {location.department_code}</p>
                      {attorney.rating_average && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{attorney.rating_average.toFixed(1)}</span>
                          {attorney.review_count && <span className="text-gray-400 text-sm">({attorney.review_count} opiniones)</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <Link
                        href={getAttorneyUrl({ stable_id: attorney.stable_id, slug: attorney.slug, specialty: attorney.specialty, city: attorney.address_city })}
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
                      >
                        Comparar perfiles
                      </Link>
                      <span className="text-xs text-green-600 font-medium">Consulta gratis</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-600 mb-4">No se encontraron abogados de {esEntry.esName.toLowerCase()} en {location.name} en este momento.</p>
              <Link
                href={`/practice-areas/${enSlug}/${ciudad}`}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Ver más abogados
              </Link>
            </div>
          )}

          {providers.length > 20 && (
            <div className="mt-8 text-center">
              <Link
                href={`/practice-areas/${enSlug}/${ciudad}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver más abogados →
              </Link>
            </div>
          )}
        </section>

        <section className="bg-white border-t py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Por qué elegir nuestro directorio?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Abogados Verificados</h3>
                <p className="text-gray-600 text-sm">Todos los abogados están verificados por el colegio de abogados de su estado. Puede confiar en sus credenciales.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Servicio en Español</h3>
                <p className="text-gray-600 text-sm">Encuentre abogados que hablan español y entienden las necesidades de la comunidad hispana.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Consulta Gratis</h3>
                <p className="text-gray-600 text-sm">Solicite una consulta gratuita sin compromiso. Compare perfiles y lea opiniones antes de decidir.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Otras especialidades en {location.name}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SPANISH_PA_MAP)
              .filter(([slug]) => slug !== especialidad)
              .slice(0, 12)
              .map(([slug, entry]) => (
                <Link
                  key={slug}
                  href={`/abogados/${slug}/${ciudad}`}
                  className="bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-3 py-1.5 rounded-full text-sm transition-colors"
                >
                  {entry.esName}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </>
  )
}
