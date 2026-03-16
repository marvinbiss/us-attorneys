'use client'

import { Clock } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface AvailabilitySectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

// DB-bound: French keys from database (opening_hours JSONB column in Supabase)
interface DaySchedule {
  ouvert: boolean
  debut: string
  fin: string
}

// DB-bound: French keys from database (opening_hours JSONB column in Supabase)
interface OpeningHours {
  lundi: DaySchedule
  mardi: DaySchedule
  mercredi: DaySchedule
  jeudi: DaySchedule
  vendredi: DaySchedule
  samedi: DaySchedule
  dimanche: DaySchedule
}

const FIELDS = ['opening_hours', 'available_24h', 'accepts_new_clients'] as const

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'lundi', label: 'Monday' },
  { key: 'mardi', label: 'Tuesday' },
  { key: 'mercredi', label: 'Wednesday' },
  { key: 'jeudi', label: 'Thursday' },
  { key: 'vendredi', label: 'Friday' },
  { key: 'samedi', label: 'Saturday' },
  { key: 'dimanche', label: 'Sunday' },
]

const DEFAULT_HOURS: OpeningHours = {
  lundi: { ouvert: true, debut: '08:00', fin: '18:00' },
  mardi: { ouvert: true, debut: '08:00', fin: '18:00' },
  mercredi: { ouvert: true, debut: '08:00', fin: '18:00' },
  jeudi: { ouvert: true, debut: '08:00', fin: '18:00' },
  vendredi: { ouvert: true, debut: '08:00', fin: '18:00' },
  samedi: { ouvert: true, debut: '09:00', fin: '12:00' },
  dimanche: { ouvert: false, debut: '', fin: '' },
}

export function AvailabilitySection({ provider, onSaved }: AvailabilitySectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  const isUsingDefaults = !provider['opening_hours']
  const openingHours = (formData.opening_hours as OpeningHours) || DEFAULT_HOURS
  const available24h = Boolean(formData.available_24h)
  const acceptsNewClients = formData.accepts_new_clients !== false

  const updateDay = (day: keyof OpeningHours, field: keyof DaySchedule, value: boolean | string) => {
    const updated = {
      ...openingHours,
      [day]: { ...openingHours[day], [field]: value },
    }
    setField('opening_hours', updated)
  }

  /** Returns true if closing time is not after opening time for an open day */
  const hasTimeError = (day: DaySchedule): boolean => {
    return day.ouvert && day.debut !== '' && day.fin !== '' && day.fin <= day.debut
  }

  return (
    <SectionCard
      title="Availability"
      icon={Clock}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-8">
        {/* Opening hours grid */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-3">Office hours</span>
          {isUsingDefaults && !isDirty && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-3">
              Default hours. Edit and save to customize.
            </p>
          )}
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => {
              const day = openingHours[key] || { ouvert: false, debut: '', fin: '' }
              const timeError = hasTimeError(day)
              return (
                <div key={key}>
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-sm text-gray-700">{label}</span>
                    <label htmlFor={`dispo-${key}-ouvert`} className="flex items-center gap-2">
                      <input
                        id={`dispo-${key}-ouvert`}
                        type="checkbox"
                        checked={day.ouvert}
                        onChange={(e) => updateDay(key, 'ouvert', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Open</span>
                    </label>
                    {day.ouvert && (
                      <>
                        <label htmlFor={`dispo-${key}-debut`} className="sr-only">
                          Opening time {label}
                        </label>
                        <input
                          id={`dispo-${key}-debut`}
                          type="time"
                          value={day.debut}
                          onChange={(e) => updateDay(key, 'debut', e.target.value)}
                          aria-label={`Opening time ${label}`}
                          className={`px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            timeError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <span className="text-gray-500 text-sm" aria-hidden="true">to</span>
                        <label htmlFor={`dispo-${key}-fin`} className="sr-only">
                          Closing time {label}
                        </label>
                        <input
                          id={`dispo-${key}-fin`}
                          type="time"
                          value={day.fin}
                          onChange={(e) => updateDay(key, 'fin', e.target.value)}
                          aria-label={`Closing time ${label}`}
                          className={`px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                            timeError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </>
                    )}
                  </div>
                  {timeError && (
                    <p className="text-xs text-red-500 mt-1 ml-28">
                      Closing time must be after opening time
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Toggle switches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="dispo-24h" className="text-sm font-medium text-gray-700">
              Available 24/7
            </label>
            <button
              id="dispo-24h"
              type="button"
              role="switch"
              aria-checked={available24h}
              onClick={() => setField('available_24h', !available24h)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                available24h ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  available24h ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="dispo-new-clients" className="text-sm font-medium text-gray-700">
              Accepting new clients
            </label>
            <button
              id="dispo-new-clients"
              type="button"
              role="switch"
              aria-checked={acceptsNewClients}
              onClick={() => setField('accepts_new_clients', !acceptsNewClients)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                acceptsNewClients ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  acceptsNewClients ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
