import { Building2, Users, DollarSign, Zap, CloudRain } from 'lucide-react'
import { LocationData, formatNumber, formatDollarSign, monthName } from '@/lib/data/commune-data'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LocalDataInsightsProps {
  locationData: LocationData | null
  specialtySlug: string
  specialtyName: string
  villeName: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocalDataInsights({
  locationData,
  specialtyName,
  villeName,
}: LocalDataInsightsProps) {
  if (!locationData) return null

  const c = locationData
  const gentile = c.gentile ? `the ${c.gentile}` : `the residents of ${villeName}`

  // Check if we have enough data to render at least one section
  const hasMarche = c.nb_entreprises_artisanales || c.nb_artisans_btp || c.nb_artisans_rge
  const hasImmo = c.prix_m2_moyen || c.nb_logements || c.nb_transactions_annuelles
  const hasDpe = c.pct_passoires_dpe != null || c.nb_dpe_total || c.nb_maprimerenov_annuel
  const hasClimat = c.jours_gel_annuels != null || c.precipitation_annuelle || c.mois_travaux_ext_debut
  const hasSocio = c.revenu_median

  if (!hasMarche && !hasImmo && !hasDpe && !hasClimat && !hasSocio) return null

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {villeName} by the numbers: key data for your legal needs
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Local data that impacts the legal market and {specialtyName.toLowerCase()} fees in {villeName}.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* 1. Local legal market */}
          {hasMarche && (
            <InsightCard
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              title="Local legal market"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.nb_entreprises_artisanales && (
                  <>In {villeName}, {formatNumber(c.nb_entreprises_artisanales)} law firms are listed{c.nb_artisans_btp ? `, including ${formatNumber(c.nb_artisans_btp)} in litigation` : ''}. </>
                )}
                {c.nb_artisans_rge != null && c.nb_artisans_rge > 0 && (
                  <>With {formatNumber(c.nb_artisans_rge)} verified attorney{c.nb_artisans_rge > 1 ? 's' : ''}, {
                    c.nb_entreprises_artisanales && c.nb_entreprises_artisanales > 500
                      ? 'competition is strong, which helps keep fees competitive'
                      : 'there is a reasonable selection for quality legal services'
                  }. </>
                )}
                {c.population > 0 && c.densite_population != null && (
                  <>The city has {formatNumber(c.population)} residents with a density of {formatNumber(Math.round(c.densite_population))} per sq mi.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 2. Real estate & property */}
          {hasImmo && (
            <InsightCard
              icon={<DollarSign className="w-5 h-5 text-amber-600" />}
              title="Real estate & property"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.prix_m2_moyen && (
                  <>The average price per sq ft in {villeName} is {formatDollarSign(c.prix_m2_moyen)}. </>
                )}
                {c.prix_m2_maison && c.prix_m2_appartement && (
                  <>Houses: {formatDollarSign(c.prix_m2_maison)}/sq ft, condos: {formatDollarSign(c.prix_m2_appartement)}/sq ft. </>
                )}
                {c.part_maisons_pct != null && (
                  <>With {c.part_maisons_pct > 50
                    ? `${c.part_maisons_pct}% single-family homes, real estate legal needs are common`
                    : `${100 - c.part_maisons_pct}% condos/apartments, HOA and property law needs are frequent`
                  }. </>
                )}
                {c.nb_transactions_annuelles != null && c.nb_transactions_annuelles > 0 && (
                  <>Approximately {formatNumber(c.nb_transactions_annuelles)} real estate transactions per year generate legal service needs for {gentile}.</>
                )}
                {c.nb_logements != null && c.nb_logements > 0 && !c.nb_transactions_annuelles && (
                  <>The housing stock includes {formatNumber(c.nb_logements)} units.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 3. Energy performance */}
          {hasDpe && (
            <InsightCard
              icon={<Zap className="w-5 h-5 text-green-600" />}
              title="Energy performance"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.pct_passoires_dpe != null && (
                  <>{c.pct_passoires_dpe}% of homes in {villeName} have poor energy ratings (classes F-G). </>
                )}
                {c.nb_dpe_total != null && c.nb_dpe_total > 0 && (
                  <>{formatNumber(c.nb_dpe_total)} energy performance assessments have been completed. </>
                )}
                {c.nb_maprimerenov_annuel != null && c.nb_maprimerenov_annuel > 0 && (
                  <>{formatNumber(c.nb_maprimerenov_annuel)} energy efficiency applications have been filed, reflecting strong demand for renovation services.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 4. Climate & seasonality */}
          {hasClimat && (
            <InsightCard
              icon={<CloudRain className="w-5 h-5 text-sky-600" />}
              title="Climate & seasonality"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.jours_gel_annuels != null && c.precipitation_annuelle != null && (
                  <>With {c.jours_gel_annuels} frost days per year and {formatNumber(c.precipitation_annuelle)} mm of precipitation, </>
                )}
                {c.jours_gel_annuels != null && c.precipitation_annuelle == null && (
                  <>With {c.jours_gel_annuels} frost days per year, </>
                )}
                {c.jours_gel_annuels == null && c.precipitation_annuelle != null && (
                  <>With {formatNumber(c.precipitation_annuelle)} mm of annual precipitation, </>
                )}
                {c.mois_travaux_ext_debut && c.mois_travaux_ext_fin ? (
                  <>outdoor work is optimal from {monthName(c.mois_travaux_ext_debut)} to {monthName(c.mois_travaux_ext_fin)}. </>
                ) : (
                  <>weather conditions influence the project schedule. </>
                )}
                {c.temperature_moyenne_hiver != null && c.temperature_moyenne_ete != null && (
                  <>Average temperatures range from {c.temperature_moyenne_hiver}°C in winter to {c.temperature_moyenne_ete}°C in summer, a key factor for insulation and heating.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 5. Socioeconomic context */}
          {hasSocio && (
            <InsightCard
              icon={<Users className="w-5 h-5 text-purple-600" />}
              title="Socioeconomic context"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                The median income in {villeName} is {formatDollarSign(c.revenu_median!)}/year.{' '}
                {c.revenu_median! < 22000 ? (
                  <>This income level means many households may qualify for legal aid or pro bono services, significantly reducing legal costs for {gentile}.</>
                ) : c.revenu_median! < 30000 ? (
                  <>Some households may qualify for reduced-fee legal services, making it easier to afford legal representation for {gentile}.</>
                ) : (
                  <>With higher purchasing power, {gentile} regularly invest in quality legal services and comprehensive representation.</>
                )}
                {c.prix_m2_moyen && (
                  <> Combined with real estate prices of {formatDollarSign(c.prix_m2_moyen)}/sq ft, property-related legal services remain in high demand.</>
                )}
              </p>
            </InsightCard>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function InsightCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}
