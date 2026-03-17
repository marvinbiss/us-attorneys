import { SITE_URL } from './config'

interface HreflangLink {
  lang: string   // 'en' | 'es' | 'x-default'
  url: string
}

// English to Spanish intent mapping
const INTENT_MAP: Record<string, string> = {
  'attorneys': 'abogados',
  'practice-areas': 'abogados',
  'hire': 'contratar',
  'cost': 'costo',
  'reviews': 'opiniones',
  'emergency': 'emergencia',
  'find': 'encontrar',
  'compare': 'comparar',
  'free-consultation': 'consulta-gratis',
  'near-me': 'cerca-de-mi',
  'best': 'mejores',
  'top-rated': 'mejor-calificados',
  'affordable': 'accesibles',
  'questions': 'preguntas',
  'guides': 'guias',
  'glossary': 'glosario',
}

// Intents that have actual Spanish route directories (no /es/ prefix needed)
const INTENTS_WITH_SPANISH_ROUTES: Set<string> = new Set([
  'attorneys', 'practice-areas', 'hire', 'cost', 'reviews', 'emergency',
])

// Reverse mapping — first entry wins (e.g. abogados -> attorneys, not practice-areas)
const INTENT_MAP_REVERSE: Record<string, string> = {}
for (const [en, es] of Object.entries(INTENT_MAP)) {
  if (!(es in INTENT_MAP_REVERSE)) {
    INTENT_MAP_REVERSE[es] = en
  }
}

// Spanish practice area slug mappings (all 200 practice areas from practice-areas-200.ts)
const SPANISH_PA_SLUGS: Record<string, string> = {
  // PERSONAL INJURY (25)
  'personal-injury': 'lesiones-personales',
  'car-accidents': 'accidentes-de-auto',
  'truck-accidents': 'accidentes-de-camion',
  'motorcycle-accidents': 'accidentes-de-motocicleta',
  'slip-and-fall': 'resbalones-y-caidas',
  'medical-malpractice': 'negligencia-medica',
  'wrongful-death': 'muerte-injusta',
  'product-liability': 'responsabilidad-por-productos',
  'workers-compensation': 'compensacion-laboral',
  'nursing-home-abuse': 'abuso-en-hogares-de-ancianos',
  'bicycle-accidents': 'accidentes-de-bicicleta',
  'pedestrian-accidents': 'accidentes-de-peatones',
  'brain-injury': 'lesion-cerebral',
  'spinal-cord-injury': 'lesion-de-medula-espinal',
  'burn-injury': 'lesiones-por-quemaduras',
  'dog-bite': 'mordedura-de-perro',
  'uber-lyft-accidents': 'accidentes-de-uber-y-lyft',
  'boat-accidents': 'accidentes-de-embarcaciones',
  'aviation-accidents': 'accidentes-de-aviacion',
  'construction-accidents': 'accidentes-de-construccion',
  'premises-liability': 'responsabilidad-de-instalaciones',
  'catastrophic-injury': 'lesiones-catastroficas',
  'toxic-exposure': 'exposicion-toxica',
  'railroad-injury': 'lesiones-ferroviarias',
  'swimming-pool-accidents': 'accidentes-en-piscinas',
  // CRIMINAL DEFENSE (20)
  'criminal-defense': 'defensa-criminal',
  'dui-dwi': 'dui-y-dwi',
  'drug-crimes': 'delitos-de-drogas',
  'white-collar-crime': 'delitos-de-cuello-blanco',
  'federal-crimes': 'delitos-federales',
  'juvenile-crimes': 'delitos-juveniles',
  'sex-crimes': 'delitos-sexuales',
  'theft-robbery': 'robo-y-hurto',
  'violent-crimes': 'crimenes-violentos',
  'traffic-violations': 'infracciones-de-transito',
  'assault-battery': 'agresion-y-lesiones',
  'domestic-assault': 'agresion-domestica',
  'gun-charges': 'cargos-por-armas',
  'probation-violations': 'violaciones-de-probatoria',
  'expungement': 'eliminacion-de-antecedentes',
  'embezzlement': 'malversacion',
  'fraud': 'fraude',
  'manslaughter': 'homicidio-involuntario',
  'conspiracy': 'conspiracion',
  'hit-and-run': 'fuga-tras-accidente',
  // FAMILY LAW (15)
  'divorce': 'divorcio',
  'child-custody': 'custodia-de-menores',
  'child-support': 'manutencion-infantil',
  'adoption': 'adopcion',
  'alimony-spousal-support': 'pension-alimenticia',
  'domestic-violence': 'violencia-domestica',
  'prenuptial-agreements': 'acuerdos-prenupciales',
  'paternity': 'paternidad',
  'grandparents-rights': 'derechos-de-abuelos',
  'military-divorce': 'divorcio-militar',
  'same-sex-divorce': 'divorcio-del-mismo-sexo',
  'modification-orders': 'modificacion-de-ordenes',
  'relocation-custody': 'reubicacion-y-custodia',
  'father-rights': 'derechos-del-padre',
  'mother-rights': 'derechos-de-la-madre',
  // BUSINESS & CORPORATE (15)
  'business-law': 'derecho-empresarial',
  'corporate-law': 'derecho-corporativo',
  'mergers-acquisitions': 'fusiones-y-adquisiciones',
  'contract-law': 'derecho-contractual',
  'business-litigation': 'litigio-comercial',
  'startup-law': 'derecho-para-startups',
  'franchise-law': 'derecho-de-franquicias',
  'partnership-disputes': 'disputas-de-sociedad',
  'shareholder-disputes': 'disputas-de-accionistas',
  'non-compete-agreements': 'acuerdos-de-no-competencia',
  'trade-secrets': 'secretos-comerciales',
  'securities-law': 'derecho-de-valores',
  'venture-capital': 'capital-de-riesgo',
  'commercial-lease': 'arrendamiento-comercial',
  'small-business-law': 'derecho-para-pequenas-empresas',
  // INTELLECTUAL PROPERTY (8)
  'intellectual-property': 'propiedad-intelectual',
  'trademark': 'marcas-registradas',
  'patent': 'patentes',
  'copyright': 'derechos-de-autor',
  'trade-dress': 'imagen-comercial',
  'licensing-agreements': 'acuerdos-de-licencia',
  'ip-litigation': 'litigio-de-propiedad-intelectual',
  'software-ip': 'propiedad-intelectual-de-software',
  // REAL ESTATE (10)
  'real-estate-law': 'derecho-inmobiliario',
  'landlord-tenant': 'propietarios-e-inquilinos',
  'foreclosure': 'ejecucion-hipotecaria',
  'zoning-land-use': 'zonificacion-y-uso-del-suelo',
  'construction-law': 'derecho-de-construccion',
  'commercial-real-estate': 'bienes-raices-comerciales',
  'title-disputes': 'disputas-de-titulo',
  'boundary-disputes': 'disputas-de-limites',
  'hoa-disputes': 'disputas-de-hoa',
  'eminent-domain': 'dominio-eminente',
  // IMMIGRATION (12)
  'immigration-law': 'derecho-migratorio',
  'green-cards': 'tarjetas-verdes',
  'visa-applications': 'solicitudes-de-visa',
  'deportation-defense': 'defensa-contra-deportacion',
  'asylum': 'asilo',
  'citizenship-naturalization': 'ciudadania-y-naturalizacion',
  'daca': 'daca',
  'work-permits': 'permisos-de-trabajo',
  'investor-visas': 'visas-de-inversionista',
  'family-immigration': 'inmigracion-familiar',
  'immigration-appeals': 'apelaciones-migratorias',
  'immigration-detention': 'detencion-migratoria',
  // ESTATE PLANNING (10)
  'estate-planning': 'planificacion-patrimonial',
  'wills-trusts': 'testamentos-y-fideicomisos',
  'probate': 'sucesion-testamentaria',
  'elder-law': 'derecho-de-adultos-mayores',
  'guardianship': 'tutela-legal',
  'living-trusts': 'fideicomisos-en-vida',
  'power-of-attorney': 'poder-notarial',
  'trust-administration': 'administracion-de-fideicomisos',
  'estate-litigation': 'litigio-sucesorio',
  'medicaid-planning': 'planificacion-de-medicaid',
  // EMPLOYMENT (13)
  'employment-law': 'derecho-laboral',
  'wrongful-termination': 'despido-injustificado',
  'workplace-discrimination': 'discriminacion-laboral',
  'sexual-harassment': 'acoso-sexual',
  'wage-hour-claims': 'reclamos-de-salarios-y-horas',
  'fmla-violations': 'violaciones-de-fmla',
  'whistleblower': 'denunciante',
  'non-compete-employment': 'no-competencia-laboral',
  'executive-compensation': 'compensacion-ejecutiva',
  'workplace-injury': 'lesiones-en-el-trabajo',
  'retaliation': 'represalias-laborales',
  'unemployment-claims': 'reclamos-de-desempleo',
  'ada-violations': 'violaciones-de-ada',
  // BANKRUPTCY (7)
  'bankruptcy': 'bancarrota',
  'chapter-7-bankruptcy': 'capitulo-7',
  'chapter-13-bankruptcy': 'capitulo-13',
  'debt-relief': 'alivio-de-deudas',
  'business-bankruptcy': 'bancarrota-empresarial',
  'foreclosure-defense': 'defensa-contra-ejecucion-hipotecaria',
  'student-loan-debt': 'deuda-de-prestamos-estudiantiles',
  // TAX (7)
  'tax-law': 'derecho-fiscal',
  'irs-disputes': 'disputas-con-el-irs',
  'tax-planning': 'planificacion-fiscal',
  'back-taxes': 'impuestos-atrasados',
  'tax-fraud-defense': 'defensa-por-fraude-fiscal',
  'international-tax': 'impuestos-internacionales',
  'estate-tax': 'impuesto-sobre-herencias',
  // SPECIALIZED (23)
  'entertainment-law': 'derecho-del-entretenimiento',
  'environmental-law': 'derecho-ambiental',
  'health-care-law': 'derecho-de-salud',
  'insurance-law': 'derecho-de-seguros',
  'civil-rights': 'derechos-civiles',
  'consumer-protection': 'proteccion-al-consumidor',
  'social-security-disability': 'discapacidad-del-seguro-social',
  'veterans-benefits': 'beneficios-para-veteranos',
  'class-action': 'demanda-colectiva',
  'appeals': 'apelaciones',
  'mediation-arbitration': 'mediacion-y-arbitraje',
  'military-law': 'derecho-militar',
  'maritime-law': 'derecho-maritimo',
  'aviation-law': 'derecho-aeronautico',
  'sports-law': 'derecho-deportivo',
  'cannabis-law': 'derecho-del-cannabis',
  'education-law': 'derecho-educativo',
  'animal-law': 'derecho-animal',
  'election-law': 'derecho-electoral',
  'native-american-law': 'derecho-indigena',
  'water-rights': 'derechos-de-agua',
  'agricultural-law': 'derecho-agricola',
  'energy-law': 'derecho-energetico',
  'telecommunications-law': 'derecho-de-telecomunicaciones',
  // GOVERNMENT & ADMINISTRATIVE (8)
  'administrative-law': 'derecho-administrativo',
  'government-contracts': 'contratos-gubernamentales',
  'regulatory-compliance': 'cumplimiento-regulatorio',
  'foia-requests': 'solicitudes-foia',
  'licensing-permits': 'licencias-y-permisos',
  'municipal-law': 'derecho-municipal',
  'government-ethics': 'etica-gubernamental',
  'public-records': 'registros-publicos',
  // TECHNOLOGY & CYBER (7)
  'cyber-law': 'derecho-cibernetico',
  'data-privacy': 'privacidad-de-datos',
  'ai-law': 'derecho-de-inteligencia-artificial',
  'cryptocurrency-law': 'derecho-de-criptomonedas',
  'internet-law': 'derecho-de-internet',
  'e-commerce-law': 'derecho-del-comercio-electronico',
  'social-media-law': 'derecho-de-redes-sociales',
  // PERSONAL & FAMILY ADDITIONAL (5)
  'name-change': 'cambio-de-nombre',
  'gender-marker-change': 'cambio-de-marcador-de-genero',
  'surrogacy-law': 'derecho-de-subrogacion',
  'egg-donor-law': 'derecho-de-donacion-de-ovulos',
  'restraining-orders': 'ordenes-de-restriccion',
  // ADDITIONAL SUBSPECIALTIES (14)
  'lemon-law': 'ley-del-limon',
  'medical-device-injury': 'lesiones-por-dispositivos-medicos',
  'rideshare-law': 'derecho-de-transporte-compartido',
  'insurance-bad-faith': 'mala-fe-de-seguros',
  'uninsured-motorist': 'conductor-sin-seguro',
  'military-defense': 'defensa-militar',
  'birth-injury': 'lesiones-de-nacimiento',
  'mesothelioma': 'mesotelioma',
  'nursing-malpractice': 'negligencia-de-enfermeria',
  'dental-malpractice': 'negligencia-dental',
  'church-abuse': 'abuso-eclesiastico',
  'debt-collection-defense': 'defensa-contra-cobro-de-deudas',
  'nursing-license-defense': 'defensa-de-licencia-de-enfermeria',
  'medical-license-defense': 'defensa-de-licencia-medica',
}

// Reverse mapping: Spanish slug -> English slug
const ENGLISH_PA_SLUGS: Record<string, string> = Object.fromEntries(
  Object.entries(SPANISH_PA_SLUGS).map(([en, es]) => [es, en])
)

/**
 * Generate hreflang links for a given URL
 * Returns array of {lang, url} for use in <link rel="alternate"> tags
 */
export function getHreflangLinks(currentUrl: string): HreflangLink[] {
  // Normalize: remove trailing slash and site URL prefix
  const path = currentUrl
    .replace(SITE_URL, '')
    .replace(/\/$/, '') || '/'

  const spanishPath = getSpanishMirror(path)

  if (!spanishPath) {
    return []
  }

  const englishUrl = `${SITE_URL}${path}`
  const spanishUrl = `${SITE_URL}${spanishPath}`

  return [
    { lang: 'en', url: englishUrl },
    { lang: 'es', url: spanishUrl },
    { lang: 'x-default', url: englishUrl },
  ]
}

/**
 * Get the Spanish mirror URL for an English page.
 * Spanish routes live at /{intent-es}/... (e.g. /abogados/lesiones-personales/houston)
 * — NO /es/ prefix because those are real Next.js route directories.
 * Returns null if no Spanish mirror exists.
 */
export function getSpanishMirror(englishPath: string): string | null {
  const normalizedPath = englishPath.replace(/\/$/, '') || '/'

  // Homepage — no Spanish homepage route exists yet
  if (normalizedPath === '/') {
    return null
  }

  // Split path into segments
  const segments = normalizedPath.split('/').filter(Boolean)

  // Already a Spanish page (direct Spanish route prefix)
  const spanishRoutes = new Set(Object.values(INTENT_MAP))
  if (spanishRoutes.has(segments[0])) {
    return null
  }

  // First segment must be a known English intent with a Spanish route
  const firstSegment = segments[0]
  if (!INTENTS_WITH_SPANISH_ROUTES.has(firstSegment)) {
    return null
  }

  // Translate each segment
  const translatedSegments = segments.map(segment => {
    // Check if it's a practice area slug
    if (SPANISH_PA_SLUGS[segment]) {
      return SPANISH_PA_SLUGS[segment]
    }
    // Check if it's an intent
    if (INTENT_MAP[segment]) {
      return INTENT_MAP[segment]
    }
    // State slugs and city slugs stay in English (proper nouns)
    return segment
  })

  return `/${translatedSegments.join('/')}`
}

/**
 * Get the English original URL for a Spanish page.
 * Spanish routes are at /{spanish-intent}/... (e.g. /abogados/lesiones-personales/houston)
 * Maps back to /{english-intent}/... (e.g. /attorneys/personal-injury/houston)
 */
export function getEnglishOriginal(spanishPath: string): string | null {
  const normalizedPath = spanishPath.replace(/\/$/, '') || '/'

  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 0) return null

  // Check if first segment is a Spanish intent
  if (!INTENT_MAP_REVERSE[segments[0]]) {
    return null
  }

  // Translate back to English
  const translatedSegments = segments.map(segment => {
    // Check if it's a Spanish practice area slug
    if (ENGLISH_PA_SLUGS[segment]) {
      return ENGLISH_PA_SLUGS[segment]
    }
    // Check if it's a Spanish intent
    if (INTENT_MAP_REVERSE[segment]) {
      return INTENT_MAP_REVERSE[segment]
    }
    // State/city slugs are unchanged
    return segment
  })

  return `/${translatedSegments.join('/')}`
}

/**
 * Check if a URL has a Spanish mirror.
 * Only returns true for English pages whose first segment is a known intent
 * that has an actual Spanish route directory.
 */
export function hasSpanishMirror(path: string): boolean {
  const normalizedPath = path.replace(/\/$/, '') || '/'
  const segments = normalizedPath.split('/').filter(Boolean)

  // No homepage mirror (no /es route exists)
  if (segments.length === 0) return false

  // Spanish pages don't have Spanish mirrors
  const spanishIntents = new Set(Object.values(INTENT_MAP))
  if (spanishIntents.has(segments[0])) return false

  // First segment must be an English intent with an actual Spanish route
  return INTENTS_WITH_SPANISH_ROUTES.has(segments[0])
}

/**
 * Generate Next.js Metadata alternates object for hreflang.
 * Returns { languages: { en: url, es: url, 'x-default': url } } for use in metadata.alternates.
 *
 * Works for both English pages (e.g. /attorneys/personal-injury/houston)
 * and Spanish pages (e.g. /abogados/lesiones-personales/houston).
 */
export function getAlternateLanguages(path: string): Record<string, string> {
  const normalizedPath = path.replace(/\/$/, '') || '/'
  const languages: Record<string, string> = {}

  // Check if this is a Spanish page (first segment is a Spanish intent)
  const segments = normalizedPath.split('/').filter(Boolean)
  const spanishIntents = new Set(Object.values(INTENT_MAP))
  const isSpanishPage = segments.length > 0 && spanishIntents.has(segments[0])

  if (isSpanishPage) {
    // Spanish page — link back to English
    const englishPath = getEnglishOriginal(normalizedPath)
    if (englishPath) {
      languages['en'] = `${SITE_URL}${englishPath}`
      languages['es'] = `${SITE_URL}${normalizedPath}`
      languages['x-default'] = `${SITE_URL}${englishPath}`
    }
  } else if (hasSpanishMirror(normalizedPath)) {
    // English page with a Spanish mirror
    const spanishPath = getSpanishMirror(normalizedPath)
    languages['en'] = `${SITE_URL}${normalizedPath}`
    if (spanishPath) {
      languages['es'] = `${SITE_URL}${spanishPath}`
    }
    languages['x-default'] = `${SITE_URL}${normalizedPath}`
  }

  return languages
}

// Export slug maps for use in route generation
export { SPANISH_PA_SLUGS, ENGLISH_PA_SLUGS, INTENT_MAP, INTENT_MAP_REVERSE }
