import Link from 'next/link'
import { getNeighborhoodsByCity } from '@/lib/data/usa'
import type { LocationContent } from '@/lib/seo/location-content'
import type { LocationData } from '@/lib/data/commune-data'
import { formatNumber, formatEuro } from '@/lib/data/commune-data'
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
                  Trouver un {service.name.toLowerCase()} à {location.name}
                </h2>
                <p>{locationContent.introText}</p>

                <h3>Tarifs et prix d&apos;un {service.name.toLowerCase()} à {location.name}</h3>
                <p>{locationContent.pricingNote}</p>

                <h3>Conseils pour vos travaux à {location.name}</h3>
                <ul>
                  {locationContent.localTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>

                <h3>Contexte local : {locationContent.climateLabel}</h3>
                <p>{locationContent.climateTip}</p>

                <h3>Zones d&apos;intervention à {location.name}</h3>
                <p>{locationContent.quartierText}</p>
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
                  Trouver un {service.name.toLowerCase()} à {location.name}
                </h2>
                <p>
                  Vous recherchez un {service.name.toLowerCase()} à {location.name} (
                  {location.postal_code}) ? ServicesArtisans vous propose une sélection de{' '}
                  {attorneyCount} professionnels qualifiés dans votre ville.
                  {location.department_name && ` Notre annuaire couvre l'ensemble du département ${location.department_name} (${location.department_code}).`}
                </p>
                {trade && (
                  <>
                    <h3>Tarifs indicatifs à {location.name}</h3>
                    <p>
                      Le tarif horaire moyen d&apos;un {service.name.toLowerCase()} à {location.name} se situe
                      entre <strong>{Math.round(trade.priceRange.min * pricingMultiplier)} et {Math.round(trade.priceRange.max * pricingMultiplier)} {trade.priceRange.unit}</strong>.
                      Les prix varient selon la complexité des travaux et le professionnel choisi.
                    </p>
                    {trade.certifications && trade.certifications.length > 0 && (
                      <>
                        <h3>Certifications à vérifier</h3>
                        <p>
                          Avant de choisir un {service.name.toLowerCase()}, vérifiez qu&apos;il dispose
                          des certifications suivantes : {trade.certifications.slice(0, 3).join(', ')}.
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
                  Contexte socio-économique de {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.socioEconomic}</p>
                {locationData && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {locationData.revenu_median && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{formatEuro(locationData.revenu_median)}</div>
                        <div className="text-xs text-gray-500 mt-1">Revenu médian/an</div>
                      </div>
                    )}
                    {locationData.nb_logements && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{formatNumber(locationData.nb_logements)}</div>
                        <div className="text-xs text-gray-500 mt-1">Logements</div>
                      </div>
                    )}
                    {locationData.part_maisons_pct !== null && locationData.part_maisons_pct !== undefined && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{locationData.part_maisons_pct}%</div>
                        <div className="text-xs text-gray-500 mt-1">Maisons individuelles</div>
                      </div>
                    )}
                    {locationData.densite_population && (
                      <div className="text-center p-3 bg-white rounded-xl border border-slate-100">
                        <div className="text-lg font-bold text-clay-600">{formatNumber(Math.round(locationData.densite_population))}</div>
                        <div className="text-xs text-gray-500 mt-1">Hab./km²</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.immobilier && (
              <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-amber-500 pl-4">
                  Marché immobilier à {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.immobilier}</p>
                {locationData && (locationData.prix_m2_moyen || locationData.prix_m2_maison) && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {locationData.prix_m2_moyen && (
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-lg font-bold text-amber-700">{formatEuro(locationData.prix_m2_moyen)}/m²</div>
                        <div className="text-xs text-gray-500 mt-1">Prix moyen</div>
                      </div>
                    )}
                    {locationData.prix_m2_maison && (
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-lg font-bold text-amber-700">{formatEuro(locationData.prix_m2_maison)}/m²</div>
                        <div className="text-xs text-gray-500 mt-1">Maisons</div>
                      </div>
                    )}
                    {locationData.prix_m2_appartement && (
                      <div className="text-center p-3 bg-white rounded-xl border border-amber-100">
                        <div className="text-lg font-bold text-amber-700">{formatEuro(locationData.prix_m2_appartement)}/m²</div>
                        <div className="text-xs text-gray-500 mt-1">Appartements</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.marcheArtisanal && (
              <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 rounded-2xl border border-emerald-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-emerald-500 pl-4">
                  Marché artisanal à {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.marcheArtisanal}</p>
                {locationData && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {locationData.nb_entreprises_artisanales && (
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-700">{formatNumber(locationData.nb_entreprises_artisanales)}</div>
                        <div className="text-xs text-gray-500 mt-1">Entreprises artisanales</div>
                      </div>
                    )}
                    {locationData.nb_artisans_btp && (
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-700">{formatNumber(locationData.nb_artisans_btp)}</div>
                        <div className="text-xs text-gray-500 mt-1">Entreprises BTP</div>
                      </div>
                    )}
                    {locationData.nb_artisans_rge && (
                      <div className="text-center p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="text-lg font-bold text-emerald-700">{formatNumber(locationData.nb_artisans_rge)}</div>
                        <div className="text-xs text-gray-500 mt-1">Certifiés RGE</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.energetique && (
              <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 rounded-2xl border border-orange-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-4">
                  Performance énergétique à {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.energetique}</p>
                {locationData && (locationData.pct_passoires_dpe !== null || locationData.nb_maprimerenov_annuel) && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {locationData.pct_passoires_dpe !== null && locationData.pct_passoires_dpe !== undefined && (
                      <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                        <div className="text-lg font-bold text-orange-700">{locationData.pct_passoires_dpe}%</div>
                        <div className="text-xs text-gray-500 mt-1">Passoires thermiques (F/G)</div>
                      </div>
                    )}
                    {locationData.nb_dpe_total && (
                      <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                        <div className="text-lg font-bold text-orange-700">{formatNumber(locationData.nb_dpe_total)}</div>
                        <div className="text-xs text-gray-500 mt-1">DPE réalisés</div>
                      </div>
                    )}
                    {locationData.nb_maprimerenov_annuel && (
                      <div className="text-center p-3 bg-white rounded-xl border border-orange-100">
                        <div className="text-lg font-bold text-orange-700">{formatNumber(locationData.nb_maprimerenov_annuel)}</div>
                        <div className="text-xs text-gray-500 mt-1">Dossiers MaPrimeRénov&apos;/an</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.climatData && (
              <div className="bg-gradient-to-br from-sky-50/50 to-cyan-50/30 rounded-2xl border border-sky-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-sky-500 pl-4">
                  Climat et saisonnalité à {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.climatData}</p>
                {locationData && (locationData.jours_gel_annuels !== null || locationData.precipitation_annuelle !== null) && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {locationData.jours_gel_annuels !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{locationData.jours_gel_annuels}</div>
                        <div className="text-xs text-gray-500 mt-1">Jours de gel/an</div>
                      </div>
                    )}
                    {locationData.precipitation_annuelle !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{formatNumber(locationData.precipitation_annuelle)} mm</div>
                        <div className="text-xs text-gray-500 mt-1">Précipitations/an</div>
                      </div>
                    )}
                    {locationData.temperature_moyenne_hiver !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{locationData.temperature_moyenne_hiver?.toFixed(1)} °C</div>
                        <div className="text-xs text-gray-500 mt-1">Moy. hiver</div>
                      </div>
                    )}
                    {locationData.temperature_moyenne_ete !== null && (
                      <div className="text-center p-3 bg-white rounded-xl border border-sky-100">
                        <div className="text-lg font-bold text-sky-700">{locationData.temperature_moyenne_ete?.toFixed(1)} °C</div>
                        <div className="text-xs text-gray-500 mt-1">Moy. été</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {locationContent.dataDriven.demandeLocale && (
              <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 rounded-2xl border border-violet-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-violet-500 pl-4">
                  Demande locale en {service.name.toLowerCase()} à {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.demandeLocale}</p>
              </div>
            )}

            {locationContent.dataDriven.reglementation && (
              <div className="bg-gradient-to-br from-rose-50/50 to-pink-50/30 rounded-2xl border border-rose-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-rose-500 pl-4">
                  Réglementation et normes — {service.name.toLowerCase()} à {location.name}
                </h2>
                <p className="text-gray-700 leading-relaxed">{locationContent.dataDriven.reglementation}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}
