'use client'

import Link from 'next/link'
import { Users, Briefcase, Calendar, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalAttorneys: number
  totalBookings: number
  totalRevenue: number
  trends: {
    users: number
    bookings: number
    revenue: number
  }
}

interface StatsGridProps {
  stats: Stats | null
  loading?: boolean
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Minus className="w-3 h-3" />
        0%
      </span>
    )
  }
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
        <TrendingUp className="w-3 h-3" />
        +{value}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-600">
      <TrendingDown className="w-3 h-3" />
      {value}%
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="w-14 h-4 bg-gray-200 rounded" />
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded mb-2" />
      <div className="w-28 h-4 bg-gray-200 rounded" />
    </div>
  )
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  const cards = [
    {
      label: 'Users',
      value: stats.totalUsers.toLocaleString('en-US'),
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      trend: stats.trends.users,
      trendLabel: 'vs last month',
      href: '/admin/users',
    },
    {
      label: 'Active attorneys',
      value: stats.totalAttorneys.toLocaleString('en-US'),
      icon: Briefcase,
      color: 'bg-indigo-100 text-indigo-600',
      trend: null,
      trendLabel: null,
      href: '/admin/attorneys',
    },
    {
      label: 'Bookings',
      value: stats.totalBookings.toLocaleString('en-US'),
      icon: Calendar,
      color: 'bg-green-100 text-green-600',
      trend: stats.trends.bookings,
      trendLabel: 'vs last month',
      href: '/admin/bookings',
    },
    {
      label: 'Revenue this month',
      value: `${(stats.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`,
      icon: DollarSign,
      color: 'bg-amber-100 text-amber-600',
      trend: stats.trends.revenue,
      trendLabel: 'vs last month',
      href: '/admin/payments',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group block"
          aria-label={`${card.label}: ${card.value}${card.trend !== null ? `, trend ${card.trend > 0 ? '+' : ''}${card.trend}%` : ''}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            {card.trend !== null && (
              <div className="text-right">
                <TrendBadge value={card.trend} />
                {card.trendLabel && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{card.trendLabel}</p>
                )}
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{card.value}</p>
          <p className="text-sm text-gray-500 mt-1">{card.label}</p>
        </Link>
      ))}
    </div>
  )
}
