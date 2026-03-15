import { AlertTriangle, Droplets, Mountain, Activity, Shield, CheckCircle } from 'lucide-react'
import type { LocationData } from '@/lib/data/commune-data'
import { hasGeorisquesData } from '@/lib/data/commune-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  locationData: LocationData | null
  villeName: string
  specialtySlug: string
}

// ---------------------------------------------------------------------------
// Service-specific risk insights
// ---------------------------------------------------------------------------

type ServiceCategory = 'plombier' | 'maçon' | 'couvreur' | 'electricien' | 'chauffagiste' | 'peintre' | 'menuisier' | 'carreleur' | 'terrassier' | 'default'

function getServiceCategory(slug: string): ServiceCategory {
  if (slug.includes('plomb') || slug.includes('sanitaire')) return 'plombier'
  if (slug.includes('macon') || slug.includes('maçon') || slug.includes('fondation') || slug.includes('gros-oeuvre')) return 'maçon'
  if (slug.includes('couv') || slug.includes('toiture') || slug.includes('zinguerie') || slug.includes('charpent')) return 'couvreur'
  if (slug.includes('electri') || slug.includes('domotique')) return 'electricien'
  if (slug.includes('chauffag') || slug.includes('climatisation') || slug.includes('pompe-a-chaleur')) return 'chauffagiste'
  if (slug.includes('peintr') || slug.includes('ravalement') || slug.includes('facade')) return 'peintre'
  if (slug.includes('menuis') || slug.includes('fenetre') || slug.includes('volet') || slug.includes('porte')) return 'menuisier'
  if (slug.includes('carrel') || slug.includes('sol') || slug.includes('parquet')) return 'carreleur'
  if (slug.includes('terrass') || slug.includes('assainissement') || slug.includes('drainage')) return 'terrassier'
  return 'default'
}

const INONDATION_INSIGHTS: Record<ServiceCategory, string> = {
  plombier: 'Risk of basement moisture and water backup — an experienced plumber can install backflow valves and sump pumps.',
  maçon: 'Foundations must be adapted to flood risk — waterproofing and perimeter drainage recommended.',
  couvreur: 'Roofing must withstand heavy rainfall — checking waterproofing and storm drains is essential.',
  electricien: 'Electrical panels should be elevated and circuits protected with GFCI breakers suitable for flood zones.',
  chauffagiste: 'Basement heating equipment requires specific flood protection measures.',
  peintre: 'Coatings in flood zones must be moisture-resistant — waterproof paints and special finishes recommended.',
  menuisier: 'Woodwork in flood zones should use water-resistant materials (PVC, aluminum) rather than untreated wood.',
  carreleur: 'Choose water-resistant, easily cleanable flooring for flood-prone areas.',
  terrassier: 'Proper site drainage is crucial — ditches, drain trenches, and relief wells can reduce risk.',
  default: 'Area exposed to flood risk — construction work must account for water management.',
}

const ARGILE_INSIGHTS: Record<ServiceCategory, string> = {
  plombier: 'Clay shrink-swell can damage buried pipes — flexible joints and connections recommended.',
  maçon: 'Reinforced foundations needed (rigid footings, grade beams) to prevent cracks from clay soil movement.',
  couvreur: 'Clay soil movement can warp the roof structure — regular alignment checks advised.',
  electricien: 'Buried conduits should be flexible to withstand clay soil movement.',
  chauffagiste: 'Radiant floor heating systems must be designed to absorb micro-movements in the slab.',
  peintre: 'Cracks from clay shrink-swell require pre-treatment before painting (reinforcement tape, flexible coatings).',
  menuisier: 'Soil movement can warp openings — choose woodwork with adjustable hinges and seals.',
  carreleur: 'Use flexible adhesives and expansion joints to absorb slab movement on clay soil.',
  terrassier: 'Excavation on clay soil requires precautions: drainage, stabilized base course, and proper compaction.',
  default: 'Clay soil subject to shrink-swell — construction must account for this constraint.',
}

// ---------------------------------------------------------------------------
// Risk level helpers
// ---------------------------------------------------------------------------

function getSismiqueLabel(zone: number): string {
  const labels: Record<number, string> = {
    1: 'Very low',
    2: 'Low',
    3: 'Moderate',
    4: 'Medium',
    5: 'High',
  }
  return labels[zone] || `Zone ${zone}`
}

function getRadonLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
  }
  return labels[level] || `Level ${level}`
}

function getRiskColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return 'border-amber-500 bg-amber-50'
    case 'medium': return 'border-orange-400 bg-orange-50'
    case 'low': return 'border-green-500 bg-green-50'
  }
}

function getRiskBadgeColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return 'bg-amber-100 text-amber-800'
    case 'medium': return 'bg-orange-100 text-orange-800'
    case 'low': return 'bg-green-100 text-green-800'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GeorisquesInsights({ locationData, villeName, specialtySlug }: Props) {
  if (!locationData || !hasGeorisquesData(locationData)) {
    return null
  }

  const serviceCategory = getServiceCategory(specialtySlug)
  const cards: React.ReactNode[] = []

  // --- Inondation ---
  if (locationData.risque_inondation) {
    cards.push(
      <div key="inondation" className={`rounded-lg border-l-4 p-4 ${getRiskColor('high')}`}>
        <div className="flex items-start gap-3">
          <Droplets className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Flood risk</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor('high')}`}>
                Exposed zone
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {INONDATION_INSIGHTS[serviceCategory]}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Argile ---
  if (locationData.risque_argile) {
    const argileLevel = locationData.risque_argile === 'fort' ? 'high'
      : locationData.risque_argile === 'moyen' ? 'medium' : 'low'

    cards.push(
      <div key="argile" className={`rounded-lg border-l-4 p-4 ${getRiskColor(argileLevel)}`}>
        <div className="flex items-start gap-3">
          <Mountain className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Clay shrink-swell</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(argileLevel)}`}>
                {locationData.risque_argile} risk
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {ARGILE_INSIGHTS[serviceCategory]}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Zone sismique ---
  if (locationData.zone_sismique && locationData.zone_sismique >= 2) {
    const sismiqueLevel = locationData.zone_sismique >= 4 ? 'high'
      : locationData.zone_sismique === 3 ? 'medium' : 'low'

    cards.push(
      <div key="sismique" className={`rounded-lg border-l-4 p-4 ${getRiskColor(sismiqueLevel)}`}>
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Seismic zone</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(sismiqueLevel)}`}>
                {getSismiqueLabel(locationData.zone_sismique)} (zone {locationData.zone_sismique})
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {locationData.zone_sismique >= 3
                ? `Construction in ${villeName} must comply with seismic building codes (IBC). Any contractor working on the structure must account for this.`
                : `Low but present seismicity — structural work must follow basic seismic construction standards.`
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Radon ---
  if (locationData.risque_radon && locationData.risque_radon >= 2) {
    const radonLevel = locationData.risque_radon === 3 ? 'high' : 'medium'

    cards.push(
      <div key="radon" className={`rounded-lg border-l-4 p-4 ${getRiskColor(radonLevel)}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Radon</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(radonLevel)}`}>
                {getRadonLabel(locationData.risque_radon)} potential
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {locationData.risque_radon === 3
                ? `${villeName} is in a high radon potential zone (category 3). A radon test is recommended, especially before basement or ground-floor renovations. Proper ventilation systems can reduce exposure.`
                : `Medium radon potential in ${villeName}. Measuring radon concentration may be relevant during renovation work.`
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- CatNat ---
  if (locationData.nb_catnat && locationData.nb_catnat > 0) {
    const catnatLevel = locationData.nb_catnat >= 10 ? 'high'
      : locationData.nb_catnat >= 5 ? 'medium' : 'low'

    cards.push(
      <div key="catnat" className={`rounded-lg border-l-4 p-4 ${getRiskColor(catnatLevel)}`}>
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Natural disasters</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(catnatLevel)}`}>
                {locationData.nb_catnat} declaration{locationData.nb_catnat > 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {locationData.nb_catnat} natural disaster declaration{locationData.nb_catnat > 1 ? 's have' : ' has'} been issued for {villeName} since 2000.
              {locationData.nb_catnat >= 5
                ? ' This significant number underscores the importance of choosing contractors familiar with local constraints.'
                : ''
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If no cards to show (e.g. all values are below display thresholds)
  if (cards.length === 0) {
    // Show a positive "low risk" message if we have data but no significant risks
    return (
      <section className="mt-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Natural hazards in {villeName}
        </h3>
        <div className={`rounded-lg border-l-4 p-4 ${getRiskColor('low')}`}>
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Low natural hazard risk</h4>
              <p className="mt-1 text-sm text-gray-700">
                {villeName} has an overall low natural hazard profile, which is favorable for construction and renovation work.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Risques naturels à {villeName}
      </h3>
      <div className="space-y-3">
        {cards}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Source: FEMA / USGS Natural Hazards data
      </p>
    </section>
  )
}
