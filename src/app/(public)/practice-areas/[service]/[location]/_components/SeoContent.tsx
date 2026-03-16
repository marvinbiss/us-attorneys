import Link from 'next/link'
import { getNeighborhoodsByCity } from '@/lib/data/usa'
import type { LocationContent } from '@/lib/seo/location-content'
import type { LocationData } from '@/lib/data/location-data'
import { formatNumber, formatEuro } from '@/lib/data/location-data'
import type { Service, Location as LocationType } from '@/types'
import type { TradeContent } from '@/lib/data/trade-content'

interface Props {
  locationContent: LocationContent | null
  locationData: LocationData | null
  service: Service
  location: LocationType
  locationSlug: string
  attorneyCount: number
  trade: TradeContent | null
  pricingMultiplier: number
}

export default function SeoContent({
  locationContent,
  locationData,
  service,
  location,
  locationSlug,
  attorneyCount,
  trade,
  pricingMultiplier,
}: Props) {
  return (
    <>
      {/* Location content (present) */}
      {locationContent && (
        <section className="py-12 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="prose prose-gray max-w-none">
                <h2 className="border-l-4 border-amber-500 pl-4 !mt-0">
                  Find a {service.name.toLowerCase()} in {location.name}
                </h2>
                <p>{locationContent.introText}</p>

                <h3>Fees and Pricing for a {service.name.toLowerCase()} in {location.name}</h3>
                <p>{locationContent.pricingNote}</p>

                <h3>Tips for Your Legal Services in {location.name}</h3>
                <ul>
                  {locationContent.localTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>

                <h3>Local Context: {locationContent.climateLabel}</h3>
                <p>{locationContent.climateTip}</p>

                <h3>Service Areas in {location.name}</h3>
                <p>{locationContent.neighborhoodText}</p>
                {getNeighborhoodsByCity(locationSlug).length > 0 && (
                  <div className="not-prose flex flex-wrap gap-2 mt-4">
                    {getNeighborhoodsByCity(locationSlug).slice(0, 10).map(({ name, slug }) => (
                      <Link key={slug} href={`/cities/${locationSlug}/${slug}`} className="text-sm bg-clay-50 text-clay-600 px-3 py-1.5 rounded-full hover:bg-clay-100 transition-colors">
                        {name}
                      </Link>
                    ))}
                  </div>
                )}

                <p>{locationContent.conclusion}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Fallback when no locationContent */}
      {!locationContent && (
        <section className="py-12 bg-gray-50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="prose prose-gray max-w-none">
                <h2 className="border-l-4 border-amber-500 pl-4 !mt-0">
                  Find a {service.name.toLowerCase()} in {location.name}
                </h2>
                <p>
                  Looking for a {service.name.toLowerCase()} in {location.name} (
                  {location.postal_code})? We offer a selection of{' '}
                  {attorneyCount} qualified professionals in your city.
                  {location.department_name && ` Our directory covers all of ${location.department_name} (${location.department_code}).`}
                </p>
                {trade && (
                  <>
                    <h3>Indicative Fees in {location.name}</h3>
                    <p>
                      The average hourly fee for a {service.name.toLowerCase()} in {location.name} ranges
                      between <strong>{Math.round(trade.priceRange.min * pricingMultiplier)} and {Math.round(trade.priceRange.max * pricingMultiplier)} {trade.priceRange.unit}</strong>.
                      Prices vary depending on case complexity and the professional chosen.
                    </p>
                    {trade.certifications && trade.certifications.length > 0 && (
                      <>
                        <h3>Certifications to Verify</h3>
                        <p>
                          Before choosing a {service.name.toLowerCase()}, verify they hold
                          the following certifications: {trade.certifications.slice(0, 3).join(', ')}.
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Data-driven sections */}
      {locationContent?.dataDriven && (
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

            {locationContent.dataDriven.socioEconomic && (
              <div className="bg-gradient-to-br from-sand-50 to-clay-50/30 rounded-2xl border border-slate-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-clay-400 pl-4">
                  Socio-Economic Context of {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.socioEconomic}</p>
                {locationData && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {locationData.revenu_median && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{formatEuro(locationData.revenu_median)}</div>
                        <div className="text-xs text-gray-500 mt-1">Median Income/yr</div>
                      </div>
                    )}
                    {locationData.nb_logements && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{formatNumber(locationData.nb_logements)}</div>
                        <div className="text-xs text-gray-500 mt-1">Housing Units</div>
                      </div>
                    )}
                    {locationData.part_maisons_pct !== null && locationData.part_maisons_pct !== undefined && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{locationData.part_maisons_pct}%</div>
                        <div className="text-xs text-gray-500 mt-1">Single-Family Homes</div>
                      </div>
                    )}
                    {locationData.densite_population && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{formatNumber(Math.round(locationData.densite_population))}</div>
                        <div className="text-xs text-gray-500 mt-1">Pop./sq mi</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.realEstate && (
              <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
                  Real Estate Market in {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.realEstate}</p>
                {locationData && (locationData.prix_m2_moyen || locationData.prix_m2_maison) && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {locationData.prix_m2_moyen && (
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-lg font-bold text-amber-700">{formatEuro(locationData.prix_m2_moyen)}/m²</div>
                        <div className="text-xs text-gray-500 mt-1">Average Price</div>
                      </div>
                    )}
                    {locationData.prix_m2_maison && (
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-lg font-bold text-amber-700">{formatEuro(locationData.prix_m2_maison)}/m²</div>
                        <div className="text-xs text-gray-500 mt-1">Houses</div>
                      </div>
                    )}
                    {locationData.prix_m2_appartement && (
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-lg font-bold text-amber-700">{formatEuro(locationData.prix_m2_appartement)}/m²</div>
                        <div className="text-xs text-gray-500 mt-1">Apartments</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.legalMarket && (
              <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 rounded-2xl border border-emerald-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-emerald-500 pl-4">
                  Legal Market in {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.legalMarket}</p>
                {locationData && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {locationData.nb_entreprises_artisanales && (
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-700">{formatNumber(locationData.nb_entreprises_artisanales)}</div>
                        <div className="text-xs text-gray-500 mt-1">Law Firms</div>
                      </div>
                    )}
                    {locationData.nb_artisans_btp && (
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-700">{formatNumber(locationData.nb_artisans_btp)}</div>
                        <div className="text-xs text-gray-500 mt-1">Construction Companies</div>
                      </div>
                    )}
                    {locationData.nb_artisans_rge && (
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-700">{formatNumber(locationData.nb_artisans_rge)}</div>
                        <div className="text-xs text-gray-500 mt-1">Certified Specialists</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.legalAid && (
              <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 rounded-2xl border border-orange-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-4">
                  Energy Performance in {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.legalAid}</p>
                {locationData && (locationData.pct_passoires_dpe !== null || locationData.nb_maprimerenov_annuel) && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {locationData.pct_passoires_dpe !== null && locationData.pct_passoires_dpe !== undefined && (
                      <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                        <div className="text-lg font-bold text-orange-700">{locationData.pct_passoires_dpe}%</div>
                        <div className="text-xs text-gray-500 mt-1">Energy-Inefficient (F/G)</div>
                      </div>
                    )}
                    {locationData.nb_dpe_total && (
                      <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                        <div className="text-lg font-bold text-orange-700">{formatNumber(locationData.nb_dpe_total)}</div>
                        <div className="text-xs text-gray-500 mt-1">Energy Audits</div>
                      </div>
                    )}
                    {locationData.nb_maprimerenov_annuel && (
                      <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                        <div className="text-lg font-bold text-orange-700">{formatNumber(locationData.nb_maprimerenov_annuel)}</div>
                        <div className="text-xs text-gray-500 mt-1">Energy Grant Applications/yr</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.climatData && (
              <div className="bg-gradient-to-br from-sky-50/50 to-cyan-50/30 rounded-2xl border border-sky-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-sky-500 pl-4">
                  Climate and Seasonality in {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.climatData}</p>
                {locationData && (locationData.jours_gel_annuels !== null || locationData.precipitation_annuelle !== null) && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {locationData.jours_gel_annuels !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{locationData.jours_gel_annuels}</div>
                        <div className="text-xs text-gray-500 mt-1">Frost Days/yr</div>
                      </div>
                    )}
                    {locationData.precipitation_annuelle !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{formatNumber(locationData.precipitation_annuelle)} mm</div>
                        <div className="text-xs text-gray-500 mt-1">Precipitation/yr</div>
                      </div>
                    )}
                    {locationData.temperature_moyenne_hiver !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{locationData.temperature_moyenne_hiver?.toFixed(1)} °C</div>
                        <div className="text-xs text-gray-500 mt-1">Avg. Winter</div>
                      </div>
                    )}
                    {locationData.temperature_moyenne_ete !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{locationData.temperature_moyenne_ete?.toFixed(1)} °C</div>
                        <div className="text-xs text-gray-500 mt-1">Avg. Summer</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.localDemand && (
              <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 rounded-2xl border border-violet-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-violet-500 pl-4">
                  Local Demand for {service.name.toLowerCase()} in {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.localDemand}</p>
              </div>
            )}

            {locationContent.dataDriven.regulations && (
              <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/30 rounded-2xl border border-rose-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-rose-500 pl-4">
                  Regulations and Standards — {service.name.toLowerCase()} in {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.regulations}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}
