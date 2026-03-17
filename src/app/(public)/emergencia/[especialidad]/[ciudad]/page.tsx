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
import { resolveZipToCity, resolveZipToLocation } from '@/lib/location-resolver'

export const revalidate = REVALIDATE.serviceLocation
export const dynamicParams = true

// ---------------------------------------------------------------------------
// Spanish ↔ English practice area slug mapping
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
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function cityToLocation(slug: string): LocationType | null {
  const cityData = getCityBySlug(slug)
  if (!cityData) return null
  return {
    id: '', name: cityData.name, slug: cityData.slug, postal_code: cityData.zipCode,
    region_name: getStateByCode(cityData.stateCode)?.region || '', department_name: cityData.stateName,
    department_code: cityData.stateCode, is_active: true, created_at: '',
  }
}

interface PageProps { params: Promise<{ especialidad: string; ciudad: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { especialidad, ciudad } = await params
  const esEntry = SPANISH_PA_MAP[especialidad]
  if (!esEntry) return { title: 'No Encontrado', robots: { index: false, follow: false } }

  const enSlug = esEntry.enSlug
  const fallbackCity = getCityBySlug(ciudad) || await resolveZipToCity(ciudad)
  if (!fallbackCity) return { title: 'No Encontrado', robots: { index: false, follow: false } }

  const locationName = fallbackCity.name
  let attorneyCount = 1
  try { attorneyCount = await getAttorneyCountByServiceAndLocation(enSlug, ciudad) } catch { attorneyCount = 1 }

  const seoHash = Math.abs(hashCode(`es-emergency-${especialidad}-${ciudad}`))
  const titleVariants = [
    `Abogado de Emergencia — ${esEntry.esName} en ${locationName} 24h`,
    `${esEntry.esName} Urgente en ${locationName} — Disponible 24 Horas`,
    `Emergencia ${esEntry.esName} en ${locationName} — Ayuda Inmediata`,
    `Abogado de ${esEntry.esName} 24/7 en ${locationName}`,
    `Emergencia Legal — ${esEntry.esName} en ${locationName}`,
  ]
  const title = titleVariants[seoHash % titleVariants.length]

  const descHash = Math.abs(hashCode(`es-emergency-desc-${especialidad}-${ciudad}`))
  const descVariants = [
    `¿Emergencia legal? Abogados de ${esEntry.esName.toLowerCase()} disponibles 24/7 en ${locationName}. ${attorneyCount > 0 ? `${attorneyCount} abogados verificados.` : ''} Respuesta inmediata.`,
    `Necesita un abogado de ${esEntry.esName.toLowerCase()} urgente en ${locationName}? Servicio de emergencia 24 horas. Consulta gratis.`,
    `Abogados de emergencia en ${esEntry.esName.toLowerCase()} en ${locationName}. Disponible 24 horas, respuesta rápida, hablan español.`,
  ]
  const description = descVariants[descHash % descVariants.length]

  return {
    title, description,
    robots: { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const },
    openGraph: { title, description, type: 'website', locale: 'es_US', images: [{ url: getServiceImage(enSlug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(enSlug).src] },
    alternates: {
      canonical: `${SITE_URL}/emergencia/${especialidad}/${ciudad}`,
      languages: { 'en': `${SITE_URL}/emergency/${enSlug}/${ciudad}`, 'es': `${SITE_URL}/emergencia/${especialidad}/${ciudad}` },
    },
  }
}

export default async function EmergenciaPage({ params }: PageProps) {
  const { especialidad, ciudad } = await params
  const esEntry = SPANISH_PA_MAP[especialidad]
  if (!esEntry) notFound()

  const enSlug = esEntry.enSlug
  try {
    const dbService = await getSpecialtyBySlug(enSlug)
    if (!dbService) { const s = staticPracticeAreas.find(s => s.slug === enSlug); if (!s) notFound() }
  } catch { const s = staticPracticeAreas.find(s => s.slug === enSlug); if (!s) notFound() }

  const location = cityToLocation(ciudad) || await resolveZipToLocation(ciudad)
  if (!location) notFound()

  const [providers, totalCount] = await Promise.all([
    getAttorneysByServiceAndLocation(enSlug, ciudad).catch(() => [] as Provider[]),
    getAttorneyCountByServiceAndLocation(enSlug, ciudad).catch(() => 0),
  ])

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Emergencia', url: '/emergencia' },
    { name: esEntry.esName, url: `/emergencia/${especialidad}` },
    { name: location.name, url: `/emergencia/${especialidad}/${ciudad}` },
  ])

  const legalServiceSchema = {
    '@context': 'https://schema.org', '@type': 'LegalService',
    name: `Abogado de Emergencia — ${esEntry.esName} en ${location.name}`,
    description: `Servicio de emergencia legal 24/7 para ${esEntry.esName.toLowerCase()} en ${location.name}. Respuesta inmediata.`,
    url: `${SITE_URL}/emergencia/${especialidad}/${ciudad}`,
    availableLanguage: ['Spanish', 'English'],
    areaServed: { '@type': 'City', name: location.name, containedInPlace: { '@type': 'AdministrativeArea', name: location.department_name } },
    inLanguage: 'es-US',
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  }

  const seoHash = Math.abs(hashCode(`es-emergency-${especialidad}-${ciudad}`))
  const h1Variants = [
    `Abogado de Emergencia — ${esEntry.esName} en ${location.name} 24h`,
    `${esEntry.esName} Urgente en ${location.name}, ${location.department_code}`,
    `Emergencia Legal: ${esEntry.esName} en ${location.name}`,
  ]
  const h1Text = h1Variants[seoHash % h1Variants.length]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonStringify(legalServiceSchema) }} />

      <div className="bg-white border-b" lang="es">
        <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href={`/emergencia/${especialidad}`} className="hover:text-blue-600">{esEntry.esName}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{location.name}</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50" lang="es">
        <section className="bg-gradient-to-br from-red-800 to-red-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white text-red-700 text-xs font-bold px-2 py-1 rounded animate-pulse">EMERGENCIA 24/7</span>
              <span className="text-red-200 text-sm">Respuesta inmediata</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">{h1Text}</h1>
            <p className="text-red-100 text-lg max-w-3xl">
              ¿Necesita un abogado de {esEntry.esName.toLowerCase()} ahora mismo en {location.name}? Nuestros abogados verificados están disponibles las 24 horas del día, los 7 días de la semana.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-semibold">Disponible 24 horas</span>
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-semibold">Respuesta inmediata</span>
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-sm font-semibold">Hablan español</span>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-red-900 mb-3">¿Qué hacer en una emergencia legal?</h2>
            <ol className="space-y-3 text-red-800">
              <li className="flex gap-3">
                <span className="bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span><strong>No hable con nadie</strong> sobre su caso antes de consultar con un abogado.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span><strong>Documente todo</strong> — tome fotos, guarde mensajes y anote fechas importantes.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span><strong>Contacte un abogado inmediatamente</strong> — mientras más rápido actúe, mejor será el resultado.</span>
              </li>
            </ol>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {totalCount > 0 ? `${totalCount} Abogados Disponibles Ahora` : 'Abogados de emergencia'}
            </h2>
            <Link href={`/emergency/${enSlug}/${ciudad}`} className="text-sm text-blue-600 hover:text-blue-800 underline">View in English →</Link>
          </div>

          {providers.length > 0 ? (
            <div className="grid gap-6">
              {(providers as Provider[]).slice(0, 10).map(attorney => (
                <div key={attorney.stable_id || attorney.slug} className="bg-white rounded-xl shadow-sm border-2 border-red-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{attorney.name}</h3>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">DISPONIBLE</span>
                      </div>
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
                        className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors"
                      >
                        Solicitar consulta AHORA
                      </Link>
                      <span className="text-xs text-green-600 font-medium">Consulta gratis - Respuesta inmediata</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <p className="text-gray-600 mb-4">No se encontraron abogados de emergencia de {esEntry.esName.toLowerCase()} en {location.name} en este momento.</p>
              <Link href={`/abogados/${especialidad}/${ciudad}`} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                Ver todos los abogados
              </Link>
            </div>
          )}
        </section>

        <section className="bg-white border-t py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipos de emergencias legales</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Arrestos y Detenciones</h3>
                <p className="text-gray-600 text-sm">Si usted o un familiar ha sido arrestado, necesita un abogado inmediatamente para proteger sus derechos.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Órdenes de Protección</h3>
                <p className="text-gray-600 text-sm">Situaciones de violencia doméstica o acoso requieren acción legal urgente para su seguridad.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Accidentes Graves</h3>
                <p className="text-gray-600 text-sm">Después de un accidente serio, un abogado puede proteger su derecho a compensación desde el primer momento.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Páginas relacionadas</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/abogados/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Abogados de {esEntry.esName}</Link>
            <Link href={`/contratar/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Contratar {esEntry.esName}</Link>
            <Link href={`/costo/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Costo de {esEntry.esName}</Link>
            <Link href={`/opiniones/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Opiniones de {esEntry.esName}</Link>
          </div>
        </section>
      </div>
    </>
  )
}
