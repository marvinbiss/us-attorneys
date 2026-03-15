'use client'

import Link from 'next/link'
import useSWR from 'swr'
import {
  ArrowLeft,
  Check,
  Shield,
  Crown,
  Star,
  Calendar,
  Mail,
  Loader2,
  Lock,
} from 'lucide-react'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubscriptionData {
  plan: string
  memberSince: string | null
  isVerified: boolean
  attorneyName: string | null
  hasUpgradePlans: boolean
}

// ─── Config ──────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Réception de leads et demandes de devis',
  'Envoi de devis aux clients',
  'Messagerie avec les clients',
  'Portfolio photos de vos réalisations',
  'Gestion des avis clients',
  'Gestion de votre équipe',
  'Badge profil vérifié (après vérification SIRET)',
  'Statistiques de votre activité',
  'Support par email',
]

const PRO_FEATURES = [
  'Tout le plan Gratuit',
  'Mise en avant dans les résultats de recherche',
  'Badge "Artisan Pro" sur votre profil',
  'Statistiques avancées et rapports',
  'Priorité sur les leads de votre zone',
  'Support prioritaire par téléphone',
]

const PREMIUM_FEATURES = [
  'Tout le plan Pro',
  'Position garantie en tête des résultats',
  'Badge "Artisan Premium" doré',
  'Leads exclusifs dans votre zone',
  'Page profil personnalisée',
  'Account manager dédié',
  'Accès anticipé aux nouvelles fonctionnalités',
]

// ─── SWR Fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string): Promise<SubscriptionData> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Erreur chargement')
    return r.json()
  })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ─── Feature List Component ──────────────────────────────────────────────────

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 text-green-600" />
          </div>
          <span className="text-gray-700 text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AbonnementArtisanPage() {
  const { data, isLoading } = useSWR<SubscriptionData>(
    '/api/attorney/subscription',
    fetcher
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/attorney-dashboard/dashboard"
              className="text-white/80 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Mon abonnement</h1>
              <p className="text-blue-100">
                Gérez votre plan et vos fonctionnalités
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <AttorneySidebar activePage="abonnement" />

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Chargement...</span>
              </div>
            )}

            {/* Current plan card */}
            {!isLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-green-100 text-sm font-medium">
                          Plan actuel
                        </p>
                        <h2 className="text-2xl font-bold">Gratuit</h2>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                      Actif
                    </span>
                  </div>
                  {data?.memberSince && (
                    <div className="mt-4 flex items-center gap-2 text-green-100 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Membre depuis le {formatDate(data.memberSince)}</span>
                    </div>
                  )}
                </div>

                {/* Free plan features */}
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                    Fonctionnalités incluses
                  </h3>
                  <FeatureList features={FREE_FEATURES} />
                </div>
              </div>
            )}

            {/* Upgrade plans — only if Stripe env vars configured */}
            {!isLoading && data?.hasUpgradePlans && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Plans disponibles prochainement
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pro plan */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Pro
                          </h3>
                          <p className="text-sm text-gray-500">
                            Pour les artisans ambitieux
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <FeatureList features={PRO_FEATURES} />
                      <button
                        disabled
                        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        Bientôt disponible
                      </button>
                    </div>
                  </div>

                  {/* Premium plan */}
                  <div className="bg-white rounded-xl shadow-sm border-2 border-amber-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                      PREMIUM
                    </div>
                    <div className="p-6 border-b border-amber-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Premium
                          </h3>
                          <p className="text-sm text-gray-500">
                            Visibilité maximale
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <FeatureList features={PREMIUM_FEATURES} />
                      <button
                        disabled
                        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        Bientôt disponible
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Support section */}
            {!isLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Besoin d&apos;aide ?
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Notre équipe est disponible pour répondre à vos questions
                      sur votre compte et vos fonctionnalités.
                    </p>
                    <a
                      href="mailto:contact@us-attorneys.com"
                      className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Mail className="w-4 h-4" />
                      contact@us-attorneys.com
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
