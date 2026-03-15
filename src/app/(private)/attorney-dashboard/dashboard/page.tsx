'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import {
  FileText,
  Eye,
  Phone,
  PhoneCall,
  ChevronRight,
  Calendar,
  AlertCircle,
  ArrowRight,
  UserCheck,
  ExternalLink,
  Pencil,
  CheckCircle2,
  Circle,
  Sparkles,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { StatCard } from '@/components/dashboard/StatCard'
import PhotoUploadBanner from '@/components/dashboard/PhotoUploadBanner'
import { getAttorneyUrl } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatsData {
  profileViews: { value: number; change: string }
  phoneReveals: { value: number; change: string }
  phoneClicks: { value: number; change: string }
  demandesRecues: { value: number; change: string }
  unreadMessages: number
  portfolioPhotoCount?: number
}

interface Demande {
  id: string
  client_name: string
  service_name: string
  city: string | null
  postal_code: string | null
  created_at: string
  status: string
}

interface Profile {
  full_name: string | null
  role: string | null
}

interface Provider {
  id: string
  stable_id: string | null
  slug: string | null
  specialty: string | null
  address_city: string | null
  is_verified: boolean
  name: string | null
  description: string | null
  phone: string | null
  email: string | null
}

interface DashboardData {
  stats: StatsData
  recentDemandes: Demande[]
  profile: Profile
  provider: Provider
}

interface FetchError {
  status: number
  message?: string
}

// ─── SWR Fetcher ─────────────────────────────────────────────────────────────

const fetcher = (url: string): Promise<DashboardData> =>
  fetch(url).then((r) => {
    if (!r.ok) throw { status: r.status } as FetchError
    return r.json()
  })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTrend(change: string): { value: number; isPositive: boolean } | undefined {
  const num = parseInt(change.replace(/[^-\d]/g, ''), 10)
  if (isNaN(num) || num === 0) return undefined
  return { value: Math.abs(num), isPositive: num >= 0 }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Nouveau'
    case 'sent': return 'Devis envoyé'
    case 'accepted': return 'Accepté'
    case 'refused': return 'Refusé'
    case 'expired': return 'Expiré'
    default: return status
  }
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'pending': return 'bg-red-100 text-red-700'
    case 'sent': return 'bg-yellow-100 text-yellow-700'
    case 'accepted': return 'bg-green-100 text-green-700'
    case 'refused': return 'bg-gray-100 text-gray-700'
    case 'expired': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function QuickActionsSkeleton() {
  return (
    <div className="flex flex-wrap gap-3" aria-busy="true" aria-label="Chargement des actions rapides">
      <div className="h-10 w-44 rounded-lg bg-gray-200 animate-pulse" />
      <div className="h-10 w-40 rounded-lg bg-gray-200 animate-pulse" />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Chargement des statistiques">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
            <div className="w-14 h-5 rounded-full bg-gray-200 animate-pulse" />
          </div>
          <div className="mt-3">
            <div className="w-16 h-8 rounded bg-gray-200 animate-pulse" />
            <div className="w-24 h-4 rounded bg-gray-200 animate-pulse mt-1.5" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DemandesSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6" aria-busy="true" aria-label="Chargement des demandes">
      <div className="flex items-center justify-between mb-6">
        <div className="w-40 h-6 rounded bg-gray-200 animate-pulse" />
        <div className="w-16 h-4 rounded bg-gray-200 animate-pulse" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="w-48 h-5 rounded bg-gray-200 animate-pulse" />
                <div className="flex gap-4">
                  <div className="w-24 h-4 rounded bg-gray-200 animate-pulse" />
                  <div className="w-20 h-4 rounded bg-gray-200 animate-pulse" />
                  <div className="w-28 h-4 rounded bg-gray-200 animate-pulse" />
                </div>
              </div>
              <div className="w-20 h-6 rounded-full bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Actions ──────────────────────────────────────────────────────────

function QuickActions({ publicUrl }: { publicUrl: string | null }) {
  return (
    <div className="flex flex-wrap gap-3">
      {publicUrl && (
        <Link
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          Voir mon profil public
        </Link>
      )}
      <Link
        href="/attorney-dashboard/profil"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
        Modifier mon profil
      </Link>
    </div>
  )
}

// ─── Profile Completion CTA ──────────────────────────────────────────────────

function ProfileCompletionCTA() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
          <UserCheck className="w-5 h-5" aria-hidden="true" />
        </div>
        <h3 className="font-semibold text-gray-900">Complétez votre profil</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Un profil complet et vérifié vous permet d&apos;apparaître en priorité dans les résultats de recherche et d&apos;inspirer confiance aux clients.
      </p>
      <ul className="space-y-2 mb-5 text-sm text-gray-600">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          Ajoutez une description détaillée
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          Complétez vos coordonnées
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          Ajoutez votre logo
        </li>
      </ul>
      <Link
        href="/attorney-dashboard/profil"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors w-full justify-center"
      >
        Compléter mon profil
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

// ─── Onboarding Empty State ─────────────────────────────────────────────────

interface OnboardingChecklistProps {
  provider: Provider | null
  portfolioPhotoCount: number
}

function OnboardingChecklist({ provider, portfolioPhotoCount }: OnboardingChecklistProps) {
  const checks = [
    {
      label: 'Photo de profil ajoutée',
      done: portfolioPhotoCount > 0,
    },
    {
      label: 'Description rédigée',
      done: !!provider?.description && provider.description.length > 10,
    },
    {
      label: 'Spécialité renseignée',
      done: !!provider?.specialty,
    },
    {
      label: 'Profil vérifié (SIRET)',
      done: !!provider?.is_verified,
    },
  ]

  const completedCount = checks.filter((c) => c.done).length

  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
        <Sparkles className="w-8 h-8 text-blue-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Bienvenue ! Complétez votre profil pour recevoir vos premières demandes.
      </h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
        Un profil complet vous rend visible dans les résultats de recherche et inspire confiance aux clients potentiels.
      </p>

      {/* Progress bar */}
      <div className="max-w-xs mx-auto mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>Progression</span>
          <span>{completedCount}/{checks.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / checks.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <ul className="max-w-xs mx-auto space-y-3 text-left mb-8">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-2.5 text-sm">
            {check.done ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 shrink-0" aria-hidden="true" />
            )}
            <span className={check.done ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/attorney-dashboard/profil"
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
      >
        Compléter mon profil
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function DashboardArtisanPage() {
  const router = useRouter()

  const { data, error, isLoading, mutate } = useSWR<DashboardData, FetchError>(
    '/api/attorney/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30_000,
      dedupingInterval: 5_000,
      keepPreviousData: true,
    }
  )

  // Redirect on 401
  useEffect(() => {
    if (error && (error as FetchError).status === 401) {
      router.push('/login?redirect=/attorney-dashboard')
    }
  }, [error, router])

  const stats = data?.stats ?? null
  const demandes = data?.recentDemandes ?? []
  const profile = data?.profile ?? null
  const provider = data?.provider ?? null

  // 403 — artisan-only access
  if (error && (error as FetchError).status === 403) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès réservé</h2>
          <p className="text-gray-600 mb-6">
            Accès réservé aux artisans. Veuillez vous inscrire en tant qu&apos;artisan.
          </p>
          <Link
            href="/register-attorney"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
          >
            S&apos;inscrire en tant qu&apos;artisan
          </Link>
        </div>
      </div>
    )
  }

  // Generic error (non-401, non-403)
  const hasGenericError = error && (error as FetchError).status !== 401 && (error as FetchError).status !== 403

  const firstName = profile?.full_name?.split(' ')[0] || null
  const displayName = profile?.full_name || 'Mon entreprise'
  const displayCity = provider?.address_city || ''
  const publicUrl = provider
    ? getAttorneyUrl({
        stable_id: provider.stable_id,
        slug: provider.slug,
        specialty: provider.specialty,
        city: provider.address_city,
      })
    : null

  const statsCards = stats
    ? [
        {
          title: 'Vues du profil',
          value: stats.profileViews.value,
          trend: parseTrend(stats.profileViews.change),
          icon: <Eye className="w-5 h-5" aria-hidden="true" />,
          color: 'blue' as const,
        },
        {
          title: 'Numéros affichés',
          value: stats.phoneReveals.value,
          trend: parseTrend(stats.phoneReveals.change),
          icon: <Phone className="w-5 h-5" aria-hidden="true" />,
          color: 'green' as const,
        },
        {
          title: 'Appels reçus',
          value: stats.phoneClicks.value,
          trend: parseTrend(stats.phoneClicks.change),
          icon: <PhoneCall className="w-5 h-5" aria-hidden="true" />,
          color: 'indigo' as const,
        },
        {
          title: 'Demandes reçues',
          value: stats.demandesRecues.value,
          trend: parseTrend(stats.demandesRecues.change),
          icon: <FileText className="w-5 h-5" aria-hidden="true" />,
          color: 'yellow' as const,
        },
      ]
    : []

  const showProfileCTA = provider && !provider.is_verified

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb
            items={[
              { label: 'Espace Artisan', href: '/attorney-dashboard' },
              { label: 'Tableau de bord' },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {firstName ? `Bonjour ${firstName}` : 'Tableau de bord'}
              </h1>
              <p className="text-blue-100">
                {displayName}
                {displayCity && ` — ${displayCity}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {provider?.is_verified && (
                <span
                  className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                  role="status"
                >
                  Profil référencé
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AttorneySidebar
            activePage="dashboard"
            newDemandesCount={stats?.demandesRecues?.value || 0}
            unreadMessagesCount={stats?.unreadMessages ?? 0}
            publicUrl={publicUrl}
          />

          {/* Main content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Inline error banner */}
            {hasGenericError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
                <p className="text-sm text-red-700 flex-1">
                  Erreur de connexion. Veuillez vérifier votre connexion internet.
                </p>
                <button
                  onClick={() => mutate()}
                  className="text-sm font-medium text-red-700 hover:text-red-800 underline focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                >
                  Réessayer
                </button>
              </motion.div>
            )}

            {/* Quick Actions */}
            <section aria-label="Actions rapides">
              {isLoading && !data ? (
                <QuickActionsSkeleton />
              ) : (
                <QuickActions publicUrl={publicUrl} />
              )}
            </section>

            {/* Photo Upload Banner */}
            {data?.stats?.portfolioPhotoCount !== undefined && (
              <PhotoUploadBanner photoCount={data.stats.portfolioPhotoCount} />
            )}

            {/* Stats Section */}
            <section aria-label="Statistiques" aria-live="polite">
              {isLoading && !data ? (
                <StatsSkeleton />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsCards.map((card, index) => (
                    <StatCard
                      key={card.title}
                      title={card.title}
                      value={card.value}
                      trend={card.trend}
                      icon={card.icon}
                      color={card.color}
                      delay={index * 0.05}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Two-column layout: Demandes + Profile CTA */}
            <div className={showProfileCTA ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : ''}>
              {/* Dernières demandes */}
              <section className={showProfileCTA ? 'lg:col-span-2' : ''} aria-label="Dernières demandes">
                {isLoading && !data ? (
                  <DemandesSkeleton />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Dernières demandes</h2>
                      <Link
                        href="/attorney-dashboard/demandes-recues"
                        className="text-blue-600 hover:underline text-sm focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      >
                        Voir tout
                      </Link>
                    </div>
                    <div className="space-y-4">
                      {demandes.length === 0 ? (
                        <OnboardingChecklist
                          provider={provider}
                          portfolioPhotoCount={stats?.portfolioPhotoCount ?? 0}
                        />
                      ) : (
                        demandes.map((demande, index) => (
                          <motion.div
                            key={demande.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 + index * 0.04 }}
                          >
                            <Link
                              href={`/attorney-dashboard/demandes-recues?id=${demande.id}`}
                              className="block border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {demande.service_name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-500">
                                    <span>{demande.client_name}</span>
                                    <span>{demande.city || 'Non précisé'}</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" aria-hidden="true" />
                                      {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                  {demande.postal_code && (
                                    <div className="mt-2 text-sm font-medium text-blue-600">
                                      Code postal : {demande.postal_code}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(demande.status)}`}
                                    role="status"
                                  >
                                    {getStatusLabel(demande.status)}
                                  </span>
                                  <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </section>

              {/* Profile Completion CTA (right column) */}
              {showProfileCTA && !isLoading && (
                <motion.aside
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  aria-label="Complétion du profil"
                >
                  <ProfileCompletionCTA />
                </motion.aside>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
