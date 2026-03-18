'use client'

import { useMemo } from 'react'
import { AlertTriangle, TrendingUp, Clock, BarChart3, Users, ShieldCheck, Info } from 'lucide-react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { CaseEstimate } from '@/lib/case-estimator'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CaseEstimateResultProps {
  estimate: CaseEstimate
  specialtySlug: string
  specialtyName: string
  stateCode: string
  stateName: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

function confidenceLabel(c: CaseEstimate['confidence']): { text: string; color: string; bg: string } {
  switch (c) {
    case 'high':
      return { text: 'High Confidence', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    case 'medium':
      return { text: 'Medium Confidence', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    case 'low':
      return { text: 'Low Confidence', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  }
}

const CHART_COLORS = [
  '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe',
  '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
]

// ---------------------------------------------------------------------------
// Win Rate Gauge
// ---------------------------------------------------------------------------

function WinRateGauge({ rate }: { rate: number }) {
  const radius = 54
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (rate / 100) * circumference

  const gaugeColor =
    rate >= 70 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="transform -rotate-90"
        role="img"
        aria-label={`Win rate: ${rate}%`}
      >
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-700"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '32px' }}>
        <span className="text-3xl font-bold text-white">{rate}%</span>
        <span className="text-xs text-gray-400 mt-0.5">Favorable</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settlement Distribution Chart
// ---------------------------------------------------------------------------

function SettlementChart({ buckets }: { buckets: CaseEstimate['amountBuckets'] }) {
  const data = useMemo(
    () => buckets.filter((b) => b.count > 0),
    [buckets]
  )

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Not enough settlement data to display chart.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="range"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          height={60}
        />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f3f4f6',
          }}
          formatter={(value) => [`${Number(value)} cases`, 'Count']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CaseEstimateResult({
  estimate,
  specialtySlug,
  specialtyName,
  stateCode,
  stateName,
}: CaseEstimateResultProps) {
  const conf = confidenceLabel(estimate.confidence)

  const hasAmountData = estimate.avgSettlement > 0

  return (
    <div className="space-y-8">
      {/* ── Disclaimer Banner ─────────────────────────────────────────── */}
      <div
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3"
        role="alert"
      >
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/90">
          <p className="font-semibold text-amber-300 mb-1">Important Legal Disclaimer</p>
          <p>
            This tool provides estimates based on historical data and is{' '}
            <strong>NOT legal advice</strong>. Every case is unique. Past results do not guarantee
            future outcomes. Consult a qualified attorney for advice specific to your situation.
          </p>
        </div>
      </div>

      {/* ── Estimated Range (hero) ────────────────────────────────────── */}
      {hasAmountData && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-8 text-center">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Estimated Outcome Range</p>
          <p className="text-4xl md:text-5xl font-bold text-white mb-3">
            {formatCurrency(estimate.estimatedRange.low)} &ndash;{' '}
            {formatCurrency(estimate.estimatedRange.high)}
          </p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${conf.bg} ${conf.color}`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {conf.text} &middot; Based on {estimate.sampleSize.toLocaleString()} case{estimate.sampleSize !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Stats Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="Win/Settlement Rate"
          value={`${estimate.winRate}%`}
        />
        {hasAmountData && (
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-indigo-400" />}
            label="Avg. Settlement"
            value={formatCurrency(estimate.avgSettlement)}
          />
        )}
        {hasAmountData && (
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
            label="Median Settlement"
            value={formatCurrency(estimate.medianSettlement)}
          />
        )}
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          label="Avg. Time to Resolution"
          value={estimate.avgDuration}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-sky-400" />}
          label="Cases Analyzed"
          value={estimate.sampleSize.toLocaleString()}
        />
      </div>

      {/* ── Win Rate Gauge + Outcome Distribution ─────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gauge */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-4">
            Favorable Outcome Rate
          </h3>
          <div className="relative flex items-center justify-center">
            <WinRateGauge rate={estimate.winRate} />
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Includes wins and settlements for {specialtyName} in {stateName}
          </p>
        </div>

        {/* Outcome breakdown */}
        <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Outcome Distribution</h3>
          {estimate.outcomeDistribution.length > 0 ? (
            <ul className="space-y-3">
              {estimate.outcomeDistribution.map((o) => (
                <li key={o.outcome} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">{o.outcome}</span>
                      <span className="text-sm font-medium text-white">
                        {o.count} ({o.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
                        style={{ width: `${o.percentage}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No outcome data available.</p>
          )}
        </div>
      </div>

      {/* ── Settlement Distribution Histogram ─────────────────────────── */}
      {hasAmountData && (
        <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Settlement Distribution</h3>
          <p className="text-sm text-gray-400 mb-4">
            How settlements are distributed for {specialtyName} cases in {stateName}
          </p>
          <SettlementChart buckets={estimate.amountBuckets} />
        </div>
      )}

      {/* ── Data Source Note ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-gray-800/30 border border-gray-700/50 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          These estimates are based on {estimate.sampleSize.toLocaleString()} publicly available
          case records in {stateName} and are not a guarantee of any outcome. Individual results vary
          significantly based on case specifics, attorney skill, and jurisdiction.
        </p>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          Find an Attorney Who Handles These Cases
        </h3>
        <p className="text-indigo-100 mb-6 max-w-xl mx-auto">
          Connect with experienced {specialtyName.toLowerCase()} attorneys in {stateName} who can
          evaluate your specific situation and provide personalized legal guidance.
        </p>
        <Link
          href={`/search?specialty=${specialtySlug}&state=${stateCode.toLowerCase()}`}
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Search {specialtyName} Attorneys in {stateName}
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat Card sub-component
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
