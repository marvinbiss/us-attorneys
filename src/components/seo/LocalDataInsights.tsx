import { Building2, Users, Euro, Zap, CloudRain } from 'lucide-react'
import { CommuneData, formatNumber, formatEuro, monthName } from '@/lib/data/commune-data'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LocalDataInsightsProps {
  communeData: CommuneData | null
  serviceSlug: string
  serviceName: string
  villeName: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocalDataInsights({
  communeData,
  serviceName,
  villeName,
}: LocalDataInsightsProps) {
  if (!communeData) return null

  const c = communeData
  const gentile = c.gentile ? `les ${c.gentile}` : `les habitants de ${villeName}`

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
          {villeName} en chiffres : donn{'é'}es cl{'é'}s pour vos travaux
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Donn{'é'}es locales qui impactent le march{'é'} de la r{'é'}novation et les tarifs de {serviceName.toLowerCase()} {'à'} {villeName}.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* 1. Marché local de la rénovation */}
          {hasMarche && (
            <InsightCard
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              title="Marché local de la rénovation"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.nb_entreprises_artisanales && (
                  <>{'À'} {villeName}, {formatNumber(c.nb_entreprises_artisanales)} entreprises artisanales sont r{'é'}f{'é'}renc{'é'}es{c.nb_artisans_btp ? ` dont ${formatNumber(c.nb_artisans_btp)} dans le BTP` : ''}. </>
                )}
                {c.nb_artisans_rge != null && c.nb_artisans_rge > 0 && (
                  <>Avec {formatNumber(c.nb_artisans_rge)} artisan{c.nb_artisans_rge > 1 ? 's' : ''} RGE certifi{'é'}{c.nb_artisans_rge > 1 ? 's' : ''}, {
                    c.nb_entreprises_artisanales && c.nb_entreprises_artisanales > 500
                      ? 'la concurrence est forte, ce qui favorise des tarifs compétitifs'
                      : 'le choix reste raisonnable pour des travaux de qualité'
                  }. </>
                )}
                {c.population > 0 && c.densite_population != null && (
                  <>La commune compte {formatNumber(c.population)} habitants avec une densit{'é'} de {formatNumber(Math.round(c.densite_population))} hab/km{'²'}.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 2. Immobilier & patrimoine */}
          {hasImmo && (
            <InsightCard
              icon={<Euro className="w-5 h-5 text-amber-600" />}
              title="Immobilier & patrimoine"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.prix_m2_moyen && (
                  <>Le prix moyen au m{'²'} {'à'} {villeName} est de {formatEuro(c.prix_m2_moyen)}. </>
                )}
                {c.prix_m2_maison && c.prix_m2_appartement && (
                  <>Maisons : {formatEuro(c.prix_m2_maison)}/m{'²'}, appartements : {formatEuro(c.prix_m2_appartement)}/m{'²'}. </>
                )}
                {c.part_maisons_pct != null && (
                  <>Avec {c.part_maisons_pct > 50
                    ? `${c.part_maisons_pct} % de maisons, les travaux individuels (toiture, façade) sont fréquents`
                    : `${100 - c.part_maisons_pct} % d'appartements, les travaux de copropriété sont fréquents`
                  }. </>
                )}
                {c.nb_transactions_annuelles != null && c.nb_transactions_annuelles > 0 && (
                  <>Environ {formatNumber(c.nb_transactions_annuelles)} transactions immobili{'è'}res par an g{'é'}n{'è'}rent des besoins en travaux pour {gentile}.</>
                )}
                {c.nb_logements != null && c.nb_logements > 0 && !c.nb_transactions_annuelles && (
                  <>Le parc immobilier compte {formatNumber(c.nb_logements)} logements.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 3. Performance énergétique */}
          {hasDpe && (
            <InsightCard
              icon={<Zap className="w-5 h-5 text-green-600" />}
              title="Performance énergétique"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.pct_passoires_dpe != null && (
                  <>{c.pct_passoires_dpe}{' '}% des logements {c.gentile ? `${c.gentile.toLowerCase().charAt(0) === 'l' ? 'des ' : 'de '}${villeName.toLowerCase()}` : `de ${villeName}`} sont des passoires thermiques (classes F-G). </>
                )}
                {c.nb_dpe_total != null && c.nb_dpe_total > 0 && (
                  <>{formatNumber(c.nb_dpe_total)} diagnostics de performance {'é'}nerg{'é'}tique ont {'é'}t{'é'} r{'é'}alis{'é'}s. </>
                )}
                {c.nb_maprimerenov_annuel != null && c.nb_maprimerenov_annuel > 0 && (
                  <>{formatNumber(c.nb_maprimerenov_annuel)} dossiers MaPrimeR{'é'}nov{"'"} ont {'é'}t{'é'} d{'é'}pos{'é'}s, t{'é'}moignant d{"'"}une demande forte en r{'é'}novation {'é'}nerg{'é'}tique.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 4. Climat & saisonnalité */}
          {hasClimat && (
            <InsightCard
              icon={<CloudRain className="w-5 h-5 text-sky-600" />}
              title="Climat & saisonnalité"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.jours_gel_annuels != null && c.precipitation_annuelle != null && (
                  <>Avec {c.jours_gel_annuels} jours de gel par an et {formatNumber(c.precipitation_annuelle)}{' '}mm de pr{'é'}cipitations, </>
                )}
                {c.jours_gel_annuels != null && c.precipitation_annuelle == null && (
                  <>Avec {c.jours_gel_annuels} jours de gel par an, </>
                )}
                {c.jours_gel_annuels == null && c.precipitation_annuelle != null && (
                  <>Avec {formatNumber(c.precipitation_annuelle)}{' '}mm de pr{'é'}cipitations annuelles, </>
                )}
                {c.mois_travaux_ext_debut && c.mois_travaux_ext_fin ? (
                  <>les travaux ext{'é'}rieurs sont optimaux de {monthName(c.mois_travaux_ext_debut)} {'à'} {monthName(c.mois_travaux_ext_fin)}. </>
                ) : (
                  <>les conditions climatiques influencent le calendrier des travaux. </>
                )}
                {c.temperature_moyenne_hiver != null && c.temperature_moyenne_ete != null && (
                  <>Les temp{'é'}ratures moyennes varient de {c.temperature_moyenne_hiver}{' '}{'°'}C en hiver {'à'} {c.temperature_moyenne_ete}{' '}{'°'}C en {'é'}t{'é'}, un param{'è'}tre cl{'é'} pour l{"'"}isolation et le chauffage.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 5. Contexte socio-économique */}
          {hasSocio && (
            <InsightCard
              icon={<Users className="w-5 h-5 text-purple-600" />}
              title="Contexte socio-économique"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                Le revenu m{'é'}dian {'à'} {villeName} est de {formatEuro(c.revenu_median!)}/an.{' '}
                {c.revenu_median! < 22000 ? (
                  <>Ce niveau de revenu permet {'à'} de nombreux m{'é'}nages de b{'é'}n{'é'}ficier de MaPrimeR{'é'}nov{"'"} {'à'} taux major{'é'} (cat{'é'}gorie bleu ou jaune), r{'é'}duisant significativement le co{'û'}t des travaux pour {gentile}.</>
                ) : c.revenu_median! < 30000 ? (
                  <>Une partie des m{'é'}nages peut pr{'é'}tendre aux aides MaPrimeR{'é'}nov{"'"} (cat{'é'}gorie jaune ou violet), facilitant le financement des travaux de r{'é'}novation pour {gentile}.</>
                ) : (
                  <>Avec un pouvoir d{"'"}achat {'é'}lev{'é'}, {gentile} investissent r{'é'}guli{'è'}rement dans des travaux de qualit{'é'} et de r{'é'}novation haut de gamme.</>
                )}
                {c.prix_m2_moyen && (
                  <>{' '}Combin{'é'} {'à'} un prix immobilier de {formatEuro(c.prix_m2_moyen)}/m{'²'}, la r{'é'}novation reste un investissement rentable.</>
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
