'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RevenueKPICardProps {
  label: string
  value: string
  trend?: number | null
  icon: React.ReactNode
  color: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'indigo'
  sparkline?: number[]
  onClick?: () => void
  subtitle?: string
}

const COLOR_MAP = {
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'ring-blue-500/10',
    shadow: 'shadow-blue-500/20',
    sparkFill: 'rgba(255,255,255,0.08)',
    sparkStroke: 'rgba(255,255,255,0.5)',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-500/10',
    shadow: 'shadow-emerald-500/20',
    sparkFill: 'rgba(255,255,255,0.08)',
    sparkStroke: 'rgba(255,255,255,0.5)',
  },
  violet: {
    gradient: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-500/10',
    shadow: 'shadow-violet-500/20',
    sparkFill: 'rgba(255,255,255,0.08)',
    sparkStroke: 'rgba(255,255,255,0.5)',
  },
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    ring: 'ring-amber-500/10',
    shadow: 'shadow-amber-500/20',
    sparkFill: 'rgba(255,255,255,0.08)',
    sparkStroke: 'rgba(255,255,255,0.5)',
  },
  rose: {
    gradient: 'from-rose-500 to-pink-600',
    ring: 'ring-rose-500/10',
    shadow: 'shadow-rose-500/20',
    sparkFill: 'rgba(255,255,255,0.08)',
    sparkStroke: 'rgba(255,255,255,0.5)',
  },
  indigo: {
    gradient: 'from-indigo-500 to-blue-600',
    ring: 'ring-indigo-500/10',
    shadow: 'shadow-indigo-500/20',
    sparkFill: 'rgba(255,255,255,0.08)',
    sparkStroke: 'rgba(255,255,255,0.5)',
  },
}

function MiniSparkline({ data, fill, stroke }: { data: number[]; fill: string; stroke: string }) {
  if (!data || data.length < 2) return null

  const width = 120
  const height = 40
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (v - min) / range) * (height - padding * 2),
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="absolute bottom-0 right-0 w-28 h-12 opacity-60"
      preserveAspectRatio="none"
    >
      <path d={areaPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function RevenueKPICard({
  label,
  value,
  trend,
  icon,
  color,
  sparkline,
  onClick,
  subtitle,
}: RevenueKPICardProps) {
  const styles = COLOR_MAP[color]
  const isClickable = !!onClick

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles.gradient}
        text-white p-6 shadow-lg ${styles.shadow} ring-1 ${styles.ring}
        ${isClickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200' : ''}
      `}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() } : undefined}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

      {/* Sparkline background */}
      {sparkline && sparkline.length >= 2 && (
        <MiniSparkline data={sparkline} fill={styles.sparkFill} stroke={styles.sparkStroke} />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            {icon}
          </div>
          {trend !== undefined && trend !== null && (
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
        <div className="text-3xl font-extrabold tracking-tight">{value}</div>
        <div className="text-sm text-white/70 mt-1 font-medium">{label}</div>
        {subtitle && (
          <div className="text-xs text-white/50 mt-0.5">{subtitle}</div>
        )}
      </div>
    </div>
  )
}
