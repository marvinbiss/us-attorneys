'use client'

import {
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

// Color palette
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  color?: string
}

export function StatCard({ title, value, change, changeLabel, icon, color = COLORS.primary }: StatCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
          }`}>
            {isPositive && <ArrowUpRight className="w-4 h-4" />}
            {isNegative && <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
      {changeLabel && (
        <div className="text-xs text-gray-400 mt-1">{changeLabel}</div>
      )}
    </div>
  )
}

interface RevenueChartProps {
  data: Array<{
    date: string
    revenue: number
    bookings: number
  }>
  title?: string
}

export function RevenueChart({ data, title = 'Revenue & Bookings' }: RevenueChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend />
          <Bar yAxisId="right" dataKey="bookings" name="Bookings" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
          <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue ($)" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

interface BookingsTrendProps {
  data: Array<{
    date: string
    confirmed: number
    pending: number
    cancelled: number
  }>
}

export function BookingsTrendChart({ data }: BookingsTrendProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area type="monotone" dataKey="confirmed" name="Confirmed" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} />
          <Area type="monotone" dataKey="pending" name="Pending" stackId="1" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.6} />
          <Area type="monotone" dataKey="cancelled" name="Cancelled" stackId="1" stroke={COLORS.danger} fill={COLORS.danger} fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface RatingDistributionProps {
  data: Array<{
    rating: number
    count: number
  }>
}

export function RatingDistributionChart({ data }: RatingDistributionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis dataKey="rating" type="category" tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(value) => `${value} ⭐`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" name="Reviews" fill={COLORS.warning} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface ServiceDistributionProps {
  data: Array<{
    name: string
    value: number
  }>
}

export function ServiceDistributionChart({ data }: ServiceDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution by specialty</h3>
      <div className="flex items-center gap-8">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface GeographicHeatmapProps {
  data: Array<{
    city: string
    bookings: number
    revenue: number
  }>
}

export function GeographicDistribution({ data }: GeographicHeatmapProps) {
  const maxBookings = Math.max(...data.map((d) => d.bookings))

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic distribution</h3>
      <div className="space-y-3">
        {data.slice(0, 10).map((item) => (
          <div key={item.city} className="flex items-center gap-4">
            <div className="w-24 text-sm font-medium text-gray-700 truncate">{item.city}</div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${(item.bookings / maxBookings) * 100}%` }}
              />
            </div>
            <div className="w-16 text-right text-sm text-gray-600">{item.bookings}</div>
            <div className="w-20 text-right text-sm font-medium text-gray-900">{item.revenue}$</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PerformanceMetricsProps {
  data: {
    responseTime: number
    completionRate: number
    customerSatisfaction: number
    repeatCustomerRate: number
  }
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  const metrics = [
    { label: 'Response time', value: `${data.responseTime}h`, target: '<24h', status: data.responseTime <= 24 ? 'good' : 'warning' },
    { label: 'Completion rate', value: `${data.completionRate}%`, target: '>95%', status: data.completionRate >= 95 ? 'good' : data.completionRate >= 80 ? 'warning' : 'bad' },
    { label: 'Client satisfaction', value: `${data.customerSatisfaction}%`, target: '>90%', status: data.customerSatisfaction >= 90 ? 'good' : 'warning' },
    { label: 'Repeat clients', value: `${data.repeatCustomerRate}%`, target: '>30%', status: data.repeatCustomerRate >= 30 ? 'good' : 'warning' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance metrics</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{metric.label}</span>
              <span className={`w-2 h-2 rounded-full ${
                metric.status === 'good' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <div className="text-xs text-gray-400 mt-1">Target: {metric.target}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface TrendComparisonProps {
  currentPeriod: number
  previousPeriod: number
  label: string
  format?: 'number' | 'currency' | 'percent'
}

export function TrendComparison({ currentPeriod, previousPeriod, label, format = 'number' }: TrendComparisonProps) {
  const change = previousPeriod > 0
    ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
    : 0

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `${val.toLocaleString('en-US')}$`
      case 'percent':
        return `${val}%`
      default:
        return val.toLocaleString('en-US')
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xl font-bold text-gray-900">{formatValue(currentPeriod)}</div>
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
        change > 0 ? 'bg-green-100 text-green-700' : change < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {change > 0 ? <TrendingUp className="w-4 h-4" /> : change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </div>
    </div>
  )
}

// Dashboard wrapper with period selector
interface DashboardProps {
  children: React.ReactNode
  onPeriodChange?: (period: string) => void
  selectedPeriod?: string
}

export function DashboardWrapper({ children, onPeriodChange, selectedPeriod = '7d' }: DashboardProps) {
  const periods = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '3 months' },
    { value: '1y', label: '1 year' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => onPeriodChange?.(period.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-white shadow text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

// Export all components
export {
  COLORS,
  PIE_COLORS,
}
