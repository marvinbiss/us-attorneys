'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Calendar,
  Euro,
  Star,
  Clock,
  ChevronLeft,
  Loader2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

interface Stats {
  totalBookings: number
  totalBookingsChange: number
  monthlyRevenue: number
  monthlyRevenueChange: number
  averageRating: number
  totalReviews: number
  newClients: number
  newClientsChange: number
  cancelRate: number
  bookingsByDay: { day: string; count: number }[]
  bookingsByMonth: { month: string; count: number }[]
  topServices: { name: string; count: number }[]
  upcomingBookings: number
}

export default function StatistiquesPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [noProvider, setNoProvider] = useState(false)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/artisan/stats?period=${period}`)

        if (res.status === 404) {
          setNoProvider(true)
          setIsLoading(false)
          return
        }

        if (!res.ok) {
          setIsLoading(false)
          return
        }

        const data = await res.json()

        if (!data.provider) {
          setNoProvider(true)
          setIsLoading(false)
          return
        }

        const s = data.stats

        setStats({
          totalBookings: s.totalBookings ?? 0,
          totalBookingsChange: s.totalBookingsChange ?? 0,
          monthlyRevenue: s.monthlyRevenue ?? 0,
          monthlyRevenueChange: s.monthlyRevenueChange ?? 0,
          averageRating: s.averageRating ?? 0,
          totalReviews: s.totalReviews ?? 0,
          newClients: s.clientsSatisfaits?.value ?? 0,
          newClientsChange: s.totalBookingsChange ?? 0,
          cancelRate: s.cancelRate ?? 0,
          bookingsByDay: s.bookingsByDay ?? [],
          bookingsByMonth: s.bookingsByMonth ?? [],
          topServices: s.topServices ?? [],
          upcomingBookings: s.upcomingBookings ?? 0,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [period])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (noProvider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun profil artisan trouvé</h2>
          <p className="text-gray-500">Vous devez créer votre profil artisan pour accéder aux statistiques.</p>
          <Link
            href="/espace-artisan/profil"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer mon profil
          </Link>
        </div>
      </div>
    )
  }

  if (!stats) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Aucune donnée disponible</div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <Link
              href="/espace-artisan/calendrier"
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Statistiques</h1>
              <p className="text-blue-100">Analysez les performances de votre activité</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'week', label: 'Semaine' },
            { id: 'month', label: 'Mois' },
            { id: 'year', label: 'Année' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as 'week' | 'month' | 'year')}
              className={`px-4 py-2 rounded-lg font-medium ${
                period === p.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Key metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
              <span className={`flex items-center text-sm font-medium ${
                stats.totalBookingsChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.totalBookingsChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(Math.round(stats.totalBookingsChange))}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
            <div className="text-sm text-gray-500">Réservations totales</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Euro className="w-8 h-8 text-green-600" />
              <span className={`flex items-center text-sm font-medium ${
                stats.monthlyRevenueChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.monthlyRevenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(Math.round(stats.monthlyRevenueChange))}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.monthlyRevenue.toFixed(0)}EUR</div>
            <div className="text-sm text-gray-500">Revenus ce mois</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-yellow-500" />
              <span className="text-sm text-gray-500">{stats.totalReviews} avis</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.averageRating || '-'}</div>
            <div className="text-sm text-gray-500">Note moyenne</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.upcomingBookings}</div>
            <div className="text-sm text-gray-500">RDV à venir</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Bookings by day chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Réservations par jour
            </h3>
            <div className="flex items-end justify-between h-32 sm:h-40">
              {stats.bookingsByDay.map((day) => {
                const maxCount = Math.max(...stats.bookingsByDay.map(d => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={day.day} className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-600">{day.count}</div>
                    <div
                      className="w-10 bg-blue-500 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="text-xs text-gray-500">{day.day}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bookings by month chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Evolution mensuelle
            </h3>
            <div className="flex items-end justify-between h-32 sm:h-40">
              {stats.bookingsByMonth.map((month, i) => {
                const maxCount = Math.max(...stats.bookingsByMonth.map(m => m.count), 1)
                const height = (month.count / maxCount) * 100
                return (
                  <div key={month.month} className="flex flex-col items-center gap-2">
                    <div className="text-xs text-gray-600">{month.count}</div>
                    <div
                      className={`w-10 rounded-t transition-all ${
                        i === stats.bookingsByMonth.length - 1 ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="text-xs text-gray-500">{month.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top services */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              Services les plus demandés
            </h3>
            {stats.topServices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-4">
                {stats.topServices.map((service, i) => {
                  const maxCount = stats.topServices[0].count
                  const width = (service.count / maxCount) * 100
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate">{service.name}</span>
                        <span className="text-gray-500">{service.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Performance indicators */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Indicateurs clés</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <div className="text-sm text-red-700">Taux d&apos;annulation</div>
                  <div className="text-2xl font-bold text-red-800">{stats.cancelRate}%</div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32" cy="32" r="28"
                      stroke="#fef2f2"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="32" cy="32" r="28"
                      stroke="#ef4444"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${stats.cancelRate * 1.76} 176`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
