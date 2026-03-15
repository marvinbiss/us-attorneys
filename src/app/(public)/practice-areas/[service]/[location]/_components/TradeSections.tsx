import Link from 'next/link'
import { hashCode } from '@/lib/seo/location-content'
import type { TradeContent } from '@/lib/data/trade-content'
import type { Service, Location as LocationType } from '@/types'
import PriceTable from '@/components/seo/PriceTable'

interface Props {
  trade: TradeContent
  service: Service
  location: LocationType
  specialtySlug: string
  locationSlug: string
  pricingMultiplier: number
}

export default function TradeSections({
  trade,
  service,
  location,
  specialtySlug,
  locationSlug,
  pricingMultiplier,
}: Props) {
  const tipHash = hashCode(`tips-${locationSlug}`)
  const tipCount = trade.tips?.length ?? 0
  const selectedTips = tipCount > 0
    ? Array.from({ length: Math.min(3, tipCount) }, (_, i) => trade.tips[(tipHash + i) % tipCount])
    : []

  return (
    <>
      {/* Trade expertise */}
      <section className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1 border-l-4 border-amber-500 pl-4">
            Pourquoi faire appel à un {service.name.toLowerCase()} professionnel à {location.name} ?
          </h2>
          <p className="text-gray-600 text-sm mt-2 pl-[calc(1rem+4px)]">
            Les critères essentiels pour trouver un {service.name.toLowerCase()} fiable et compétent à {location.name}{location.department_name ? `, ${location.department_name}` : ''}.
          </p>
          <div className="mt-6 space-y-4">
            {trade.certifications && trade.certifications.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-900 mb-2">Certifications et garanties à {location.name}</h3>
                <p className="text-sm text-emerald-800 mb-3">
                  Parmi les qualifications à rechercher pour un {service.name.toLowerCase()} à {location.name} ({location.department_code}) :
                </p>
                <div className="flex flex-wrap gap-2">
                  {trade.certifications.map((cert, i) => (
                    <span key={i} className="text-sm bg-white text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedTips.length > 0 && (
              <div className="bg-clay-50 border border-clay-100 rounded-xl p-4">
                <h3 className="font-semibold text-stone-800 mb-2">Conseils d&apos;expert à {location.name}</h3>
                <ul className="space-y-1">
                  {selectedTips.map((tip, i) => (
                    <li key={i} className="text-sm text-clay-700 flex items-start gap-2">
                      <span className="text-clay-300 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trade pricing */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1 border-l-4 border-amber-500 pl-4">
              Tarifs {service.name.toLowerCase()} à {location.name}
            </h2>
            <p className="text-gray-600 mb-6 text-sm pl-[calc(1rem+4px)]">
              Tarif horaire moyen à {location.name} : <strong className="text-gray-900">{Math.round(trade.priceRange.min * pricingMultiplier)}–{Math.round(trade.priceRange.max * pricingMultiplier)} {trade.priceRange.unit}</strong>.
              {pricingMultiplier !== 1.0 && ` Tarifs ajustés pour la zone de ${location.name}.`}
              {pricingMultiplier === 1.0 && ` Les prix à ${location.name} peuvent varier selon la complexité des travaux et le professionnel choisi.`}
            </p>
            <PriceTable
              tasks={pricingMultiplier !== 1.0
                ? trade.commonTasks.slice(0, 6).map((task) => {
                    const colonIndex = task.indexOf(' : ')
                    if (colonIndex === -1) return task
                    const label = task.slice(0, colonIndex)
                    const price = task.slice(colonIndex + 3).replace(/\d[\d\s]*/g, (m) => {
                      const n = parseInt(m.replace(/\s/g, ''), 10)
                      return isNaN(n) ? m : String(Math.round(n * pricingMultiplier))
                    })
                    return `${label} : ${price}`
                  })
                : trade.commonTasks.slice(0, 6)
              }
              tradeName={trade.name}
              priceRange={{
                min: Math.round(trade.priceRange.min * pricingMultiplier),
                max: Math.round(trade.priceRange.max * pricingMultiplier),
                unit: trade.priceRange.unit,
              }}
            />
            {trade.emergencyInfo && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-800">
                  <strong>Urgence {service.name.toLowerCase()} à {location.name} :</strong>{' '}
                  {trade.averageResponseTime}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">
              Les tarifs affichés sont indicatifs et basés sur les moyennes du marché{location.region_name ? ` en ${location.region_name}` : ''} pour un {service.name.toLowerCase()} à {location.name}.{' '}
              Demandez un devis personnalisé pour obtenir un prix précis adapté à votre projet.
            </p>
            <Link
              href={`/pricing/${specialtySlug}`}
              className="inline-flex items-center gap-2 mt-6 text-clay-400 hover:text-clay-700 text-sm font-medium group"
            >
              Voir tous les tarifs {service.name.toLowerCase()} en France
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
