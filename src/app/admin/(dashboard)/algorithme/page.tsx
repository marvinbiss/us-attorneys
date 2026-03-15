'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sliders,
  Target,
  Clock,
  Shield,
  Zap,
  MapPin,
} from 'lucide-react'
import type {
  AlgorithmConfig,
  MatchingStrategy,
  SpecialtyMatchMode,
} from '@/types/algorithm'
import {
  MATCHING_STRATEGY_META,
  SPECIALTY_MATCH_META,
} from '@/types/algorithm'

export default function AdminAlgorithmePage() {
  const [config, setConfig] = useState<AlgorithmConfig | null>(null)
  const [original, setOriginal] = useState<AlgorithmConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/algorithme')
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setOriginal(data.config)
      } else {
        setError('Failed to load configuration')
      }
    } catch {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/algorithme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setOriginal(data.config)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Error')
      }
    } catch {
      setError('Connection error')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (original) setConfig(original)
  }

  const hasChanges = config && original && JSON.stringify(config) !== JSON.stringify(original)

  const update = (key: string, value: unknown) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  const totalWeight = config
    ? config.weight_rating + config.weight_reviews + config.weight_verified + config.weight_proximity + config.weight_data_quality
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Algorithm Configuration</h1>
            <p className="text-gray-500 mt-1">
              Lead distribution and attorney scoring settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Saved
              </span>
            )}
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* === DISTRIBUTION STRATEGY === */}
          <Section icon={Target} title="Distribution Strategy">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matching Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(Object.keys(MATCHING_STRATEGY_META) as MatchingStrategy[]).map((key) => {
                    const meta = MATCHING_STRATEGY_META[key]
                    const selected = config.matching_strategy === key
                    return (
                      <button
                        key={key}
                        onClick={() => update('matching_strategy', key)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className={`font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>
                          {meta.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{meta.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <NumberField
                label="Max attorneys per lead"
                value={config.max_artisans_per_lead}
                onChange={(v) => update('max_artisans_per_lead', v)}
                min={1} max={20}
                description="Maximum number of attorneys who receive each lead"
              />

              <NumberField
                label="Geographic radius (km)"
                value={config.geo_radius_km}
                onChange={(v) => update('geo_radius_km', v)}
                min={1} max={500}
                description="Default radius if the attorney has no specific radius set"
              />

              <ToggleField
                label="Same state required"
                value={config.require_same_department}
                onChange={(v) => update('require_same_department', v)}
                description="The attorney must be in the same state as the case"
              />

              <ToggleField
                label="Specialty match required"
                value={config.require_specialty_match}
                onChange={(v) => update('require_specialty_match', v)}
                description="The attorney must offer the requested practice area"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty Matching Mode
                </label>
                <div className="flex gap-2">
                  {(Object.keys(SPECIALTY_MATCH_META) as SpecialtyMatchMode[]).map((key) => {
                    const meta = SPECIALTY_MATCH_META[key]
                    const selected = config.specialty_match_mode === key
                    return (
                      <button
                        key={key}
                        onClick={() => update('specialty_match_mode', key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={meta.description}
                      >
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <ToggleField
                label="Prefer claimed attorneys"
                value={config.prefer_claimed}
                onChange={(v) => update('prefer_claimed', v)}
                description="Prioritize attorneys who have claimed their profile"
              />
            </div>
          </Section>

          {/* === SCORING === */}
          <Section icon={Sliders} title="Scoring Weights">
            <p className="text-sm text-gray-500 mb-4">
              Adjust the relative weights of the composite score.
              Current total: <span className={`font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-amber-600'}`}>{totalWeight}</span>/100
            </p>
            <div className="space-y-4">
              <WeightSlider
                label="Google Rating"
                value={config.weight_rating}
                onChange={(v) => update('weight_rating', v)}
                color="yellow"
              />
              <WeightSlider
                label="Number of Reviews"
                value={config.weight_reviews}
                onChange={(v) => update('weight_reviews', v)}
                color="blue"
              />
              <WeightSlider
                label="Verified Attorney"
                value={config.weight_verified}
                onChange={(v) => update('weight_verified', v)}
                color="green"
              />
              <WeightSlider
                label="Geographic Proximity"
                value={config.weight_proximity}
                onChange={(v) => update('weight_proximity', v)}
                color="blue"
              />
              <WeightSlider
                label="Data Quality"
                value={config.weight_data_quality}
                onChange={(v) => update('weight_data_quality', v)}
                color="purple"
              />
            </div>
          </Section>

          {/* === QUOTAS === */}
          <Section icon={Shield} title="Quotas and Limits">
            <div className="space-y-4">
              <NumberField
                label="Daily quota"
                value={config.daily_lead_quota}
                onChange={(v) => update('daily_lead_quota', v)}
                min={0} max={1000}
                description="Max leads per attorney per day (0 = unlimited)"
              />
              <NumberField
                label="Monthly quota"
                value={config.monthly_lead_quota}
                onChange={(v) => update('monthly_lead_quota', v)}
                min={0} max={10000}
                description="Max leads per attorney per month (0 = unlimited)"
              />
              <NumberField
                label="Cooldown (minutes)"
                value={config.cooldown_minutes}
                onChange={(v) => update('cooldown_minutes', v)}
                min={0} max={1440}
                description="Minimum time between two leads for the same attorney"
              />
            </div>
          </Section>

          {/* === EXPIRATION === */}
          <Section icon={Clock} title="Expiration and Reassignment">
            <div className="space-y-4">
              <NumberField
                label="Lead expiration (hours)"
                value={config.lead_expiry_hours}
                onChange={(v) => update('lead_expiry_hours', v)}
                min={1} max={720}
                description="Time before an unseen lead expires"
              />
              <NumberField
                label="Quote expiration (hours)"
                value={config.quote_expiry_hours}
                onChange={(v) => update('quote_expiry_hours', v)}
                min={1} max={720}
                description="Time before a quote request expires"
              />
              <NumberField
                label="Auto-reassignment (hours)"
                value={config.auto_reassign_hours}
                onChange={(v) => update('auto_reassign_hours', v)}
                min={1} max={720}
                description="Delay before automatic reassignment to another attorney"
              />
            </div>
          </Section>

          {/* === ELIGIBILITY FILTERS === */}
          <Section icon={MapPin} title="Eligibility Filters">
            <div className="space-y-4">
              <NumberField
                label="Minimum rating"
                value={config.min_rating}
                onChange={(v) => update('min_rating', v)}
                min={0} max={5} step={0.5}
                description="Minimum Google rating to receive leads (0 = no filter)"
              />
              <ToggleField
                label="Verified required for urgent"
                value={config.require_verified_urgent}
                onChange={(v) => update('require_verified_urgent', v)}
                description="Only verified attorneys receive urgent leads"
              />
              <NumberField
                label="Exclude inactive (days)"
                value={config.exclude_inactive_days}
                onChange={(v) => update('exclude_inactive_days', v)}
                min={0} max={365}
                description="Exclude attorneys with no activity for N days (0 = disabled)"
              />
            </div>
          </Section>

          {/* === URGENCY MULTIPLIERS === */}
          <Section icon={Zap} title="Urgency Multipliers">
            <p className="text-sm text-gray-500 mb-4">
              Multiplies attorney scores for urgent leads
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MultiplierCard
                label="Low"
                value={config.urgency_low_multiplier}
                onChange={(v) => update('urgency_low_multiplier', v)}
                color="gray"
              />
              <MultiplierCard
                label="Medium"
                value={config.urgency_medium_multiplier}
                onChange={(v) => update('urgency_medium_multiplier', v)}
                color="blue"
              />
              <MultiplierCard
                label="High"
                value={config.urgency_high_multiplier}
                onChange={(v) => update('urgency_high_multiplier', v)}
                color="orange"
              />
              <MultiplierCard
                label="Emergency"
                value={config.urgency_emergency_multiplier}
                onChange={(v) => update('urgency_emergency_multiplier', v)}
                color="red"
              />
            </div>
          </Section>

          {/* Metadata */}
          {config.updated_at && (
            <div className="text-xs text-gray-400 text-center pt-4">
              Last modified: {new Date(config.updated_at).toLocaleString('en-US')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// === UTILITY COMPONENTS ===

function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function NumberField({ label, value, onChange, min, max, step, description }: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  description?: string
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <label className="block font-medium text-gray-900">{label}</label>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="ml-4">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step || 1}
          aria-label={label}
          className="w-full sm:w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-right"
        />
      </div>
    </div>
  )
}

function ToggleField({ label, value, onChange, description }: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <label className="block font-medium text-gray-900">{label}</label>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="ml-4">
        <button
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={value}
          aria-label={label}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            value ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>
    </div>
  )
}

const SLIDER_COLORS: Record<string, string> = {
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
}

function WeightSlider({ label, value, onChange, color }: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900">{value}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${SLIDER_COLORS[color] || 'bg-blue-500'}`}
              style={{ width: `${value}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            aria-label={`${label} (slider)`}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          aria-label={`${label} (value)`}
          className="w-full sm:w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg text-center"
        />
      </div>
    </div>
  )
}

const MULTIPLIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  orange: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

function MultiplierCard({ label, value, onChange, color }: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  const c = MULTIPLIER_COLORS[color] || MULTIPLIER_COLORS.gray
  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 text-center`}>
      <p className={`text-sm font-medium ${c.text} mb-2`}>{label}</p>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 1)}
        min={0.5}
        max={5}
        step={0.25}
        aria-label={`Multiplier ${label}`}
        className="w-full sm:w-20 mx-auto px-2 py-1 text-center text-lg font-bold border border-gray-300 rounded-lg"
      />
      <p className="text-xs text-gray-400 mt-1">x multiplier</p>
    </div>
  )
}
