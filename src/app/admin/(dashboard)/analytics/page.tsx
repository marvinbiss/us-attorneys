'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAdminFetch } from '@/hooks/admin/useAdminFetch'
import {
  BarChart3, Eye, Phone, PhoneCall, Loader2, AlertCircle,
  TrendingUp, TrendingDown, Minus, Search, ExternalLink,
  Clock, MapPin, Activity, ArrowUpRight,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────

interface ProviderStats {
  id: string
  name: string
  city: string
  specialty: string
  slug: string
  stableId: string
  views: number
  reveals: number
  clicks: number
  lastActivity: string
}

interface RecentEvent {
  id: string
  type: string
  source: string
  date: string
  providerName: string
  providerCity: string
  providerSlug: string
  providerStableId: string
  providerSpecialty: string
  url: string
}

interface ChartPoint {
  date: string
  views: number
  reveals: number
  clicks: number
}

interface AnalyticsData {
  success: boolean
  totals: { views: number; reveals: number; clicks: number }
  trends: { views: number | null; reveals: number | null; clicks: number | null }
  chartData: ChartPoint[]
  providers: ProviderStats[]
  recentEvents: RecentEvent[]
}

// ─── Constants ──────────────────────────────────────────────────

const RANGES = [
  { label: '7j', value: '7d' },
  { label: '30j', value: '30d' },
  { label: '90j', value: '90d' },
  { label: 'Tout', value: 'all' },
]

const EVENT_CONFIG = {
  artisan_profile_view: { label: 'a consulté le profil de', color: 'text-blue-600', bg: 'bg-blue-50', icon: Eye },
  phone_reveal: { label: 'a affiché le numéro de', color: 'text-amber-600', bg: 'bg-amber-50', icon: Phone },
  phone_click: { label: 'a appelé', color: 'text-green-600', bg: 'bg-green-50', icon: PhoneCall },
} as const

// ─── Helpers ────────────────────────────────────────────────────

function buildArtisanUrl(p: { slug: string; stableId: string; specialty: string; city: string }) {
  if (!p.slug && !p.stableId) return null
  const specSlug = p.specialty?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'artisan'
  const citySlug = p.city?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'france'
  const id = p.slug || p.stableId
  return `/services/${specSlug}/${citySlug}/${id}`
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'table' | 'feed'>('table')

  const url = useMemo(() => {
    const params = new URLSearchParams({ range })
    if (search.length >= 2) params.set('search', search)
    return `/api/admin/analytics?${params}`
  }, [range, search])

  const { data, isLoading, error } = useAdminFetch<AnalyticsData>(url)

  const totalEvents = data ? data.totals.views + data.totals.reveals + data.totals.clicks : 0

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">
            {totalEvents.toLocaleString('fr-FR')} événement{totalEvents > 1 ? 's' : ''} enregistré{totalEvents > 1 ? 's' : ''}
          </p>
        </div>

        {/* Range pills */}
        <div className="flex items-center gap-2 bg-gray-100/80 rounded-xl p-1 border border-gray-200/50">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                range === r.value
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm font-medium">{String(error)}</p>
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────── */}
      {isLoading && !data && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-400">Chargement des analytics...</p>
        </div>
      )}

      {data?.success && (
        <>
          {/* ── KPI Cards ───────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Vues de profils"
              value={data.totals.views}
              trend={data.trends.views}
              icon={<Eye className="w-5 h-5" />}
              color="blue"
            />
            <KpiCard
              label="Numéros affichés"
              value={data.totals.reveals}
              trend={data.trends.reveals}
              icon={<Phone className="w-5 h-5" />}
              color="amber"
            />
            <KpiCard
              label="Appels déclenchés"
              value={data.totals.clicks}
              trend={data.trends.clicks}
              icon={<PhoneCall className="w-5 h-5" />}
              color="green"
            />
          </div>

          {/* ── Mini Sparkline Chart ────────────────────── */}
          {data.chartData.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Activité quotidienne</h3>
              </div>
              <MiniChart data={data.chartData} />
              <div className="flex items-center gap-6 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Vues</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Numéros</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Appels</span>
              </div>
            </div>
          )}

          {/* ── Tab switcher + Search ──────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex bg-gray-100/80 rounded-lg p-0.5 border border-gray-200/50">
              <button
                onClick={() => setTab('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Par artisan
              </button>
              <button
                onClick={() => setTab('feed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === 'feed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Fil d&apos;activité
              </button>
            </div>

            {tab === 'table' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un artisan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-64 bg-white"
                />
              </div>
            )}
          </div>

          {/* ── Table View ─────────────────────────────── */}
          {tab === 'table' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {data.providers.length === 0 ? (
                <div className="px-6 py-16 text-center text-gray-400">
                  <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Aucun résultat</p>
                  <p className="text-sm mt-1">Essayez une autre recherche ou période</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-4">Artisan</th>
                        <th className="px-4 py-4 text-center">Vues</th>
                        <th className="px-4 py-4 text-center">Numéros</th>
                        <th className="px-4 py-4 text-center">Appels</th>
                        <th className="px-4 py-4 text-center">Conversion</th>
                        <th className="px-4 py-4 text-right">Dernière activité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.providers.map((p, i) => {
                        const convRate = p.views > 0 ? Math.round((p.clicks / p.views) * 100) : 0
                        const artisanUrl = buildArtisanUrl(p)
                        const total = p.views + p.reveals + p.clicks

                        return (
                          <tr key={p.id} className="group hover:bg-blue-50/30 transition-colors">
                            {/* Artisan info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-600 transition-colors">
                                  {i + 1}
                                </div>
                                <div className="min-w-0">
                                  {artisanUrl ? (
                                    <Link
                                      href={artisanUrl}
                                      target="_blank"
                                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1.5 group/link"
                                    >
                                      <span className="truncate max-w-[200px]">{p.name}</span>
                                      <ExternalLink className="w-3 h-3 text-gray-300 group-hover/link:text-blue-400 flex-shrink-0 transition-colors" />
                                    </Link>
                                  ) : (
                                    <span className="font-semibold text-gray-900">{p.name}</span>
                                  )}
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <MapPin className="w-3 h-3 text-gray-300" />
                                    <span className="text-xs text-gray-400 truncate max-w-[180px]">
                                      {p.specialty}{p.city ? ` — ${p.city}` : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Metrics */}
                            <td className="px-4 py-4 text-center">
                              <MetricCell value={p.views} total={total} color="blue" />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <MetricCell value={p.reveals} total={total} color="amber" />
                            </td>
                            <td className="px-4 py-4 text-center">
                              <MetricCell value={p.clicks} total={total} color="green" />
                            </td>

                            {/* Conversion */}
                            <td className="px-4 py-4 text-center">
                              <ConversionBadge rate={convRate} />
                            </td>

                            {/* Last activity */}
                            <td className="px-4 py-4 text-right">
                              <span className="text-xs text-gray-400" title={formatDate(p.lastActivity)}>
                                {formatRelativeDate(p.lastActivity)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Activity Feed ──────────────────────────── */}
          {tab === 'feed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {data.recentEvents.length === 0 ? (
                <div className="px-6 py-16 text-center text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Aucune activité récente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.recentEvents.map((event) => {
                    const config = EVENT_CONFIG[event.type as keyof typeof EVENT_CONFIG]
                    if (!config) return null
                    const Icon = config.icon
                    const artisanUrl = buildArtisanUrl({
                      slug: event.providerSlug,
                      stableId: event.providerStableId,
                      specialty: event.providerSpecialty,
                      city: event.providerCity,
                    })

                    return (
                      <div key={event.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full ${config.bg} flex items-center justify-center mt-0.5`}>
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">
                            <span className="text-gray-400">Un visiteur</span>{' '}
                            <span className={`font-medium ${config.color}`}>{config.label}</span>{' '}
                            {artisanUrl ? (
                              <Link href={artisanUrl} target="_blank" className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                {event.providerName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-gray-900">{event.providerName}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(event.date)}
                            </span>
                            {event.source && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-mono">
                                {event.source}
                              </span>
                            )}
                            {event.providerCity && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.providerCity}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Time */}
                        <span className="text-xs text-gray-300 whitespace-nowrap flex-shrink-0 mt-1">
                          {formatRelativeDate(event.date)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Components ─────────────────────────────────────────────────

function KpiCard({ label, value, trend, icon, color }: {
  label: string
  value: number
  trend: number | null
  icon: React.ReactNode
  color: 'blue' | 'amber' | 'green'
}) {
  const styles = {
    blue: { card: 'from-blue-500 to-indigo-600', ring: 'ring-blue-500/10', iconBg: 'bg-white/20' },
    amber: { card: 'from-amber-400 to-orange-500', ring: 'ring-amber-500/10', iconBg: 'bg-white/20' },
    green: { card: 'from-emerald-500 to-green-600', ring: 'ring-green-500/10', iconBg: 'bg-white/20' },
  }[color]

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles.card} text-white p-6 shadow-lg ring-1 ${styles.ring}`}>
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${styles.iconBg} backdrop-blur-sm`}>
            {icon}
          </div>
          {trend !== null && (
            <div className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
              trend > 0 ? 'bg-white/20' : trend < 0 ? 'bg-red-500/30' : 'bg-white/10'
            }`}>
              {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> :
               trend < 0 ? <TrendingDown className="w-3.5 h-3.5" /> :
               <Minus className="w-3.5 h-3.5" />}
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className="text-4xl font-extrabold tracking-tight">{value.toLocaleString('fr-FR')}</div>
        <div className="text-sm text-white/70 mt-1 font-medium">{label}</div>
      </div>
    </div>
  )
}

function MetricCell({ value, total, color }: { value: number; total: number; color: 'blue' | 'amber' | 'green' }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const barColor = { blue: 'bg-blue-400', amber: 'bg-amber-400', green: 'bg-green-500' }[color]
  const textColor = { blue: 'text-blue-700', amber: 'text-amber-700', green: 'text-green-700' }[color]

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`text-sm font-bold ${value > 0 ? textColor : 'text-gray-300'}`}>
        {value}
      </span>
      <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function ConversionBadge({ rate }: { rate: number }) {
  if (rate === 0) {
    return <span className="text-xs text-gray-300 font-medium">—</span>
  }

  const color = rate >= 20
    ? 'bg-green-50 text-green-700 ring-green-200/50'
    : rate >= 5
    ? 'bg-amber-50 text-amber-700 ring-amber-200/50'
    : 'bg-gray-50 text-gray-500 ring-gray-200/50'

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${color}`}>
      <ArrowUpRight className="w-3 h-3" />
      {rate}%
    </span>
  )
}

function MiniChart({ data }: { data: ChartPoint[] }) {
  // Simple SVG sparkline chart
  const width = 800
  const height = 80
  const padding = { top: 4, bottom: 4, left: 0, right: 0 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxVal = Math.max(1, ...data.map(d => Math.max(d.views, d.reveals, d.clicks)))

  function makePath(key: 'views' | 'reveals' | 'clicks') {
    return data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW
      const y = padding.top + chartH - (d[key] / maxVal) * chartH
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ')
  }

  function makeArea(key: 'views' | 'reveals' | 'clicks') {
    const path = makePath(key)
    const lastX = padding.left + chartW
    const baseY = padding.top + chartH
    return `${path} L${lastX},${baseY} L${padding.left},${baseY} Z`
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" preserveAspectRatio="none">
      {/* Areas */}
      <path d={makeArea('views')} fill="rgb(96 165 250 / 0.12)" />
      <path d={makeArea('reveals')} fill="rgb(251 191 36 / 0.1)" />
      <path d={makeArea('clicks')} fill="rgb(34 197 94 / 0.12)" />
      {/* Lines */}
      <path d={makePath('views')} fill="none" stroke="rgb(96 165 250)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath('reveals')} fill="none" stroke="rgb(251 191 36)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={makePath('clicks')} fill="none" stroke="rgb(34 197 94)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
