import { AlertTriangle, Droplets, Mountain, Activity, Shield, CheckCircle } from 'lucide-react'
import type { CommuneData } from '@/lib/data/commune-data'
import { hasGeorisquesData } from '@/lib/data/commune-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  communeData: CommuneData | null
  villeName: string
  serviceSlug: string
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
  plombier: 'Risque d\'humidité en sous-sol et remontées d\'eau — un plombier expérimenté peut installer des clapets anti-retour et pompes de relevage.',
  maçon: 'Les fondations doivent être adaptées au risque d\'inondation — cuvelage et drainage périphérique recommandés.',
  couvreur: 'Les toitures doivent résister aux épisodes de pluies intenses — vérification de l\'étanchéité et des évacuations pluviales essentielle.',
  electricien: 'Le tableau électrique doit être placé en hauteur et les circuits protégés par des différentiels adaptés aux zones inondables.',
  chauffagiste: 'Les équipements de chauffage en sous-sol nécessitent une protection spécifique contre les inondations.',
  peintre: 'Les revêtements en zone inondable doivent résister à l\'humidité — peintures hydrofuges et enduits spéciaux recommandés.',
  menuisier: 'Les menuiseries en zone inondable doivent être en matériaux résistants à l\'eau (PVC, aluminium) plutôt qu\'en bois non traité.',
  carreleur: 'Privilégier des revêtements de sol résistants à l\'eau et facilement nettoyables après une inondation.',
  terrassier: 'Un bon drainage du terrain est crucial — fossés, tranchées drainantes et puits de décompression peuvent réduire le risque.',
  default: 'Zone exposée au risque d\'inondation — les travaux doivent prendre en compte la gestion des eaux.',
}

const ARGILE_INSIGHTS: Record<ServiceCategory, string> = {
  plombier: 'Le retrait-gonflement des argiles peut endommager les canalisations enterrées — joints souples et raccords flexibles recommandés.',
  maçon: 'Fondations renforcées nécessaires (semelles rigides, longrines) pour prévenir les fissures liées au mouvement du sol argileux.',
  couvreur: 'Les mouvements de terrain argileux peuvent déformer la charpente — vérification régulière de l\'alignement de la toiture conseillée.',
  electricien: 'Les gaines enterrées doivent être flexibles pour résister aux mouvements de terrain argileux.',
  chauffagiste: 'Les réseaux de chauffage au sol doivent être dimensionnés pour absorber les micro-mouvements de la dalle.',
  peintre: 'Les fissures liées au retrait-gonflement des argiles nécessitent un traitement préalable avant toute mise en peinture (bandes armées, enduits souples).',
  menuisier: 'Les mouvements de terrain peuvent déformer les ouvertures — privilégier des menuiseries avec réglage possible des gonds et des joints.',
  carreleur: 'Utiliser des colles souples et des joints de dilatation adaptés pour absorber les mouvements de la dalle sur sol argileux.',
  terrassier: 'Le terrassement sur sol argileux exige des précautions : drainage, couche de forme stabilisée et compactage adapté.',
  default: 'Sol argileux sujet au retrait-gonflement — les travaux doivent intégrer cette contrainte.',
}

// ---------------------------------------------------------------------------
// Risk level helpers
// ---------------------------------------------------------------------------

function getSismiqueLabel(zone: number): string {
  const labels: Record<number, string> = {
    1: 'Très faible',
    2: 'Faible',
    3: 'Modérée',
    4: 'Moyenne',
    5: 'Forte',
  }
  return labels[zone] || `Zone ${zone}`
}

function getRadonLabel(level: number): string {
  const labels: Record<number, string> = {
    1: 'Faible',
    2: 'Moyen',
    3: 'Élevé',
  }
  return labels[level] || `Niveau ${level}`
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

export default function GeorisquesInsights({ communeData, villeName, serviceSlug }: Props) {
  if (!communeData || !hasGeorisquesData(communeData)) {
    return null
  }

  const serviceCategory = getServiceCategory(serviceSlug)
  const cards: React.ReactNode[] = []

  // --- Inondation ---
  if (communeData.risque_inondation) {
    cards.push(
      <div key="inondation" className={`rounded-lg border-l-4 p-4 ${getRiskColor('high')}`}>
        <div className="flex items-start gap-3">
          <Droplets className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Risque d&apos;inondation</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor('high')}`}>
                Zone exposée
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
  if (communeData.risque_argile) {
    const argileLevel = communeData.risque_argile === 'fort' ? 'high'
      : communeData.risque_argile === 'moyen' ? 'medium' : 'low'

    cards.push(
      <div key="argile" className={`rounded-lg border-l-4 p-4 ${getRiskColor(argileLevel)}`}>
        <div className="flex items-start gap-3">
          <Mountain className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Retrait-gonflement des argiles</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(argileLevel)}`}>
                Risque {communeData.risque_argile}
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
  if (communeData.zone_sismique && communeData.zone_sismique >= 2) {
    const sismiqueLevel = communeData.zone_sismique >= 4 ? 'high'
      : communeData.zone_sismique === 3 ? 'medium' : 'low'

    cards.push(
      <div key="sismique" className={`rounded-lg border-l-4 p-4 ${getRiskColor(sismiqueLevel)}`}>
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Zone sismique</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(sismiqueLevel)}`}>
                {getSismiqueLabel(communeData.zone_sismique)} (zone {communeData.zone_sismique})
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {communeData.zone_sismique >= 3
                ? `Les constructions à ${villeName} doivent respecter les normes parasismiques (Eurocode 8). Tout artisan intervenant sur le bâti doit en tenir compte.`
                : `Sismicité faible mais présente — les travaux structurels doivent respecter les règles de construction parasismique de base.`
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Radon ---
  if (communeData.risque_radon && communeData.risque_radon >= 2) {
    const radonLevel = communeData.risque_radon === 3 ? 'high' : 'medium'

    cards.push(
      <div key="radon" className={`rounded-lg border-l-4 p-4 ${getRiskColor(radonLevel)}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Radon</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(radonLevel)}`}>
                Potentiel {getRadonLabel(communeData.risque_radon)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {communeData.risque_radon === 3
                ? `${villeName} est en zone à potentiel radon élevé (catégorie 3). Un diagnostic radon est recommandé, surtout avant des travaux de rénovation en sous-sol ou rez-de-chaussée. Des systèmes de ventilation adaptés peuvent réduire l'exposition.`
                : `Potentiel radon moyen à ${villeName}. Une mesure de la concentration en radon peut être pertinente lors de travaux de rénovation.`
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- CatNat ---
  if (communeData.nb_catnat && communeData.nb_catnat > 0) {
    const catnatLevel = communeData.nb_catnat >= 10 ? 'high'
      : communeData.nb_catnat >= 5 ? 'medium' : 'low'

    cards.push(
      <div key="catnat" className={`rounded-lg border-l-4 p-4 ${getRiskColor(catnatLevel)}`}>
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Catastrophes naturelles</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeColor(catnatLevel)}`}>
                {communeData.nb_catnat} arrêté{communeData.nb_catnat > 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              {communeData.nb_catnat} arrêté{communeData.nb_catnat > 1 ? 's' : ''} de catastrophe naturelle
              {communeData.nb_catnat > 1 ? ' ont été pris' : ' a été pris'} à {villeName} depuis 2000.
              {communeData.nb_catnat >= 5
                ? ' Ce nombre significatif souligne l\'importance de choisir des artisans connaissant les contraintes locales.'
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
          Risques naturels à {villeName}
        </h3>
        <div className={`rounded-lg border-l-4 p-4 ${getRiskColor('low')}`}>
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Risques naturels faibles</h4>
              <p className="mt-1 text-sm text-gray-700">
                {villeName} présente un profil de risques naturels globalement faible, ce qui est favorable pour les travaux de construction et rénovation.
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
        Source : Géorisques (BRGM / Ministère de la Transition écologique)
      </p>
    </section>
  )
}
