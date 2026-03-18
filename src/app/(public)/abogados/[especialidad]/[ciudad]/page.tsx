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
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { hashCode } from '@/lib/seo/location-content'
import { getServiceImage } from '@/lib/data/images'
import { getAttorneyUrl } from '@/lib/utils'
import { getSpanishPAContent } from '@/lib/data/spanish-content'
import type { Location as LocationType, Provider } from '@/types'
import { REVALIDATE } from '@/lib/cache'
import { resolveZipToCity, resolveZipToLocation } from '@/lib/location-resolver'

// ISR: revalidate every 24h
export const revalidate = REVALIDATE.attorneyProfile
export const dynamicParams = true

// ---------------------------------------------------------------------------
// Spanish ↔ English practice area slug mapping (75 entries)
// ---------------------------------------------------------------------------
const SPANISH_PA_MAP: Record<string, { esSlug: string; esName: string; enSlug: string }> = {
  'lesiones-personales': { esSlug: 'lesiones-personales', esName: 'Lesiones Personales', enSlug: 'personal-injury' },
  'accidentes-de-auto': { esSlug: 'accidentes-de-auto', esName: 'Accidentes de Auto', enSlug: 'car-accidents' },
  'accidentes-de-camion': { esSlug: 'accidentes-de-camion', esName: 'Accidentes de Camion', enSlug: 'truck-accidents' },
  'accidentes-de-moto': { esSlug: 'accidentes-de-moto', esName: 'Accidentes de Moto', enSlug: 'motorcycle-accidents' },
  'caidas-y-resbalones': { esSlug: 'caidas-y-resbalones', esName: 'Caidas y Resbalones', enSlug: 'slip-and-fall' },
  'negligencia-medica': { esSlug: 'negligencia-medica', esName: 'Negligencia Medica', enSlug: 'medical-malpractice' },
  'muerte-injusta': { esSlug: 'muerte-injusta', esName: 'Muerte Injusta', enSlug: 'wrongful-death' },
  'responsabilidad-del-producto': { esSlug: 'responsabilidad-del-producto', esName: 'Responsabilidad del Producto', enSlug: 'product-liability' },
  'compensacion-laboral': { esSlug: 'compensacion-laboral', esName: 'Compensacion Laboral', enSlug: 'workers-compensation' },
  'abuso-en-asilos': { esSlug: 'abuso-en-asilos', esName: 'Abuso en Asilos', enSlug: 'nursing-home-abuse' },
  'defensa-criminal': { esSlug: 'defensa-criminal', esName: 'Defensa Criminal', enSlug: 'criminal-defense' },
  'dui-dwi': { esSlug: 'dui-dwi', esName: 'DUI y DWI', enSlug: 'dui-dwi' },
  'delitos-de-drogas': { esSlug: 'delitos-de-drogas', esName: 'Delitos de Drogas', enSlug: 'drug-crimes' },
  'delitos-de-cuello-blanco': { esSlug: 'delitos-de-cuello-blanco', esName: 'Delitos de Cuello Blanco', enSlug: 'white-collar-crime' },
  'delitos-federales': { esSlug: 'delitos-federales', esName: 'Delitos Federales', enSlug: 'federal-crimes' },
  'delitos-juveniles': { esSlug: 'delitos-juveniles', esName: 'Delitos Juveniles', enSlug: 'juvenile-crimes' },
  'delitos-sexuales': { esSlug: 'delitos-sexuales', esName: 'Delitos Sexuales', enSlug: 'sex-crimes' },
  'robo-y-hurto': { esSlug: 'robo-y-hurto', esName: 'Robo y Hurto', enSlug: 'theft-robbery' },
  'crimenes-violentos': { esSlug: 'crimenes-violentos', esName: 'Crimenes Violentos', enSlug: 'violent-crimes' },
  'infracciones-de-transito': { esSlug: 'infracciones-de-transito', esName: 'Infracciones de Transito', enSlug: 'traffic-violations' },
  'divorcio': { esSlug: 'divorcio', esName: 'Divorcio', enSlug: 'divorce' },
  'custodia-de-menores': { esSlug: 'custodia-de-menores', esName: 'Custodia de Menores', enSlug: 'child-custody' },
  'manutencion-infantil': { esSlug: 'manutencion-infantil', esName: 'Manutencion Infantil', enSlug: 'child-support' },
  'adopcion': { esSlug: 'adopcion', esName: 'Adopcion', enSlug: 'adoption' },
  'pension-alimenticia': { esSlug: 'pension-alimenticia', esName: 'Pension Alimenticia', enSlug: 'alimony-spousal-support' },
  'violencia-domestica': { esSlug: 'violencia-domestica', esName: 'Violencia Domestica', enSlug: 'domestic-violence' },
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
  'ejecucion-hipotecaria': { esSlug: 'ejecucion-hipotecaria', esName: 'Ejecucion Hipotecaria', enSlug: 'foreclosure' },
  'zonificacion-uso-de-suelo': { esSlug: 'zonificacion-uso-de-suelo', esName: 'Zonificacion y Uso de Suelo', enSlug: 'zoning-land-use' },
  'derecho-de-construccion': { esSlug: 'derecho-de-construccion', esName: 'Derecho de Construccion', enSlug: 'construction-law' },
  'inmigracion': { esSlug: 'inmigracion', esName: 'Inmigracion', enSlug: 'immigration-law' },
  'residencia-permanente': { esSlug: 'residencia-permanente', esName: 'Residencia Permanente', enSlug: 'green-cards' },
  'solicitud-de-visa': { esSlug: 'solicitud-de-visa', esName: 'Solicitud de Visa', enSlug: 'visa-applications' },
  'defensa-contra-deportacion': { esSlug: 'defensa-contra-deportacion', esName: 'Defensa contra Deportacion', enSlug: 'deportation-defense' },
  'asilo': { esSlug: 'asilo', esName: 'Asilo', enSlug: 'asylum' },
  'ciudadania-naturalizacion': { esSlug: 'ciudadania-naturalizacion', esName: 'Ciudadania y Naturalizacion', enSlug: 'citizenship-naturalization' },
  'planificacion-patrimonial': { esSlug: 'planificacion-patrimonial', esName: 'Planificacion Patrimonial', enSlug: 'estate-planning' },
  'testamentos-fideicomisos': { esSlug: 'testamentos-fideicomisos', esName: 'Testamentos y Fideicomisos', enSlug: 'wills-trusts' },
  'sucesiones': { esSlug: 'sucesiones', esName: 'Sucesiones', enSlug: 'probate' },
  'derecho-de-ancianos': { esSlug: 'derecho-de-ancianos', esName: 'Derecho de Ancianos', enSlug: 'elder-law' },
  'tutela-legal': { esSlug: 'tutela-legal', esName: 'Tutela Legal', enSlug: 'guardianship' },
  'derecho-laboral': { esSlug: 'derecho-laboral', esName: 'Derecho Laboral', enSlug: 'employment-law' },
  'despido-injustificado': { esSlug: 'despido-injustificado', esName: 'Despido Injustificado', enSlug: 'wrongful-termination' },
  'discriminacion-laboral': { esSlug: 'discriminacion-laboral', esName: 'Discriminacion Laboral', enSlug: 'workplace-discrimination' },
  'acoso-sexual': { esSlug: 'acoso-sexual', esName: 'Acoso Sexual', enSlug: 'sexual-harassment' },
  'reclamos-salariales': { esSlug: 'reclamos-salariales', esName: 'Reclamos Salariales', enSlug: 'wage-hour-claims' },
  'bancarrota': { esSlug: 'bancarrota', esName: 'Bancarrota', enSlug: 'bankruptcy' },
  'capitulo-7': { esSlug: 'capitulo-7', esName: 'Capitulo 7', enSlug: 'chapter-7-bankruptcy' },
  'capitulo-13': { esSlug: 'capitulo-13', esName: 'Capitulo 13', enSlug: 'chapter-13-bankruptcy' },
  'alivio-de-deudas': { esSlug: 'alivio-de-deudas', esName: 'Alivio de Deudas', enSlug: 'debt-relief' },
  'derecho-fiscal': { esSlug: 'derecho-fiscal', esName: 'Derecho Fiscal', enSlug: 'tax-law' },
  'disputas-con-irs': { esSlug: 'disputas-con-irs', esName: 'Disputas con el IRS', enSlug: 'irs-disputes' },
  'planificacion-fiscal': { esSlug: 'planificacion-fiscal', esName: 'Planificacion Fiscal', enSlug: 'tax-planning' },
  'derecho-del-entretenimiento': { esSlug: 'derecho-del-entretenimiento', esName: 'Derecho del Entretenimiento', enSlug: 'entertainment-law' },
  'derecho-ambiental': { esSlug: 'derecho-ambiental', esName: 'Derecho Ambiental', enSlug: 'environmental-law' },
  'derecho-de-salud': { esSlug: 'derecho-de-salud', esName: 'Derecho de Salud', enSlug: 'health-care-law' },
  'derecho-de-seguros': { esSlug: 'derecho-de-seguros', esName: 'Derecho de Seguros', enSlug: 'insurance-law' },
  'derechos-civiles': { esSlug: 'derechos-civiles', esName: 'Derechos Civiles', enSlug: 'civil-rights' },
  'proteccion-al-consumidor': { esSlug: 'proteccion-al-consumidor', esName: 'Proteccion al Consumidor', enSlug: 'consumer-protection' },
  'seguro-social-discapacidad': { esSlug: 'seguro-social-discapacidad', esName: 'Seguro Social por Discapacidad', enSlug: 'social-security-disability' },
  'beneficios-para-veteranos': { esSlug: 'beneficios-para-veteranos', esName: 'Beneficios para Veteranos', enSlug: 'veterans-benefits' },
  'demanda-colectiva': { esSlug: 'demanda-colectiva', esName: 'Demanda Colectiva', enSlug: 'class-action' },
  'apelaciones': { esSlug: 'apelaciones', esName: 'Apelaciones', enSlug: 'appeals' },
  'mediacion-arbitraje': { esSlug: 'mediacion-arbitraje', esName: 'Mediacion y Arbitraje', enSlug: 'mediation-arbitration' },
  'derecho-familiar': { esSlug: 'derecho-familiar', esName: 'Derecho Familiar', enSlug: 'family-law' },
}

// Hispanic-heavy metro cities for cross-links
const HISPANIC_METRO_CITIES = [
  { name: 'Miami', slug: 'miami' },
  { name: 'Los Angeles', slug: 'los-angeles' },
  { name: 'Houston', slug: 'houston' },
  { name: 'San Antonio', slug: 'san-antonio' },
  { name: 'New York', slug: 'new-york' },
  { name: 'Chicago', slug: 'chicago' },
  { name: 'Phoenix', slug: 'phoenix' },
  { name: 'Dallas', slug: 'dallas' },
  { name: 'El Paso', slug: 'el-paso' },
  { name: 'San Diego', slug: 'san-diego' },
]

// 1 seed page -- ISR 24h handles the rest (dynamicParams = true)
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
  const specialtyName = esEntry.esName
  let locationName = ''
  let departmentCode = ''
  let attorneyCount = 1

  try {
    const [, count] = await Promise.all([
      getSpecialtyBySlug(enSlug),
      getAttorneyCountByServiceAndLocation(enSlug, ciudad),
    ])
    attorneyCount = count
  } catch {
    attorneyCount = 1
  }

  const fallbackCity = getCityBySlug(ciudad) || await resolveZipToCity(ciudad)
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
        `Necesita un abogado de ${specialtyName.toLowerCase()} en ${locationName}? ${attorneyCount} abogados verificados. Consulta gratis.`,
        `Abogados de ${specialtyName.toLowerCase()} en ${locationName} (${departmentCode}). ${attorneyCount} profesionales verificados. Consulta gratis.`,
      ]
    : [
        `Encuentre un abogado calificado de ${specialtyName.toLowerCase()} en ${locationName}. Abogados verificados. Consulta gratis.`,
        `${specialtyName} en ${locationName}: abogados verificados por el colegio de abogados. Consulta gratis.`,
        `Necesita un abogado de ${specialtyName.toLowerCase()} en ${locationName}? Directorio de abogados verificados. Consulta gratis.`,
        `${specialtyName} en ${locationName}. Profesionales verificados. Consulta gratuita e inmediata.`,
        `${locationName}: encuentre un abogado de ${specialtyName.toLowerCase()} de confianza. Consulta gratis.`,
      ]

  const description = descVariants[descHash % descVariants.length]

  return {
    title,
    description,
    robots: attorneyCount > 0
      ? { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const }
      : { index: false, follow: true },
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
      languages: getAlternateLanguages(`/abogados/${especialidad}/${ciudad}`),
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
  faqs?: { question: string; answer: string }[],
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
    inLanguage: 'es',
    dateModified: new Date().toISOString().split('T')[0],
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Abogados', url: '/abogados' },
    { name: esName, url: `/abogados/${especialidad}` },
    { name: locationName, url: `/abogados/${especialidad}/${ciudad}` },
  ])

  const schemas: Record<string, unknown>[] = [legalServiceSchema, breadcrumbSchema]

  // FAQ schema if available
  if (faqs && faqs.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
          inLanguage: 'es',
        },
      })),
      inLanguage: 'es',
    }
    schemas.push(faqSchema)
  }

  return schemas
}

export default async function AbogadosPage({ params }: PageProps) {
  const { especialidad, ciudad } = await params

  const esEntry = SPANISH_PA_MAP[especialidad]
  if (!esEntry) notFound()

  const enSlug = esEntry.enSlug

  // Resolve service
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
  const fallback = cityToLocation(ciudad) || await resolveZipToLocation(ciudad)
  if (!fallback) notFound()
  const location = fallback

  // Fetch attorneys
  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(enSlug, ciudad).catch(() => [] as Provider[]),
    getAttorneyCountByServiceAndLocation(enSlug, ciudad).catch(() => 0),
  ])

  // Get rich Spanish content
  const spanishContent = getSpanishPAContent(especialidad)

  const jsonLdSchemas = generateJsonLd(
    esEntry.esName,
    enSlug,
    especialidad,
    location.name,
    ciudad,
    location.department_name || '',
    spanishContent?.faqs,
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

  // Other cities for cross-links (exclude current)
  const otherCities = HISPANIC_METRO_CITIES.filter(c => c.slug !== ciudad)

  return (
    <>
      {jsonLdSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(schema) }} />
      ))}

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800" lang="es">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/abogados" className="hover:text-blue-600 dark:hover:text-blue-400">Abogados</Link>
          <span className="mx-2">/</span>
          <Link href={`/abogados/${especialidad}`} className="hover:text-blue-600 dark:hover:text-blue-400">{esEntry.esName}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{location.name}</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950" lang="es">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">ESPANOL</span>
              <span className="text-blue-200 text-sm">Servicio en espanol disponible</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">{h1Text}</h1>
            <p className="text-blue-100 text-lg max-w-3xl">
              {totalCount > 0
                ? `${totalCount} abogados verificados de ${esEntry.esName.toLowerCase()} listos para ayudarle en ${location.name}. Consulta gratis, sin compromiso.`
                : `Encuentre abogados verificados de ${esEntry.esName.toLowerCase()} en ${location.name}. Solicite una consulta gratis hoy.`}
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm border border-white/10">Abogados verificados</span>
              <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm border border-white/10">Consulta gratis</span>
              <span className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm border border-white/10">Hablan espanol</span>
            </div>
            <div className="mt-6">
              <Link
                href={`/practice-areas/${enSlug}/${ciudad}`}
                className="text-sm text-blue-200 hover:text-white underline transition-colors"
              >
                View in English →
              </Link>
            </div>
          </div>
        </section>

        {/* Description section (rich Spanish content) */}
        {spanishContent && (
          <section className="py-10 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {esEntry.esName} en {location.name}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {spanishContent.description}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Attorney listings */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {totalCount > 0 ? `${totalCount} Abogados Encontrados` : 'Abogados en esta area'}
            </h2>
            <Link
              href={`/practice-areas/${enSlug}/${ciudad}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
            >
              View in English →
            </Link>
          </div>

          {providers.length > 0 ? (
            <div className="grid gap-6">
              {(providers as Provider[]).slice(0, 20).map((attorney) => (
                <div key={attorney.stable_id || attorney.slug} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{attorney.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{esEntry.esName} — {location.name}, {location.department_code}</p>
                      {attorney.rating_average && (
                        <div className="flex items-center gap-1 mt-2">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{attorney.rating_average.toFixed(1)}</span>
                          {attorney.review_count && <span className="text-gray-400 text-sm">({attorney.review_count} opiniones)</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <Link
                        href={getAttorneyUrl({ stable_id: attorney.stable_id, slug: attorney.slug, specialty: attorney.specialty?.name, city: attorney.address_city })}
                        className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
                      >
                        Ver perfil completo
                      </Link>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Consulta gratis</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No se encontraron abogados de {esEntry.esName.toLowerCase()} en {location.name} en este momento.</p>
              <Link
                href={`/practice-areas/${enSlug}/${ciudad}`}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Ver mas abogados
              </Link>
            </div>
          )}

          {providers.length > 20 && (
            <div className="mt-8 text-center">
              <Link
                href={`/practice-areas/${enSlug}/${ciudad}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Ver mas abogados →
              </Link>
            </div>
          )}
        </section>

        {/* Cost section */}
        {spanishContent && (
          <section className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Costo de un abogado de {esEntry.esName.toLowerCase()} en {location.name}
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 max-w-3xl">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {spanishContent.costDescription}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Process section */}
        {spanishContent && (
          <section className="border-t dark:border-gray-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Proceso legal: {esEntry.esName.toLowerCase()} en {location.name}
              </h2>
              <div className="max-w-3xl space-y-4">
                {spanishContent.processSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ section */}
        {spanishContent && (
          <section className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                Preguntas frecuentes sobre {esEntry.esName.toLowerCase()} en {location.name}
              </h2>
              <div className="max-w-3xl space-y-6">
                {spanishContent.faqs.map((faq, idx) => (
                  <div key={idx} className="border-b dark:border-gray-800 pb-6 last:border-b-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why choose us */}
        <section className="border-t dark:border-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Por que elegir nuestro directorio?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Abogados Verificados</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Todos los abogados estan verificados por el colegio de abogados de su estado. Puede confiar en sus credenciales y licencia activa.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Servicio en Espanol</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Encuentre abogados que hablan espanol y entienden las necesidades de la comunidad hispana. Comunicacion sin barreras.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-6">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-amber-600 dark:text-amber-400 text-lg font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Consulta Gratuita</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Solicite una consulta gratuita sin compromiso. Compare perfiles, lea opiniones y tome una decision informada.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Same specialty in other cities */}
        <section className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {esEntry.esName} en otras ciudades
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCities.map(city => (
                <Link
                  key={city.slug}
                  href={`/abogados/${especialidad}/${city.slug}`}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-full text-sm transition-colors"
                >
                  {esEntry.esName} en {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Other specialties in same city */}
        <section className="border-t dark:border-gray-800 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Otras especialidades en {location.name}</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SPANISH_PA_MAP)
                .filter(([slug]) => slug !== especialidad)
                .slice(0, 15)
                .map(([slug, entry]) => (
                  <Link
                    key={slug}
                    href={`/abogados/${slug}/${ciudad}`}
                    className="bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 px-3 py-1.5 rounded-full text-sm transition-colors"
                  >
                    {entry.esName}
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-14">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              Necesita un abogado de {esEntry.esName.toLowerCase()} en {location.name}?
            </h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              Obtenga hasta 3 consultas gratuitas de abogados calificados. Sin compromiso, sin costo.
            </p>
            <Link
              href="/quotes"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-8 py-4 rounded-xl shadow-lg transition-colors"
            >
              Solicitar consulta gratis
            </Link>
          </div>
        </section>

        {/* Editorial methodology */}
        <section className="py-8 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Metodologia editorial</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Los datos de abogados de {esEntry.esName.toLowerCase()} en {location.name} provienen de fuentes oficiales incluyendo el colegio de abogados de {location.department_name || location.department_code}, registros publicos y fuentes gubernamentales. US Attorneys es un directorio independiente — no proporcionamos servicios legales directamente. Toda la informacion se verifica y actualiza regularmente.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
