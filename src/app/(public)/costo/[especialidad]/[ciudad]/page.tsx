import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getSpecialtyBySlug,
  getAttorneyCountByServiceAndLocation,
} from '@/lib/supabase'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { practiceAreas as staticPracticeAreas, getCityBySlug, getStateByCode } from '@/lib/data/usa'
import { SITE_URL } from '@/lib/seo/config'
import { getAlternateLanguages } from '@/lib/seo/hreflang'
import { hashCode } from '@/lib/seo/location-content'
import { getServiceImage } from '@/lib/data/images'
import type { Location as LocationType } from '@/types'
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
  const departmentCode = fallbackCity.stateCode
  let attorneyCount = 1
  try { attorneyCount = await getAttorneyCountByServiceAndLocation(enSlug, ciudad) } catch { attorneyCount = 1 }

  const seoHash = Math.abs(hashCode(`es-cost-${especialidad}-${ciudad}`))
  const titleVariants = [
    `Costo de Abogado de ${esEntry.esName} en ${locationName} — Guía 2026`,
    `¿Cuánto Cuesta un Abogado de ${esEntry.esName} en ${locationName}?`,
    `Precios de Abogados de ${esEntry.esName} en ${locationName} (${departmentCode})`,
    `Honorarios de ${esEntry.esName} en ${locationName} — Guía de Costos`,
    `Costo de ${esEntry.esName} en ${locationName} — Tarifas y Honorarios`,
  ]
  const title = titleVariants[seoHash % titleVariants.length]

  const descHash = Math.abs(hashCode(`es-cost-desc-${especialidad}-${ciudad}`))
  const descVariants = [
    `Guía de costos de abogados de ${esEntry.esName.toLowerCase()} en ${locationName}. Honorarios, tarifas por hora y opciones de pago. ${attorneyCount > 0 ? `${attorneyCount} abogados verificados.` : ''} Consulta gratis.`,
    `¿Cuánto cuesta un abogado de ${esEntry.esName.toLowerCase()} en ${locationName}? Compare precios y solicite una consulta gratis.`,
    `Honorarios de abogados de ${esEntry.esName.toLowerCase()} en ${locationName} (${departmentCode}). Guía completa de costos actualizada 2026.`,
  ]
  const description = descVariants[descHash % descVariants.length]

  return {
    title, description,
    // Noindex thin-content pages (0 attorneys) — fail-open: attorneyCount defaults to 1 if DB is down
    robots: attorneyCount > 0
      ? { index: true, follow: true, 'max-snippet': -1 as const, 'max-image-preview': 'large' as const, 'max-video-preview': -1 as const }
      : { index: false, follow: true },
    openGraph: { title, description, type: 'website', locale: 'es_US', images: [{ url: getServiceImage(enSlug).src, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [getServiceImage(enSlug).src] },
    alternates: {
      canonical: `${SITE_URL}/costo/${especialidad}/${ciudad}`,
      languages: getAlternateLanguages(`/costo/${especialidad}/${ciudad}`),
    },
  }
}

export default async function CostoPage({ params }: PageProps) {
  const { especialidad, ciudad } = await params
  const esEntry = SPANISH_PA_MAP[especialidad]
  if (!esEntry) notFound()

  const enSlug = esEntry.enSlug
  const location = cityToLocation(ciudad) || await resolveZipToLocation(ciudad)
  if (!location) notFound()

  // Verify specialty exists
  try {
    const dbService = await getSpecialtyBySlug(enSlug)
    if (!dbService && !staticPracticeAreas.find(s => s.slug === enSlug)) notFound()
  } catch {
    if (!staticPracticeAreas.find(s => s.slug === enSlug)) notFound()
  }

  let totalCount = 0
  try { totalCount = await getAttorneyCountByServiceAndLocation(enSlug, ciudad) } catch { totalCount = 0 }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Costo', url: '/costo' },
    { name: esEntry.esName, url: `/costo/${especialidad}` },
    { name: location.name, url: `/costo/${especialidad}/${ciudad}` },
  ])

  const legalServiceSchema = {
    '@context': 'https://schema.org', '@type': 'LegalService',
    name: `Costo de Abogado de ${esEntry.esName} en ${location.name}`,
    description: `Guía de costos y honorarios de abogados de ${esEntry.esName.toLowerCase()} en ${location.name}.`,
    url: `${SITE_URL}/costo/${especialidad}/${ciudad}`,
    availableLanguage: ['Spanish', 'English'],
    areaServed: { '@type': 'City', name: location.name, containedInPlace: { '@type': 'AdministrativeArea', name: location.department_name } },
    inLanguage: 'es-US',
  }

  const seoHash = Math.abs(hashCode(`es-cost-${especialidad}-${ciudad}`))
  const h1Variants = [
    `Costo de Abogado de ${esEntry.esName} en ${location.name}, ${location.department_code}`,
    `¿Cuánto Cuesta un Abogado de ${esEntry.esName} en ${location.name}?`,
    `Honorarios de ${esEntry.esName} en ${location.name} — Guía 2026`,
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
          <Link href={`/costo/${especialidad}`} className="hover:text-blue-600">{esEntry.esName}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{location.name}</span>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50" lang="es">
        <section className="bg-gradient-to-br from-amber-700 to-amber-500 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white text-amber-700 text-xs font-bold px-2 py-1 rounded">COSTOS</span>
              <span className="text-amber-100 text-sm">Guía de precios 2026</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">{h1Text}</h1>
            <p className="text-amber-100 text-lg max-w-3xl">
              Conozca los honorarios típicos de abogados de {esEntry.esName.toLowerCase()} en {location.name}. Compare precios y solicite una consulta gratis.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipos de honorarios comunes</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Tarifa por hora</h3>
              <p className="text-3xl font-bold text-amber-600 mb-2">$150 — $500+</p>
              <p className="text-gray-600 text-sm">Los honorarios varían según la experiencia del abogado, la complejidad del caso y la ubicación en {location.department_name}.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Tarifa fija</h3>
              <p className="text-3xl font-bold text-amber-600 mb-2">$500 — $5,000+</p>
              <p className="text-gray-600 text-sm">Para casos específicos con alcance definido. Ideal para procedimientos estándar de {esEntry.esName.toLowerCase()}.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Contingencia</h3>
              <p className="text-3xl font-bold text-amber-600 mb-2">25% — 40%</p>
              <p className="text-gray-600 text-sm">El abogado solo cobra si gana el caso. Común en {esEntry.esName.toLowerCase()} en {location.name}.</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-10">
            <h3 className="font-semibold text-blue-900 mb-2">Consulta inicial gratis</h3>
            <p className="text-blue-800 text-sm">
              La mayoría de los abogados de {esEntry.esName.toLowerCase()} en {location.name} ofrecen una consulta inicial gratuita.
              {totalCount > 0 && ` Compare ${totalCount} abogados verificados en nuestro directorio.`}
            </p>
            <Link
              href={`/abogados/${especialidad}/${ciudad}`}
              className="inline-flex items-center mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              Solicitar consulta gratis
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Factores que afectan el costo</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              { title: 'Experiencia del abogado', desc: 'Abogados con más años de experiencia y mejor historial generalmente cobran tarifas más altas.' },
              { title: 'Complejidad del caso', desc: 'Casos más complejos requieren más tiempo de investigación, preparación y representación en corte.' },
              { title: 'Ubicación geográfica', desc: `Los costos en ${location.name} (${location.department_code}) reflejan el mercado legal local y el costo de vida.` },
              { title: 'Tipo de representación', desc: 'Consultas, mediación, litigio o juicio tienen diferentes estructuras de costos.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Explorar más opciones</h2>
            <Link href={`/cost/${esEntry.enSlug}/${ciudad}`} className="text-sm text-blue-600 hover:text-blue-800 underline">View in English →</Link>
          </div>
        </section>

        <section className="bg-white border-t py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Páginas relacionadas</h2>
            <div className="flex flex-wrap gap-3">
              <Link href={`/abogados/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Abogados de {esEntry.esName}</Link>
              <Link href={`/contratar/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Contratar {esEntry.esName}</Link>
              <Link href={`/opiniones/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Opiniones de {esEntry.esName}</Link>
              <Link href={`/emergencia/${especialidad}/${ciudad}`} className="bg-gray-100 hover:bg-blue-50 text-gray-700 px-4 py-2 rounded-lg text-sm">Emergencia {esEntry.esName}</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
