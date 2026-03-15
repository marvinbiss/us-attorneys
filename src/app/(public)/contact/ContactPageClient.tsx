'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Send, CheckCircle, Clock, MessageSquare, ArrowRight, Loader2, AlertCircle, Phone } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'

export default function ContactPageClient() {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du message')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
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
          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-4">
            Message envoyé !
          </h1>
          <p className="text-gray-600 mb-6">
            Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Retour à l'accueil
            </Link>
            <Link
              href="/quotes"
              className="block w-full border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Demander un devis
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
          {/* Breadcrumb */}
          <Breadcrumb
            items={[{ label: 'Contact' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4 tracking-[-0.025em]">
              Contactez-nous
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Une question ? Un probl&egrave;me ? Notre &eacute;quipe est l&agrave; pour vous aider.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nos coordonnées
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">contact@us-attorneys.com</p>
                  </div>
                </div>


                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Téléphone</h3>
                    <a href="tel:+33651858930" className="text-blue-600 hover:text-blue-700 font-medium">
                      06 51 85 89 30
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horaires</h3>
                    <p className="text-gray-600">
                      Lun - Ven : 9h - 18h<br />
                      Sam : 9h - 12h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Besoin d'aide rapide ?</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Consultez notre FAQ pour trouver des réponses aux questions les plus fréquentes.
              </p>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Voir la FAQ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Contextual Links */}
            <div className="bg-gray-100 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Liens utiles</h3>
              <div className="space-y-2">
                <Link
                  href="/how-it-works"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  Comment ça marche ?
                </Link>
                <Link
                  href="/quotes"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  Demander un devis gratuit
                </Link>
                <Link
                  href="/register-attorney"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  Devenir artisan partenaire
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  Se connecter
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Envoyez-nous un message
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact-nom" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      id="contact-nom"
                      type="text"
                      autoComplete="name"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      placeholder="jean@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-sujet" className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <select
                    id="contact-sujet"
                    value={formData.sujet}
                    onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="devis">Question sur un devis</option>
                    <option value="artisan">Problème avec un artisan</option>
                    <option value="inscription">Inscription artisan</option>
                    <option value="partenariat">Partenariat</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    disabled={isLoading}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Décrivez votre demande..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links Section */}
      <section className="bg-gray-100 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Trouvez un artisan près de chez vous
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <PopularServicesLinks />
            <PopularCitiesLinks />
          </div>
        </div>
      </section>
    </div>
  )
}
