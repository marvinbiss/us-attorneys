'use client'

import { useState, useCallback } from 'react'
import { services, villes } from '@/lib/data/france'
import { CheckCircle, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react'

interface FormData {
  service: string
  ville: string
  description: string
  urgence: string
  budget: string
  nom: string
  telephone: string
  email: string
  consentement: boolean
}

const initialFormData: FormData = {
  service: '',
  ville: '',
  description: '',
  urgence: '',
  budget: '',
  nom: '',
  telephone: '',
  email: '',
  consentement: false,
}

const urgencyOptions = [
  { value: 'flexible', label: 'Pas urgent' },
  { value: 'mois', label: 'Ce mois-ci' },
  { value: 'semaine', label: 'Cette semaine' },
  { value: 'urgent', label: 'Urgent (sous 24h)' },
]

const budgetOptions = [
  { value: 'moins-500', label: 'Moins de 500 €' },
  { value: '500-2000', label: '500‑2 000 €' },
  { value: '2000-5000', label: '2 000‑5 000 €' },
  { value: 'plus-5000', label: 'Plus de 5 000 €' },
  { value: 'ne-sais-pas', label: 'Je ne sais pas' },
]

const PHONE_REGEX = /^(?:(?:\+33|0033|0)\s?[1-9])(?:[\s.-]?\d{2}){4}$/

function StepIndicator({ currentStep }: { currentStep: number }) {
  const stepLabels = ['Service', 'Projet', 'Contact']
  return (
    <div className="flex items-center justify-center mb-8">
      {stepLabels.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all duration-300 ${
                  isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

interface DevisFormProps {
  prefilledService?: string
  prefilledCity?: string
  prefilledCityPostal?: string
}

export default function DevisForm({
  prefilledService,
  prefilledCity,
  prefilledCityPostal,
}: DevisFormProps = {}) {
  const [step, setStep] = useState(prefilledService && prefilledCity ? 2 : 1)
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    ...(prefilledService ? { service: prefilledService } : {}),
    ...(prefilledCity ? { ville: prefilledCity } : {}),
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [villeQuery, setVilleQuery] = useState(prefilledCity || '')
  const [showVilleSuggestions, setShowVilleSuggestions] = useState(false)
  const [selectedVillePostal, setSelectedVillePostal] = useState(prefilledCityPostal || '')

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    []
  )

  const filteredVilles = villeQuery.length >= 2
    ? villes
        .filter((v) =>
          v.name.toLowerCase().includes(villeQuery.toLowerCase()) ||
          v.codePostal.startsWith(villeQuery)
        )
        .slice(0, 8)
    : []

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.service) newErrors.service = 'Veuillez choisir un service'
    if (!formData.ville) newErrors.ville = 'Veuillez indiquer votre ville'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.description || formData.description.length < 20) {
      newErrors.description = 'Veuillez décrire votre projet (20 caractères minimum)'
    }
    if (!formData.urgence) newErrors.urgence = 'Veuillez indiquer le délai souhaité'
    if (!formData.budget) newErrors.budget = 'Veuillez indiquer votre budget'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.nom.trim()) newErrors.nom = 'Veuillez entrer votre nom'
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Veuillez entrer votre numéro de téléphone'
    } else if (!PHONE_REGEX.test(formData.telephone.trim())) {
      newErrors.telephone = 'Veuillez entrer un numéro de téléphone français valide'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Veuillez entrer votre adresse e-mail'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Veuillez entrer une adresse e-mail valide'
    }
    if (!formData.consentement) {
      newErrors.consentement = 'Veuillez accepter d’être contacté par des artisans'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep3()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: formData.service,
          urgency: formData.urgence,
          budget: formData.budget,
          description: formData.description,
          codePostal: selectedVillePostal,
          ville: formData.ville,
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Erreur lors de l’envoi')
      }

      setSubmitted(true)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-[bounce_0.6s_ease-in-out]">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-4">
          Votre demande a bien été envoyée !
        </h3>
        <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
          Des artisans qualifiés de votre région vont étudier votre demande et vous contacter.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-xl p-6 md:p-10 max-w-2xl mx-auto"
    >
      <StepIndicator currentStep={step} />

      {/* Step 1: Service & Location */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
            Quel service recherchez-vous ?
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Sélectionnez un métier et votre localisation.
          </p>

          {/* Service dropdown */}
          <div>
            <label htmlFor="service" className="block text-sm font-semibold text-slate-700 mb-2">
              Type de service <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="service"
                value={formData.service}
                onChange={(e) => updateField('service', e.target.value)}
                aria-describedby={errors.service ? 'service-error' : undefined}
                aria-invalid={!!errors.service}
                className={`w-full appearance-none rounded-xl border ${
                  errors.service ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
                } bg-white px-4 py-3 pr-10 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
              >
                <option value="">Choisissez un service...</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.service && (
              <p id="service-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.service}</p>
            )}
          </div>

          {/* City input with autocomplete */}
          <div>
            <label htmlFor="ville" className="block text-sm font-semibold text-slate-700 mb-2">
              Ville <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ville"
                type="text"
                autoComplete="off"
                placeholder="Ex : Paris, Lyon, Marseille..."
                value={villeQuery}
                onChange={(e) => {
                  setVilleQuery(e.target.value)
                  setShowVilleSuggestions(true)
                  if (formData.ville) updateField('ville', '')
                }}
                onFocus={() => setShowVilleSuggestions(true)}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowVilleSuggestions(false), 200)
                }}
                aria-describedby={errors.ville ? 'ville-error' : undefined}
                aria-invalid={!!errors.ville}
                className={`w-full rounded-xl border ${
                  errors.ville ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
                } bg-white px-4 py-3 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
              />
              {showVilleSuggestions && filteredVilles.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {filteredVilles.map((v) => (
                    <li key={v.slug}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-sm"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          updateField('ville', v.name)
                          setVilleQuery(v.name)
                          setSelectedVillePostal(v.codePostal)
                          setShowVilleSuggestions(false)
                        }}
                      >
                        <span className="font-medium text-slate-900">{v.name}</span>
                        <span className="text-gray-400 ml-2">
                          ({v.departement}, {v.codePostal})
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.ville && (
              <p id="ville-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.ville}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Suivant <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Project details */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
            Détails du projet
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Décrivez votre besoin pour recevoir des devis adaptés.
          </p>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              Décrivez votre projet <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Ex : J'ai besoin de refaire la plomberie de ma salle de bain. L'installation date de 20 ans..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              aria-describedby={errors.description ? 'description-error' : undefined}
              aria-invalid={!!errors.description}
              className={`w-full rounded-xl border ${
                errors.description ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
              } bg-white px-4 py-3 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none`}
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p id="description-error" role="alert" className="text-sm text-red-600">{errors.description}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  formData.description.length >= 20 ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {formData.description.length}/20 caract.
              </span>
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Délai souhaité <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {urgencyOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-sm font-medium ${
                    formData.urgence === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgence"
                    value={opt.value}
                    checked={formData.urgence === opt.value}
                    onChange={(e) => updateField('urgence', e.target.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.urgence && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.urgence}</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Budget estimé <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {budgetOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`relative flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-sm font-medium text-center ${
                    formData.budget === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="budget"
                    value={opt.value}
                    checked={formData.budget === opt.value}
                    onChange={(e) => updateField('budget', e.target.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {errors.budget && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.budget}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" /> Précédent
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Contact info */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
            Vos coordonnées
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Pour que les artisans puissent vous contacter avec leurs devis.
          </p>

          {/* Nom */}
          <div>
            <label htmlFor="nom" className="block text-sm font-semibold text-slate-700 mb-2">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              id="nom"
              type="text"
              autoComplete="name"
              placeholder="Jean Dupont"
              value={formData.nom}
              onChange={(e) => updateField('nom', e.target.value)}
              aria-describedby={errors.nom ? 'nom-error' : undefined}
              aria-invalid={!!errors.nom}
              className={`w-full rounded-xl border ${
                errors.nom ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
              } bg-white px-4 py-3 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
            />
            {errors.nom && (
              <p id="nom-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.nom}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="telephone" className="block text-sm font-semibold text-slate-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              id="telephone"
              type="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              value={formData.telephone}
              onChange={(e) => updateField('telephone', e.target.value)}
              aria-describedby={errors.telephone ? 'telephone-error' : undefined}
              aria-invalid={!!errors.telephone}
              className={`w-full rounded-xl border ${
                errors.telephone ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
              } bg-white px-4 py-3 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
            />
            {errors.telephone && (
              <p id="telephone-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.telephone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Adresse e-mail <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jean.dupont@email.fr"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              className={`w-full rounded-xl border ${
                errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-300'
              } bg-white px-4 py-3 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all`}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Consent checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consentement}
                onChange={(e) => updateField('consentement', e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600 leading-relaxed">
                J&apos;accepte d&apos;être contacté par des artisans pour recevoir des devis
                en lien avec ma demande.{' '}
                <span className="text-gray-400">Vos données restent confidentielles.</span>
              </span>
            </label>
            {errors.consentement && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{errors.consentement}</p>
            )}
          </div>

          {submitError && (
            <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" /> Précédent
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70"
            >
              {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'} {!submitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
