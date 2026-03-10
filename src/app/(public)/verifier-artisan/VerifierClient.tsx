"use client"

import { useState, useCallback, FormEvent } from "react"
import Link from "next/link"
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Building2,
  MapPin,
  Calendar,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  BadgeCheck,
  Scale,
  Hammer,
  ClipboardList,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

interface SiretResult {
  found: boolean
  siret: string
  siren?: string
  denomination?: string
  formeJuridique?: string
  dateCreation?: string
  activitePrincipale?: string
  libelleActivite?: string
  adresse?: {
    numero: string
    voie: string
    codePostal: string
    commune: string
    departement: string
  }
  etatAdministratif?: string
  isActive?: boolean
  trancheEffectifs?: string
  categorieEntreprise?: string
  message?: string
  error?: string
  rateLimited?: boolean
}

interface FaqItem {
  question: string
  answer: string
}

interface VerifierClientProps {
  faqItems: FaqItem[]
}

// ─── SIRET formatting ───────────────────────────────────────────────

function formatSiretInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  // Format: XXX XXX XXX XXXXX
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  if (digits.length > 9) parts.push(digits.slice(9, 14))
  return parts.join(" ")
}

function calculateYearsOfExperience(dateCreation: string): number | null {
  if (!dateCreation) return null
  const created = new Date(dateCreation)
  if (isNaN(created.getTime())) return null
  const now = new Date()
  const years = Math.floor(
    (now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )
  return years >= 0 ? years : null
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Non renseigne"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

// ─── Component ──────────────────────────────────────────────────────

export default function VerifierClient({ faqItems }: VerifierClientProps) {
  const [siret, setSiret] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SiretResult | null>(null)
  const [error, setError] = useState("")
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSiretChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSiret(formatSiretInput(e.target.value))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const cleanSiret = siret.replace(/\s/g, "")

      if (cleanSiret.length !== 14) {
        setError("Le numero SIRET doit contenir exactement 14 chiffres.")
        setResult(null)
        return
      }

      setLoading(true)
      setError("")
      setResult(null)

      try {
        const res = await fetch(
          `/api/verify-siret?siret=${encodeURIComponent(cleanSiret)}`
        )
        const data: SiretResult = await res.json()

        if (data.rateLimited) {
          setError(
            "Trop de requetes. Veuillez patienter une minute avant de reessayer."
          )
          return
        }

        if (data.error) {
          setError(data.error)
          return
        }

        setResult(data)
      } catch {
        setError(
          "Impossible de contacter le service de verification. Verifiez votre connexion internet."
        )
      } finally {
        setLoading(false)
      }
    },
    [siret]
  )

  return (
    <div>
      {/* ─── Hero Section ──────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">
              Verification gratuite et instantanee
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Verifiez votre artisan en 30 secondes
          </h1>
          <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
            Entrez un numero SIRET pour verifier instantanement qu{"'"}un
            artisan est fiable et exerce legalement.
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={siret}
                  onChange={handleSiretChange}
                  placeholder="Entrez un SIRET (ex: 443 061 841 00015)"
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={17}
                  aria-label="Numero SIRET"
                />
              </div>
              <button
                type="submit"
                disabled={loading || siret.replace(/\s/g, "").length < 14}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verification...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Verifier
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-300/30 rounded-xl p-4 max-w-xl mx-auto">
              <div className="flex items-center gap-2 text-red-100">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Results Section ───────────────────────────────── */}
      {result && (
        <section className="py-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {result.found && result.isActive && (
              <ResultCard
                variant="success"
                result={result}
              />
            )}
            {result.found && !result.isActive && (
              <ResultCard
                variant="warning"
                result={result}
              />
            )}
            {!result.found && (
              <ResultCard
                variant="error"
                result={result}
              />
            )}

            {/* CTA links below result */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <Link
                href="/services"
                className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    Trouver des artisans verifies
                  </p>
                  <p className="text-sm text-gray-500">
                    Pres de chez vous
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>
              <Link
                href="/devis"
                className="flex items-center justify-between bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    Demander un devis gratuit
                  </p>
                  <p className="text-sm text-gray-500">
                    Comparez les offres
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Trust Section ─────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            Pourquoi verifier un artisan ?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Chaque annee, des milliers de particuliers sont victimes d{"'"}
            arnaques dans le secteur du batiment. La verification est votre
            meilleure protection.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustCard
              icon={<AlertTriangle className="w-7 h-7 text-red-500" />}
              title="Arnaques en hausse"
              description="Plus de 60 000 plaintes par an pour arnaques aux travaux. Verifiez avant de payer."
              bgColor="bg-red-50"
            />
            <TrustCard
              icon={<Shield className="w-7 h-7 text-blue-500" />}
              title="Garantie decennale"
              description="Obligatoire pour les travaux de structure. Assurez-vous que l'artisan est couvert."
              bgColor="bg-blue-50"
            />
            <TrustCard
              icon={<Scale className="w-7 h-7 text-purple-500" />}
              title="Assurance obligatoire"
              description="Tout artisan doit avoir une RC Pro. Sans elle, vous n'etes pas protege."
              bgColor="bg-purple-50"
            />
            <TrustCard
              icon={<BadgeCheck className="w-7 h-7 text-green-500" />}
              title="Qualifications RGE"
              description="Indispensable pour les aides de l'Etat (MaPrimeRenov, CEE). Verifiez le label."
              bgColor="bg-green-50"
            />
          </div>
        </div>
      </section>

      {/* ─── Guide Section ─────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
            Comment verifier un artisan ?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Suivez ces 5 etapes pour vous assurer de la fiabilite de votre
            artisan avant de lui confier vos travaux.
          </p>

          <div className="space-y-6">
            <GuideStep
              number={1}
              title="Demandez le numero SIRET"
              description="Tout artisan en regle doit pouvoir vous communiquer son numero SIRET. Il figure obligatoirement sur ses devis et factures. S'il refuse de le donner, c'est un signal d'alerte."
            />
            <GuideStep
              number={2}
              title="Verifiez avec notre outil"
              description="Entrez le SIRET dans notre outil de verification gratuit ci-dessus. Vous saurez instantanement si l'entreprise existe, est active, et quel est son secteur d'activite."
            />
            <GuideStep
              number={3}
              title="Verifiez les assurances"
              description="Demandez l'attestation d'assurance responsabilite civile professionnelle et, pour les travaux de construction, l'attestation de garantie decennale. Contactez l'assureur pour confirmer."
            />
            <GuideStep
              number={4}
              title="Demandez des references"
              description="Un artisan serieux pourra vous montrer des photos de chantiers precedents et vous fournir des contacts de clients satisfaits. Consultez egalement les avis en ligne sur plusieurs plateformes."
            />
            <GuideStep
              number={5}
              title="Comparez les devis"
              description="Demandez au moins 3 devis detailles pour le meme travail. Mefiance envers les prix anormalement bas ou les demandes d'acompte superieur a 30%. Le devis doit etre precis et detaille."
            />
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ───────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            Questions frequentes
          </h2>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition-colors"
                  aria-expanded={openFaq === index}
                >
                  <span className="font-medium text-gray-900 pr-4">
                    {item.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Trouvez un artisan verifie sur ServicesArtisans
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Des milliers d{"'"}artisans references par donnees SIREN
            officielles dans toute la France.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              <Search className="w-5 h-5" />
              Trouver un artisan
            </Link>
            <Link
              href="/devis"
              className="inline-flex items-center justify-center gap-2 bg-green-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-green-600 transition-colors shadow-lg"
            >
              <FileText className="w-5 h-5" />
              Devis gratuit
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function ResultCard({
  variant,
  result,
}: {
  variant: "success" | "warning" | "error"
  result: SiretResult
}) {
  const years = result.dateCreation
    ? calculateYearsOfExperience(result.dateCreation)
    : null

  const styles = {
    success: {
      border: "border-green-200",
      bg: "bg-green-50",
      headerBg: "bg-green-100",
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      title: "Entreprise active",
      titleColor: "text-green-800",
    },
    warning: {
      border: "border-orange-200",
      bg: "bg-orange-50",
      headerBg: "bg-orange-100",
      icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
      title: "Entreprise fermee",
      titleColor: "text-orange-800",
    },
    error: {
      border: "border-red-200",
      bg: "bg-red-50",
      headerBg: "bg-red-100",
      icon: <XCircle className="w-6 h-6 text-red-600" />,
      title: "SIRET non trouve",
      titleColor: "text-red-800",
    },
  }

  const s = styles[variant]

  return (
    <div
      className={`rounded-2xl border-2 ${s.border} overflow-hidden shadow-sm`}
    >
      {/* Header */}
      <div
        className={`${s.headerBg} px-6 py-4 flex items-center gap-3`}
      >
        {s.icon}
        <h3
          className={`text-lg font-bold ${s.titleColor}`}
        >
          {s.title}
        </h3>
      </div>

      {/* Body */}
      <div className={`${s.bg} px-6 py-6`}>
        {variant === "error" ? (
          <div className="text-center py-4">
            <p className="text-gray-700 text-lg mb-2">
              {result.message ||
                "Aucune entreprise trouvee pour ce numero SIRET."}
            </p>
            <p className="text-gray-500 text-sm">
              SIRET recherche : {result.siret}
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Verifiez que le numero est correct, ou demandez a l{"'"}artisan
              de vous fournir son numero SIRET exact.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Company name */}
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Denomination</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {result.denomination || "Non renseigne"}
                </p>
              </div>
            </div>

            {/* SIRET / SIREN */}
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">SIRET / SIREN</p>
                <p className="font-medium text-gray-900">
                  {result.siret} / {result.siren}
                </p>
              </div>
            </div>

            {/* Address */}
            {result.adresse && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium text-gray-900">
                    {[
                      result.adresse.numero,
                      result.adresse.voie,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="text-gray-700">
                    {result.adresse.codePostal} {result.adresse.commune}
                  </p>
                </div>
              </div>
            )}

            {/* Activity */}
            {result.activitePrincipale && (
              <div className="flex items-start gap-3">
                <Hammer className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">
                    Activite principale (NAF)
                  </p>
                  <p className="font-medium text-gray-900">
                    {result.activitePrincipale}
                    {result.libelleActivite &&
                      ` — ${result.libelleActivite}`}
                  </p>
                </div>
              </div>
            )}

            {/* Legal form */}
            {result.formeJuridique && (
              <div className="flex items-start gap-3">
                <ClipboardList className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Forme juridique</p>
                  <p className="font-medium text-gray-900">
                    {result.formeJuridique}
                  </p>
                </div>
              </div>
            )}

            {/* Creation date + years */}
            {result.dateCreation && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Date de creation</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(result.dateCreation)}
                    {years !== null && years > 0 && (
                      <span className="ml-2 text-sm text-green-600 font-normal">
                        ({years} an{years > 1 ? "s" : ""} d{"'"}experience)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Employee range */}
            {result.trancheEffectifs &&
              result.trancheEffectifs !== "Non renseigne" && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Effectifs</p>
                    <p className="font-medium text-gray-900">
                      {result.trancheEffectifs}
                    </p>
                  </div>
                </div>
              )}

            {/* Warning for inactive */}
            {variant === "warning" && (
              <div className="mt-4 bg-orange-100 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-800">
                      Attention : cette entreprise est fermee
                    </p>
                    <p className="text-orange-700 text-sm mt-1">
                      Cette entreprise n{"'"}est plus en activite. Ne confiez
                      pas de travaux a un artisan dont l{"'"}entreprise est
                      radiee.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TrustCard({
  icon,
  title,
  description,
  bgColor,
}: {
  icon: React.ReactNode
  title: string
  description: string
  bgColor: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div
        className={`${bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function GuideStep({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex gap-5 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
        {number}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
