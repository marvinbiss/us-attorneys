'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { services, villes } from '@/lib/data/france'
import { CheckCircle, ArrowRight, ArrowLeft, ChevronDown, Check } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/tracking'

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
  { value: 'moins-500', label: 'Moins de 500 €' },
  { value: '500-2000', label: '500‑2 000 €' },
  { value: '2000-5000', label: '2 000‑5 000 €' },
  { value: 'plus-5000', label: 'Plus de 5 000 €' },
  { value: 'ne-sais-pas', label: 'Je ne sais pas' },
]

function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  if (/^0[1-9]\d{8}$/.test(cleaned)) return true
  if (/^\+33[1-9]\d{8}$/.test(cleaned)) return true
  if (/^0033[1-9]\d{8}$/.test(cleaned)) return true
  return false
}

const STORAGE_KEY = 'sa:devis-draft'

const stepLabels = ['Service', 'Ville', 'Projet', 'Contact']

function StepIndicator({ currentStep }: { currentStep: number }) {
  const progress = Math.round(((currentStep - 1) / 3) * 100)
  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-600">
          Étape {currentStep} sur 4
        </span>
        <span className="text-sm font-semibold text-blue-600">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Step circles */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  currentStep > s
                    ? 'bg-blue-600 text-white'
                    : currentStep === s
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  currentStep >= s ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 4 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 mb-5 transition-all duration-300 ${
                  currentStep > s ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
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
  const isPrefilled = !!(prefilledService && prefilledCity)

  // Restore saved form progress from localStorage
  const savedState = typeof window !== 'undefined' ? (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })() : null

  const [step, setStep] = useState<1 | 2 | 3 | 4>(
    isPrefilled ? 3 : (savedState?.step || 1) as 1 | 2 | 3 | 4
  )
  const [formData, setFormData] = useState<FormData>(
    isPrefilled
      ? { ...initialFormData, service: prefilledService || '', ville: prefilledCity || '' }
      : (savedState?.formData || initialFormData)
  )
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [villeQuery, setVilleQuery] = useState(prefilledCity || savedState?.villeQuery || '')
  const [showVilleSuggestions, setShowVilleSuggestions] = useState(false)
  const [selectedVillePostal, setSelectedVillePostal] = useState(prefilledCityPostal || savedState?.selectedVillePostal || '')

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

  // Persist form progress to localStorage
  useEffect(() => {
    if (submitted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, step, villeQuery, selectedVillePostal }))
    } catch {}
  }, [formData, step, villeQuery, selectedVillePostal, submitted])

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
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.ville) newErrors.ville = 'Veuillez indiquer votre ville'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.urgence) newErrors.urgence = 'Veuillez indiquer le délai souhaité'
    if (formData.description.trim().length > 0 && formData.description.trim().length < 10) {
      newErrors.description = 'Veuillez détailler davantage (10 caractères minimum) ou laisser le champ vide'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep4 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.nom.trim()) newErrors.nom = 'Veuillez entrer votre nom'
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Veuillez entrer votre numéro de téléphone'
    } else if (!isValidFrenchPhone(formData.telephone.trim())) {
      newErrors.telephone = 'Veuillez entrer un numéro de téléphone français valide'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Veuillez entrer votre adresse e-mail'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Veuillez entrer une adresse e-mail valide'
    }
    if (!formData.consentement) {
      newErrors.consentement = "Veuillez accepter d'être contacté par des artisans"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      trackEvent('form_started', {
        service: formData.service || '',
        source: 'devis_form',
      })
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    } else if (step === 3 && validateStep3()) {
      setStep(4)
    }
  }

  const handlePrev = () => {
    if (step === 2) setStep(1)
    else if (step === 3) {
      if (isPrefilled) return // Can't go back past step 3 when prefilled
      setStep(2)
    }
    else if (step === 4) setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep4()) return

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
        throw new Error(body?.error || "Erreur lors de l'envoi")
      }

      trackEvent('devis_submitted', {
        service: formData.service || '',
        city: formData.ville || '',
        postalCode: selectedVillePostal || '',
        urgency: formData.urgence || '',
        source: 'devis_form',
        value: 45,
        currency: 'EUR',
      })
      setSubmitted(true)
      localStorage.removeItem(STORAGE_KEY)
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

        {/* Timeline next steps */}
        <div className="text-left max-w-sm mx-auto mt-6 mb-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold text-blue-600">1</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Analyse de votre demande</p>
              <p className="text-xs text-slate-500">Nous recherchons les artisans les plus adaptés à votre projet</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold text-blue-600">2</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Réception des devis sous 24h</p>
              <p className="text-xs text-slate-500">Jusqu&apos;à 3 artisans qualifiés vous contactent par email ou téléphone</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold text-blue-600">3</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Comparez et choisissez</p>
              <p className="text-xs text-slate-500">Comparez les devis, consultez les avis et choisissez librement</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Link
            href="/services"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Trouver d&apos;autres artisans
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl shadow-xl p-6 md:p-10 max-w-2xl mx-auto"
    >
      <p className="text-center text-sm text-gray-500 mb-4">
        Formulaire rapide — moins de 60 secondes
      </p>
      <StepIndicator currentStep={step} />

      {/* Step 1: Service */}
      <div
        className={`transition-all duration-300 ${
          step === 1 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'
        }`}
      >
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
              Quel service recherchez-vous ?
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Sélectionnez le type de prestation dont vous avez besoin.
            </p>

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

            <button
              type="button"
              onClick={handleNext}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Suivant <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Ville */}
      <div
        className={`transition-all duration-300 ${
          step === 2 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'
        }`}
      >
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
              Où se situe votre projet ?
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Indiquez votre ville pour trouver des artisans proches de chez vous.
            </p>

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
                    const newValue = e.target.value
                    setVilleQuery(newValue)
                    setShowVilleSuggestions(true)
                    if (formData.ville && newValue !== formData.ville) {
                      updateField('ville', '')
                      setSelectedVillePostal('')
                    }
                  }}
                  onFocus={() => setShowVilleSuggestions(true)}
                  onBlur={() => {
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
      </div>

      {/* Step 3: Urgence + Description + Budget */}
      <div
        className={`transition-all duration-300 ${
          step === 3 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'
        }`}
      >
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-1">
              Détails du projet
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Précisez votre besoin pour recevoir des devis adaptés.
            </p>

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

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                Décrivez votre projet <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Ex : fuite robinet cuisine, remplacement chaudière..."
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
                {formData.description.length > 0 && (
                  <span
                    className={`text-xs ${
                      formData.description.trim().length >= 10 ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {formData.description.length}/10 caract.
                  </span>
                )}
              </div>
            </div>

            {/* Budget — optional */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Budget estimé <span className="text-slate-400 font-normal">(optionnel)</span>
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
            </div>

            <div className="flex gap-3">
              {!isPrefilled && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 text-slate-700 font-semibold px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5" /> Précédent
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className={`${isPrefilled ? 'w-full' : 'flex-1'} inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}
              >
                Suivant <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step 4: Contact info */}
      <div
        className={`transition-all duration-300 ${
          step === 4 ? 'opacity-100 translate-y-0' : 'hidden opacity-0 translate-y-4'
        }`}
      >
        {step === 4 && (
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
                  <span className="text-gray-400">Seuls votre nom, téléphone et description du projet sont transmis aux artisans contactés.</span>
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
                {submitting ? 'Envoi en cours…' : 'Recevoir mes devis gratuits'} {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              Gratuit et sans engagement · Réponse sous 24h · Vos données restent confidentielles
            </p>
          </div>
        )}
      </div>
    </form>
  )
}
