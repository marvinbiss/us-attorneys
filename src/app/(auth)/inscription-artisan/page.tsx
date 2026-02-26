'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail, Phone, MapPin, Building,
  CheckCircle, ArrowRight, ArrowLeft, Star, Users, TrendingUp, Loader2, AlertCircle
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
import { SiretAutocomplete } from '@/components/ui/SiretAutocomplete'
import { MetierAutocomplete } from '@/components/ui/MetierAutocomplete'
import { VilleAutocomplete } from '@/components/ui/VilleAutocomplete'

const benefits = [
  { icon: Users, title: 'Nouveaux clients', description: 'Recevez des demandes de devis qualifiées' },
  { icon: Star, title: 'Visibilité', description: 'Apparaissez dans les recherches locales' },
  { icon: TrendingUp, title: 'Croissance', description: 'Développez votre activité' },
]

export default function InscriptionArtisanPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Etape 1 - Entreprise
    entreprise: '',
    siret: '',
    metier: '',
    autreMetier: '',
    // Etape 2 - Contact
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    // Etape 3 - Localisation
    adresse: '',
    codePostal: '',
    ville: '',
    rayonIntervention: '30',
    // Etape 4 - Description
    description: '',
    experience: '',
    certifications: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [stepError, setStepError] = useState('')

  const validateStep = (currentStep: number): boolean => {
    setStepError('')
    switch (currentStep) {
      case 1:
        if (!formData.entreprise.trim() || !formData.siret.trim() || !formData.metier.trim()) {
          setStepError('Veuillez remplir tous les champs obligatoires avant de continuer.')
          return false
        }
        return true
      case 2:
        if (!formData.prenom.trim() || !formData.nom.trim() || !formData.email.trim() || !formData.telephone.trim()) {
          setStepError('Veuillez remplir tous les champs obligatoires avant de continuer.')
          return false
        }
        return true
      case 3:
        if (!formData.adresse.trim() || !formData.ville.trim()) {
          setStepError('Veuillez remplir tous les champs obligatoires avant de continuer.')
          return false
        }
        return true
      default:
        return true
    }
  }

  const breadcrumbItems = [
    { label: 'Inscription artisan' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/inscription-artisan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Inscription reçue !
          </h1>
          <p className="text-gray-600 mb-8">
            Merci pour votre inscription. Notre équipe va vérifier vos informations et
            vous recevrez un email de confirmation sous 24-48h.
          </p>
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
            <Link
              href="/services"
              className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Explorer les services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb items={breadcrumbItems} className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600 [&>span]:text-white" />
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-[-0.025em]">
                Rejoignez le r&eacute;seau ServicesArtisans
              </h1>
              <p className="text-xl text-slate-400 mb-8">
                Inscription gratuite. Recevez des demandes de devis qualifi&eacute;es et
                d&eacute;veloppez votre activit&eacute;.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title} className="text-center">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-2 border border-white/10">
                        <Icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="font-semibold">{benefit.title}</div>
                      <div className="text-sm text-slate-400">{benefit.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-2xl p-6 text-gray-900">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step > s ? '✓' : s}
                    </div>
                    {s < 4 && (
                      <div className={`w-8 h-1 mx-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Etape 1 - Entreprise */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Votre entreprise</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'entreprise *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          autoComplete="organization"
                          value={formData.entreprise}
                          onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          placeholder="Mon Entreprise"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro SIRET *
                      </label>
                      <SiretAutocomplete
                        value={formData.siret}
                        onValidated={(siret, company) => {
                          setFormData(prev => ({
                            ...prev,
                            siret,
                            entreprise: company?.name || prev.entreprise
                          }))
                        }}
                        onClear={() => setFormData(prev => ({ ...prev, siret: '' }))}
                        showCompanyPreview={true}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Métier principal *
                      </label>
                      <MetierAutocomplete
                        value={formData.metier}
                        onSelect={(service) => setFormData(prev => ({ ...prev, metier: service.name }))}
                        onClear={() => setFormData(prev => ({ ...prev, metier: '' }))}
                        placeholder="Rechercher votre métier..."
                        showAllOnFocus={true}
                      />
                    </div>
                  </div>
                )}

                {/* Etape 2 - Contact */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Vos coordonnées</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                        <input
                          type="text"
                          autoComplete="given-name"
                          value={formData.prenom}
                          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                          type="text"
                          autoComplete="family-name"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={formData.telephone}
                          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Etape 3 - Localisation */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Zone d'intervention</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          autoComplete="street-address"
                          value={formData.adresse}
                          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                      <VilleAutocomplete
                        value={formData.ville}
                        onSelect={(ville, codePostal, _coords) => {
                          setFormData(prev => ({
                            ...prev,
                            ville,
                            codePostal
                          }))
                        }}
                        onClear={() => setFormData(prev => ({ ...prev, ville: '', codePostal: '' }))}
                        showGeolocation={true}
                        placeholder="Rechercher votre ville..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rayon d'intervention (km)
                      </label>
                      <select
                        value={formData.rayonIntervention}
                        onChange={(e) => setFormData({ ...formData, rayonIntervention: e.target.value })}
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="10">10 km</option>
                        <option value="20">20 km</option>
                        <option value="30">30 km</option>
                        <option value="50">50 km</option>
                        <option value="100">100 km</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Etape 4 - Description */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">Présentez-vous</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description de votre activité
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Décrivez vos services, spécialités..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Années d'expérience
                      </label>
                      <input
                        type="text"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Ex: 15 ans"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certifications / Labels
                      </label>
                      <input
                        type="text"
                        value={formData.certifications}
                        onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="RGE, Qualibat, etc."
                      />
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                      En vous inscrivant, vous acceptez nos{' '}
                      <Link href="/mentions-legales" className="underline hover:text-blue-600">conditions d'utilisation</Link>
                      {' '}et notre{' '}
                      <Link href="/confidentialite" className="underline hover:text-blue-600">politique de confidentialité</Link>.
                    </div>
                  </div>
                )}

                {/* Step Validation Error */}
                {stepError && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-lg mt-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{stepError}</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mt-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-6 border-t">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Retour
                    </button>
                  ) : (
                    <div />
                  )}
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(step)) {
                          setStepError('')
                          setStep(step + 1)
                        }
                      }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Continuer
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Inscription en cours...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Finaliser l'inscription
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Ils nous font confiance
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Pierre M.', job: 'Plombier à Lyon', jobLink: '/services/plombier/lyon', text: 'Grâce à ServicesArtisans, j\'ai doublé mon chiffre d\'affaires en un an.' },
              { name: 'Sophie L.', job: 'Électricienne à Paris', jobLink: '/services/electricien/paris', text: 'Une vraie mine d\'or pour trouver de nouveaux clients qualifiés.' },
              { name: 'Marc D.', job: 'Menuisier à Bordeaux', jobLink: '/services/menuisier/bordeaux', text: 'Le meilleur investissement pour mon entreprise. Je recommande !' },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{t.text}"</p>
                <div className="font-semibold text-gray-900">{t.name}</div>
                <Link href={t.jobLink} className="text-sm text-blue-600 hover:underline">{t.job}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Explorer le réseau</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <PopularServicesLinks />
            <PopularCitiesLinks />
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link
              href="/tarifs"
              className="bg-gray-50 hover:bg-blue-50 rounded-xl p-6 transition-colors group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Nos tarifs</h3>
              <p className="text-gray-600 text-sm">Découvrez nos offres adaptées à votre activité</p>
            </Link>
            <Link
              href="/avis"
              className="bg-gray-50 hover:bg-blue-50 rounded-xl p-6 transition-colors group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Avis clients</h3>
              <p className="text-gray-600 text-sm">Ce que disent nos clients de nos artisans</p>
            </Link>
            <Link
              href="/comment-ca-marche"
              className="bg-gray-50 hover:bg-blue-50 rounded-xl p-6 transition-colors group"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Comment ça marche</h3>
              <p className="text-gray-600 text-sm">Tout savoir sur notre plateforme</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer links */}
    </div>
  )
}
