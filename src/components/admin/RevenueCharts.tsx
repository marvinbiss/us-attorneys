'use client'

import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine,
} from 'recharts'

// ─── Currency formatter ────────────────────────────────────────
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const fmtShort = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v}`
}

const fmtMonth = (v: string) => {
  const [year, month] = v.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
}

// ─── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const fmt = formatter || ((v: number) => v.toLocaleString('en-US'))
  return (
    <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl border border-gray-700 text-sm">
      <p className="text-gray-400 text-xs mb-2 font-medium">{label ? fmtMonth(label) : ''}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-bold">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 1. MRR Chart (Line + Area) ───────────────────────────────
interface MRRChartProps {
  data: Array<{ month: string; mrr: number; subscribers: number }>
  target?: number
}

export function MRRChart({ data, target }: MRRChartProps) {
  if (!data || data.length < 2) {
    return <EmptyChart message="Not enough data for MRR trend" />
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">MRR Trend</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monthly Recurring Revenue (12 months)</p>
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{fmtCurrency(data[data.length - 1].mrr)}</p>
            <p className="text-xs text-gray-400">Current MRR</p>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={fmtMonth}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtShort}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<ChartTooltip formatter={fmtCurrency} />} />
          {target && (
            <ReferenceLine
              y={target}
              stroke="#f59e0b"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{ value: `Target ${fmtShort(target)}`, position: 'right', fontSize: 11, fill: '#f59e0b' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="mrr"
            name="MRR"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#mrrGradient)"
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 2. Subscriber Growth Chart (Stacked Area) ────────────────
interface SubscriberGrowthChartProps {
  data: Array<{ month: string; free: number; pro: number; premium: number }>
}

export function SubscriberGrowthChart({ data }: SubscriberGrowthChartProps) {
  if (!data || data.length < 2) {
    return <EmptyChart message="Not enough data for subscriber growth" />
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Subscriber Growth</h3>
          <p className="text-xs text-gray-400 mt-0.5">New signups per month by plan</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="freeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={fmtMonth}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="free"
            name="Free"
            stackId="1"
            stroke="#94a3b8"
            fill="url(#freeGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="pro"
            name="Pro"
            stackId="1"
            stroke="#6366f1"
            fill="url(#proGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="premium"
            name="Premium"
            stackId="1"
            stroke="#8b5cf6"
            fill="url(#premiumGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 3. Revenue Pie Chart (Donut) ─────────────────────────────
interface RevenuePieChartProps {
  data: Array<{ name: string; value: number; count: number; color: string }>
}

export function RevenuePieChart({ data }: RevenuePieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <EmptyChart message="No revenue data to display" />
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Revenue by Plan</h3>
        <p className="text-xs text-gray-400 mt-0.5">Current MRR distribution</p>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative">
          <ResponsiveContainer width={260} height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} className="drop-shadow-sm" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => fmtCurrency(Number(value))}
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                }}
                itemStyle={{ color: '#d1d5db' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white">{fmtCurrency(total)}</span>
            <span className="text-xs text-gray-400">Total MRR</span>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.name} ({entry.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 4. Churn Analysis Chart ──────────────────────────────────
interface ChurnChartProps {
  data: Array<{ month: string; cancelled: number; churnRate: number }>
}

export function ChurnChart({ data }: ChurnChartProps) {
  if (!data || data.length < 2) {
    return <EmptyChart message="Not enough data for churn analysis" />
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Churn Analysis</h3>
        <p className="text-xs text-gray-400 mt-0.5">Monthly churn rate and cancellations</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={fmtMonth}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="cancelled"
            name="Cancelled"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ef4444' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="churnRate"
            name="Churn Rate %"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── 5. Cohort Heatmap ────────────────────────────────────────
interface CohortHeatmapProps {
  cohorts: Array<{
    cohort: string
    total: number
    retained: number[]
  }>
}

export function CohortHeatmap({ cohorts }: CohortHeatmapProps) {
  if (!cohorts || cohorts.length === 0) {
    return <EmptyChart message="No cohort data available" />
  }

  const maxMonths = Math.max(...cohorts.map(c => c.retained.length))

  function getHeatColor(pct: number): string {
    if (pct >= 80) return 'bg-emerald-500 text-white'
    if (pct >= 60) return 'bg-emerald-400 text-white'
    if (pct >= 40) return 'bg-emerald-300 text-gray-900'
    if (pct >= 20) return 'bg-emerald-200 text-gray-700'
    if (pct > 0) return 'bg-emerald-100 text-gray-600'
    return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cohort Retention</h3>
        <p className="text-xs text-gray-400 mt-0.5">% of subscribers still active by signup month</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Cohort</th>
              <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Size</th>
              {Array.from({ length: maxMonths }, (_, i) => (
                <th key={i} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-2">
                  M{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort) => (
              <tr key={cohort.cohort}>
                <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {fmtMonth(cohort.cohort)}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{cohort.total}</span>
                </td>
                {Array.from({ length: maxMonths }, (_, i) => {
                  const pct = cohort.retained[i]
                  return (
                    <td key={i} className="px-1 py-2 text-center">
                      {pct !== undefined ? (
                        <span className={`inline-block w-12 py-1.5 rounded-lg text-xs font-bold ${getHeatColor(pct)}`}>
                          {pct}%
                        </span>
                      ) : (
                        <span className="inline-block w-12 py-1.5 text-gray-300 dark:text-gray-600">--</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
        <span>Retention:</span>
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-gray-600">0-20%</span>
        <span className="px-2 py-0.5 rounded bg-emerald-300 text-gray-900">40-60%</span>
        <span className="px-2 py-0.5 rounded bg-emerald-500 text-white">80%+</span>
      </div>
    </div>
  )
}

// ─── 6. Trial Conversion Funnel ───────────────────────────────
interface TrialFunnelProps {
  funnel: {
    started: number
    converted: number
    churned: number
    conversionRate: number
  }
}

export function TrialFunnel({ funnel }: TrialFunnelProps) {
  const stages = [
    { label: 'Trials Started', value: funnel.started, color: 'bg-blue-500', width: '100%' },
    { label: 'Converted', value: funnel.converted, color: 'bg-emerald-500', width: funnel.started > 0 ? `${(funnel.converted / funnel.started) * 100}%` : '0%' },
    { label: 'Churned', value: funnel.churned, color: 'bg-red-500', width: funnel.started > 0 ? `${(funnel.churned / funnel.started) * 100}%` : '0%' },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Trial Conversion Funnel</h3>
          <p className="text-xs text-gray-400 mt-0.5">Trial to paid conversion</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-emerald-600">{funnel.conversionRate}%</p>
          <p className="text-xs text-gray-400">Conversion rate</p>
        </div>
      </div>
      <div className="space-y-4">
        {stages.map((stage, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{stage.label}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{stage.value}</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${stage.color} rounded-full transition-all duration-700`}
                style={{ width: stage.width }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
