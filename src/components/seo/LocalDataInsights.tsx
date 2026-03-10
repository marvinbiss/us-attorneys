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
          {villeName} en chiffres : donn{'\u00E9'}es cl{'\u00E9'}s pour vos travaux
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Donn{'\u00E9'}es locales qui impactent le march{'\u00E9'} de la r{'\u00E9'}novation et les tarifs de {serviceName.toLowerCase()} {'\u00E0'} {villeName}.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* 1. Marché local de la rénovation */}
          {hasMarche && (
            <InsightCard
              icon={<Building2 className="w-5 h-5 text-blue-600" />}
              title="March\u00E9 local de la r\u00E9novation"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.nb_entreprises_artisanales && (
                  <>{'\u00C0'} {villeName}, {formatNumber(c.nb_entreprises_artisanales)} entreprises artisanales sont r{'\u00E9'}f{'\u00E9'}renc{'\u00E9'}es{c.nb_artisans_btp ? ` dont ${formatNumber(c.nb_artisans_btp)} dans le BTP` : ''}. </>
                )}
                {c.nb_artisans_rge != null && c.nb_artisans_rge > 0 && (
                  <>Avec {formatNumber(c.nb_artisans_rge)} artisan{c.nb_artisans_rge > 1 ? 's' : ''} RGE certifi{'\u00E9'}{c.nb_artisans_rge > 1 ? 's' : ''}, {
                    c.nb_entreprises_artisanales && c.nb_entreprises_artisanales > 500
                      ? 'la concurrence est forte, ce qui favorise des tarifs comp\u00E9titifs'
                      : 'le choix reste raisonnable pour des travaux de qualit\u00E9'
                  }. </>
                )}
                {c.population > 0 && c.densite_population != null && (
                  <>La commune compte {formatNumber(c.population)} habitants avec une densit{'\u00E9'} de {formatNumber(Math.round(c.densite_population))} hab/km{'\u00B2'}.</>
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
                  <>Le prix moyen au m{'\u00B2'} {'\u00E0'} {villeName} est de {formatEuro(c.prix_m2_moyen)}. </>
                )}
                {c.prix_m2_maison && c.prix_m2_appartement && (
                  <>Maisons : {formatEuro(c.prix_m2_maison)}/m{'\u00B2'}, appartements : {formatEuro(c.prix_m2_appartement)}/m{'\u00B2'}. </>
                )}
                {c.part_maisons_pct != null && (
                  <>Avec {c.part_maisons_pct > 50
                    ? `${c.part_maisons_pct}\u00A0% de maisons, les travaux individuels (toiture, fa\u00E7ade) sont fr\u00E9quents`
                    : `${100 - c.part_maisons_pct}\u00A0% d'appartements, les travaux de copropri\u00E9t\u00E9 sont fr\u00E9quents`
                  }. </>
                )}
                {c.nb_transactions_annuelles != null && c.nb_transactions_annuelles > 0 && (
                  <>Environ {formatNumber(c.nb_transactions_annuelles)} transactions immobili{'\u00E8'}res par an g{'\u00E9'}n{'\u00E8'}rent des besoins en travaux pour {gentile}.</>
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
              title="Performance \u00E9nerg\u00E9tique"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.pct_passoires_dpe != null && (
                  <>{c.pct_passoires_dpe}{'\u00A0'}% des logements {c.gentile ? `${c.gentile.toLowerCase().charAt(0) === 'l' ? 'des ' : 'de '}${villeName.toLowerCase()}` : `de ${villeName}`} sont des passoires thermiques (classes F-G). </>
                )}
                {c.nb_dpe_total != null && c.nb_dpe_total > 0 && (
                  <>{formatNumber(c.nb_dpe_total)} diagnostics de performance {'\u00E9'}nerg{'\u00E9'}tique ont {'\u00E9'}t{'\u00E9'} r{'\u00E9'}alis{'\u00E9'}s. </>
                )}
                {c.nb_maprimerenov_annuel != null && c.nb_maprimerenov_annuel > 0 && (
                  <>{formatNumber(c.nb_maprimerenov_annuel)} dossiers MaPrimeR{'\u00E9'}nov{'\u0027'} ont {'\u00E9'}t{'\u00E9'} d{'\u00E9'}pos{'\u00E9'}s, t{'\u00E9'}moignant d{'\u0027'}une demande forte en r{'\u00E9'}novation {'\u00E9'}nerg{'\u00E9'}tique.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 4. Climat & saisonnalité */}
          {hasClimat && (
            <InsightCard
              icon={<CloudRain className="w-5 h-5 text-sky-600" />}
              title="Climat & saisonnalit\u00E9"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {c.jours_gel_annuels != null && c.precipitation_annuelle != null && (
                  <>Avec {c.jours_gel_annuels} jours de gel par an et {formatNumber(c.precipitation_annuelle)}{'\u00A0'}mm de pr{'\u00E9'}cipitations, </>
                )}
                {c.jours_gel_annuels != null && c.precipitation_annuelle == null && (
                  <>Avec {c.jours_gel_annuels} jours de gel par an, </>
                )}
                {c.jours_gel_annuels == null && c.precipitation_annuelle != null && (
                  <>Avec {formatNumber(c.precipitation_annuelle)}{'\u00A0'}mm de pr{'\u00E9'}cipitations annuelles, </>
                )}
                {c.mois_travaux_ext_debut && c.mois_travaux_ext_fin ? (
                  <>les travaux ext{'\u00E9'}rieurs sont optimaux de {monthName(c.mois_travaux_ext_debut)} {'\u00E0'} {monthName(c.mois_travaux_ext_fin)}. </>
                ) : (
                  <>les conditions climatiques influencent le calendrier des travaux. </>
                )}
                {c.temperature_moyenne_hiver != null && c.temperature_moyenne_ete != null && (
                  <>Les temp{'\u00E9'}ratures moyennes varient de {c.temperature_moyenne_hiver}{'\u00A0'}{'\u00B0'}C en hiver {'\u00E0'} {c.temperature_moyenne_ete}{'\u00A0'}{'\u00B0'}C en {'\u00E9'}t{'\u00E9'}, un param{'\u00E8'}tre cl{'\u00E9'} pour l{'\u0027'}isolation et le chauffage.</>
                )}
              </p>
            </InsightCard>
          )}

          {/* 5. Contexte socio-économique */}
          {hasSocio && (
            <InsightCard
              icon={<Users className="w-5 h-5 text-purple-600" />}
              title="Contexte socio-\u00E9conomique"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                Le revenu m{'\u00E9'}dian {'\u00E0'} {villeName} est de {formatEuro(c.revenu_median!)}/an.{' '}
                {c.revenu_median! < 22000 ? (
                  <>Ce niveau de revenu permet {'\u00E0'} de nombreux m{'\u00E9'}nages de b{'\u00E9'}n{'\u00E9'}ficier de MaPrimeR{'\u00E9'}nov{'\u0027'} {'\u00E0'} taux major{'\u00E9'} (cat{'\u00E9'}gorie bleu ou jaune), r{'\u00E9'}duisant significativement le co{'\u00FB'}t des travaux pour {gentile}.</>
                ) : c.revenu_median! < 30000 ? (
                  <>Une partie des m{'\u00E9'}nages peut pr{'\u00E9'}tendre aux aides MaPrimeR{'\u00E9'}nov{'\u0027'} (cat{'\u00E9'}gorie jaune ou violet), facilitant le financement des travaux de r{'\u00E9'}novation pour {gentile}.</>
                ) : (
                  <>Avec un pouvoir d{'\u0027'}achat {'\u00E9'}lev{'\u00E9'}, {gentile} investissent r{'\u00E9'}guli{'\u00E8'}rement dans des travaux de qualit{'\u00E9'} et de r{'\u00E9'}novation haut de gamme.</>
                )}
                {c.prix_m2_moyen && (
                  <>{' '}Combin{'\u00E9'} {'\u00E0'} un prix immobilier de {formatEuro(c.prix_m2_moyen)}/m{'\u00B2'}, la r{'\u00E9'}novation reste un investissement rentable.</>
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
