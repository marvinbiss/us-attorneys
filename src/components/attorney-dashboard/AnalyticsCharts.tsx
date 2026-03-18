'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Eye, Users, CalendarCheck, CheckCircle } from 'lucide-react'

// ─── Color Palette ───────────────────────────────────────────────────────────

const CHART_COLORS = {
  primary: '#3b82f6',
  primaryLight: '#93c5fd',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
}

// ─── Views Chart (Line/Area with Gradient) ───────────────────────────────────

interface ViewsDataPoint {
  date: string
  views: number
  contacts?: number
}

interface ViewsChartProps {
  data: ViewsDataPoint[]
  title?: string
}

export function ViewsChart({ data, title = 'Profile Views' }: ViewsChartProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Daily profile views over the selected period
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="contactsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.secondary} stopOpacity={0.2} />
              <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:opacity-20"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke={CHART_COLORS.primary}
            strokeWidth={2.5}
            fill="url(#viewsGradient)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, fill: 'white' }}
          />
          {data.some((d) => d.contacts !== undefined) && (
            <Area
              type="monotone"
              dataKey="contacts"
              name="Contacts"
              stroke={CHART_COLORS.secondary}
              strokeWidth={2}
              fill="url(#contactsGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'white' }}
              strokeDasharray="5 3"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Lead Funnel ─────────────────────────────────────────────────────────────

interface FunnelStage {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

interface LeadFunnelProps {
  views: number
  contacts: number
  bookings: number
  completed: number
}

export function LeadFunnel({ views, contacts, bookings, completed }: LeadFunnelProps) {
  const reducedMotion = useReducedMotion()
  const maxValue = Math.max(views, 1)

  const stages: FunnelStage[] = [
    { label: 'Profile Views', value: views, icon: <Eye className="w-4 h-4" />, color: CHART_COLORS.primary },
    { label: 'Contacts', value: contacts, icon: <Users className="w-4 h-4" />, color: CHART_COLORS.secondary },
    { label: 'Bookings', value: bookings, icon: <CalendarCheck className="w-4 h-4" />, color: CHART_COLORS.warning },
    { label: 'Completed', value: completed, icon: <CheckCircle className="w-4 h-4" />, color: CHART_COLORS.success },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Lead Funnel</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Conversion path from views to completed cases
      </p>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const pct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
          const conversionFromPrev =
            index > 0 && stages[index - 1].value > 0
              ? ((stage.value / stages[index - 1].value) * 100).toFixed(1)
              : null

          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${stage.color}15`, color: stage.color }}
                  >
                    {stage.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {conversionFromPrev && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {conversionFromPrev}% conv.
                    </span>
                  )}
                  <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums min-w-[3rem] text-right">
                    {stage.value.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <motion.div
                  className="h-full rounded-lg"
                  style={{
                    background: `linear-gradient(90deg, ${stage.color}, ${stage.color}cc)`,
                  }}
                  initial={reducedMotion ? { width: `${pct}%` } : { width: '0%' }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 0.8, delay: index * 0.15, ease: 'easeOut' }
                  }
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Practice Area Breakdown (Horizontal Bar Chart) ──────────────────────────

interface PracticeAreaData {
  name: string
  views: number
  contacts: number
}

interface PracticeAreaBreakdownProps {
  data: PracticeAreaData[]
  title?: string
}

export function PracticeAreaBreakdown({
  data,
  title = 'Top Practice Areas',
}: PracticeAreaBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Performance breakdown by practice area
      </p>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 48, 200)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:opacity-20"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
          />
          <Bar
            dataKey="views"
            name="Views"
            fill={CHART_COLORS.primary}
            radius={[0, 4, 4, 0]}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            opacity={activeIndex === null ? 1 : 0.7}
          />
          <Bar
            dataKey="contacts"
            name="Contacts"
            fill={CHART_COLORS.secondary}
            radius={[0, 4, 4, 0]}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          />
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.primary }} />
          <span className="text-xs text-gray-500 dark:text-gray-400">Views</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: CHART_COLORS.secondary }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">Contacts</span>
        </div>
      </div>
    </div>
  )
}

// ─── Market Comparison Card ──────────────────────────────────────────────────

interface MarketComparisonProps {
  practiceArea: string
  state: string
  yourRate: number
  marketRate: number
  metric: string
}

export function MarketComparison({
  practiceArea,
  state,
  yourRate,
  marketRate,
  metric,
}: MarketComparisonProps) {
  const diff = marketRate > 0 ? ((yourRate - marketRate) / marketRate) * 100 : 0
  const isAbove = diff > 0
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-lg">
            {isAbove ? '🏆' : '📊'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Market Comparison
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Your {metric} is{' '}
            <span
              className={`font-bold ${
                isAbove
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {Math.abs(Math.round(diff))}% {isAbove ? 'above' : 'below'} average
            </span>{' '}
            in {practiceArea}, {state}.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">You</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{yourRate}%</p>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Market Avg.</p>
              <p className="text-lg font-bold text-gray-500 dark:text-gray-400">{marketRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Recent Activity Feed ────────────────────────────────────────────────────

export interface ActivityItem {
  id: string
  type: 'view' | 'contact' | 'booking' | 'review'
  title: string
  description: string
  timestamp: string
}

interface RecentActivityProps {
  items: ActivityItem[]
}

const activityIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  view: { icon: <Eye className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
  contact: { icon: <Users className="w-4 h-4" />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  booking: { icon: <CalendarCheck className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  review: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' },
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Recent Activity
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Latest interactions on your profile
      </p>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <Eye className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const meta = activityIcons[item.type] || activityIcons.view
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
              >
                <div className={`p-1.5 rounded-md flex-shrink-0 ${meta.color}`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {item.description}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
