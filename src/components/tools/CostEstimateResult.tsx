'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  Clock,
  Scale,
  AlertCircle,
  ChevronRight,
  Info,
  MapPin,
  BarChart3,
  PieChart as PieChartIcon,
  CheckCircle,
  Phone,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { CostEstimate, FeeStructureDetail, StateComparison, Complexity } from '@/lib/cost-estimator'

// ── Props ────────────────────────────────────────────────────────────

interface CostEstimateResultProps {
  estimate: CostEstimate
  feeStructures: FeeStructureDetail[]
  stateComparison: StateComparison[]
  onComplexityChange?: (complexity: Complexity) => void
}

// ── Formatting helpers ───────────────────────────────────────────────

function formatDollars(amount: number): string {
  if (amount === 0) return '$0'
  if (amount >= 1000) {
    return '$' + amount.toLocaleString('en-US')
  }
  return '$' + amount
}

function formatRange(low: number, high: number): string {
  if (low === 0 && high === 0) return 'No upfront cost'
  return `${formatDollars(low)} - ${formatDollars(high)}`
}

// ── Complexity slider ────────────────────────────────────────────────

function ComplexitySlider({
  value,
  onChange,
}: {
  value: Complexity
  onChange: (c: Complexity) => void
}) {
  const options: { value: Complexity; label: string; description: string }[] = [
    { value: 'simple', label: 'Simple', description: 'Straightforward matter, minimal disputes' },
    { value: 'moderate', label: 'Moderate', description: 'Some complexity, typical case' },
    { value: 'complex', label: 'Complex', description: 'High stakes, multiple parties, trial likely' },
  ]

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Case Complexity</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`relative p-3 rounded-lg border-2 text-left transition-all ${
              value === opt.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-pressed={value === opt.value}
          >
            <span
              className={`block text-sm font-semibold ${
                value === opt.value
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {opt.label}
            </span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Fee structure card ───────────────────────────────────────────────

function FeeStructureCard({ structure }: { structure: FeeStructureDetail }) {
  const icons: Record<string, typeof DollarSign> = {
    hourly: Clock,
    flat_fee: DollarSign,
    contingency: TrendingUp,
    retainer: Scale,
  }
  const Icon = icons[structure.type] || DollarSign

  return (
    <div
      className={`relative p-5 rounded-xl border transition-shadow hover:shadow-md ${
        structure.isPrimary
          ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {structure.isPrimary && (
        <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full">
          Most Common
        </span>
      )}
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            structure.isPrimary
              ? 'bg-blue-100 dark:bg-blue-800'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              structure.isPrimary
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white">{structure.label}</h4>
          {structure.adjustedRange && (
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {structure.adjustedRange}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
            {structure.description}
          </p>
          {structure.commonUses.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Common for
              </p>
              <div className="flex flex-wrap gap-1.5">
                {structure.commonUses.slice(0, 4).map((use) => (
                  <span
                    key={use}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── State comparison chart ───────────────────────────────────────────

function StateComparisonChart({
  data,
  currentState,
}: {
  data: StateComparison[]
  currentState: string
}) {
  const chartData = data
    .sort((a, b) => b.avgHourlyRate - a.avgHourlyRate)
    .map((item) => ({
      name: item.stateCode,
      rate: item.avgHourlyRate,
      fill: item.stateCode === currentState ? '#3B82F6' : '#94A3B8',
    }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748B' }}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value)}/hr`, 'Avg Rate']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Breakdown pie chart ──────────────────────────────────────────────

function BreakdownPieChart({
  data,
  isContingency,
}: {
  data: { name: string; value: number; color: string }[]
  isContingency: boolean
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${(name || '').length > 15 ? (name || '').slice(0, 15) + '...' : (name || '')} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              isContingency ? [`${Number(value)}%`, 'Share'] : [formatDollars(Number(value)), 'Cost']
            }
          />
          <Legend
            verticalAlign="bottom"
            height={36}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────

export default function CostEstimateResult({
  estimate,
  feeStructures,
  stateComparison,
  onComplexityChange,
}: CostEstimateResultProps) {
  const [activeComplexity, setActiveComplexity] = useState<Complexity>(estimate.complexity)
  const [activeTab, setActiveTab] = useState<'overview' | 'structures' | 'comparison' | 'factors'>('overview')

  const handleComplexityChange = (c: Complexity) => {
    setActiveComplexity(c)
    onComplexityChange?.(c)
  }

  const isContingency = estimate.primaryFeeType === 'contingency'

  const tabs = [
    { id: 'overview' as const, label: 'Cost Overview', icon: DollarSign },
    { id: 'structures' as const, label: 'Fee Types', icon: Scale },
    { id: 'comparison' as const, label: 'State Comparison', icon: BarChart3 },
    { id: 'factors' as const, label: 'Cost Factors', icon: Info },
  ]

  return (
    <div className="space-y-6">
      {/* Large cost range display */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-blue-200" />
            <span className="text-blue-200 text-sm">
              {estimate.practiceAreaLabel} in {estimate.stateName}
            </span>
          </div>

          {isContingency ? (
            <div>
              <h3 className="text-3xl sm:text-4xl font-extrabold font-heading mb-2">
                No Upfront Cost
              </h3>
              <p className="text-blue-100 text-lg">
                Contingency fee: {estimate.contingency?.low}%-{estimate.contingency?.high}% of your settlement
              </p>
              <p className="text-blue-200 text-sm mt-2">
                You only pay if you win. The attorney fee comes out of your settlement or verdict amount.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-3xl sm:text-4xl font-extrabold font-heading mb-2">
                {formatRange(estimate.totalLow, estimate.totalHigh)}
              </h3>
              <p className="text-blue-100 text-lg">
                Estimated total cost for a {activeComplexity} case
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-blue-200">
                <span>Hourly: {formatDollars(estimate.hourlyLow)}-{formatDollars(estimate.hourlyHigh)}/hr</span>
                <span>Est. {estimate.estimatedHoursLow}-{estimate.estimatedHoursHigh} hours</span>
              </div>
            </div>
          )}

          {/* Complexity slider inside hero */}
          <div className="mt-6 pt-5 border-t border-white/20">
            <ComplexitySlider value={activeComplexity} onChange={handleComplexityChange} />
          </div>
        </div>
      </div>

      {/* Free consultation highlight */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
          <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800 dark:text-green-200">
            Free Consultation Available
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Many {estimate.practiceAreaLabel.toLowerCase()} attorneys offer a free initial consultation. Get a personalized quote at no cost.
          </p>
        </div>
        <Link
          href={`/practice-areas/${estimate.practiceArea}`}
          className="flex-shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Get Free Quotes
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto -mb-px" aria-label="Result sections">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Hourly Rate
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {formatDollars(estimate.hourlyMid)}/hr
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">avg. for this area</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  State Average
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {formatDollars(estimate.stateAvgHourlyRate)}/hr
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">all practice areas</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Cost Market
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {estimate.costTierLabel.replace(' Cost Market', '')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{estimate.regionMultiplier}x multiplier</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Primary Fee
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {estimate.primaryFeeType === 'flat_fee'
                    ? 'Flat Fee'
                    : estimate.primaryFeeType.charAt(0).toUpperCase() + estimate.primaryFeeType.slice(1)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">most common</p>
              </div>
            </div>

            {/* Breakdown pie chart */}
            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {isContingency ? 'Settlement Distribution' : 'Typical Cost Breakdown'}
                </h4>
              </div>
              <BreakdownPieChart data={estimate.breakdown} isContingency={isContingency} />
            </div>
          </div>
        )}

        {/* Fee structures tab */}
        {activeTab === 'structures' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {estimate.practiceAreaLabel} attorneys in {estimate.stateName} typically use these fee arrangements:
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {feeStructures.map((structure) => (
                <FeeStructureCard key={structure.type} structure={structure} />
              ))}
            </div>
          </div>
        )}

        {/* State comparison tab */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Average Hourly Rate by State
                </h4>
              </div>
              <StateComparisonChart data={stateComparison} currentState={estimate.stateCode} />
            </div>

            {/* State comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">State</th>
                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Avg Rate</th>
                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Cost Tier</th>
                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">vs National</th>
                  </tr>
                </thead>
                <tbody>
                  {stateComparison
                    .sort((a, b) => b.avgHourlyRate - a.avgHourlyRate)
                    .map((item) => (
                      <tr
                        key={item.stateCode}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          item.stateCode === estimate.stateCode
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                          {item.stateCode === estimate.stateCode && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2" />
                          )}
                          {item.stateName}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                          {formatDollars(item.avgHourlyRate)}/hr
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.costTier === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : item.costTier === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                          >
                            {item.costTier}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span
                            className={`text-sm font-medium ${
                              item.relativeToNational > 0
                                ? 'text-red-600 dark:text-red-400'
                                : item.relativeToNational < 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-500'
                            }`}
                          >
                            {item.relativeToNational > 0 ? '+' : ''}{item.relativeToNational}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cost factors tab */}
        {activeTab === 'factors' && (
          <div className="space-y-6">
            {/* Practice area specific factors */}
            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Factors Affecting {estimate.practiceAreaLabel} Costs
              </h4>
              <ul className="space-y-3">
                {estimate.costFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* General cost factors */}
            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                General Factors That Affect Legal Costs
              </h4>
              <div className="space-y-4">
                {estimate.generalFactors.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        item.impact === 'high'
                          ? 'bg-red-500'
                          : item.impact === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    >
                      {item.impact === 'high' ? 'H' : item.impact === 'medium' ? 'M' : 'L'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.factor}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="text-center p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Get Free Quotes from {estimate.practiceAreaLabel} Attorneys
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-lg mx-auto">
          Compare rates from licensed {estimate.practiceAreaLabel.toLowerCase()} attorneys in {estimate.stateName}. Free, no obligation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/practice-areas/${estimate.practiceArea}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Browse Attorneys
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/quotes/${estimate.practiceArea}/${estimate.stateName.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-semibold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
          >
            Request Free Quotes
          </Link>
        </div>
      </div>
    </div>
  )
}
