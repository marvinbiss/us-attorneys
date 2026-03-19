'use client'

import { Clock } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface AvailabilitySectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

interface DaySchedule {
  open: boolean
  start: string
  end: string
}

interface OpeningHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

const FIELDS = ['opening_hours', 'available_24h', 'accepts_new_clients'] as const

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: true, start: '08:00', end: '18:00' },
  tuesday: { open: true, start: '08:00', end: '18:00' },
  wednesday: { open: true, start: '08:00', end: '18:00' },
  thursday: { open: true, start: '08:00', end: '18:00' },
  friday: { open: true, start: '08:00', end: '18:00' },
  saturday: { open: true, start: '09:00', end: '12:00' },
  sunday: { open: false, start: '', end: '' },
}

export function AvailabilitySection({ provider, onSaved }: AvailabilitySectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(
    provider,
    FIELDS
  )

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  const isUsingDefaults = !provider['opening_hours']
  const openingHours = (formData.opening_hours as OpeningHours) || DEFAULT_HOURS
  const available24h = Boolean(formData.available_24h)
  const acceptsNewClients = formData.accepts_new_clients !== false

  const updateDay = (
    day: keyof OpeningHours,
    field: keyof DaySchedule,
    value: boolean | string
  ) => {
    const updated = {
      ...openingHours,
      [day]: { ...openingHours[day], [field]: value },
    }
    setField('opening_hours', updated)
  }

  /** Returns true if closing time is not after opening time for an open day */
  const hasTimeError = (day: DaySchedule): boolean => {
    return day.open && day.start !== '' && day.end !== '' && day.end <= day.start
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
          <span className="mb-3 block text-sm font-medium text-gray-700">Office hours</span>
          {isUsingDefaults && !isDirty && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-600">
              Default hours. Edit and save to customize.
            </p>
          )}
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => {
              const day = openingHours[key] || { open: false, start: '', end: '' }
              const timeError = hasTimeError(day)
              return (
                <div key={key}>
                  <div className="flex items-center gap-4">
                    <span className="w-24 text-sm text-gray-700">{label}</span>
                    <label htmlFor={`dispo-${key}-open`} className="flex items-center gap-2">
                      <input
                        id={`dispo-${key}-open`}
                        type="checkbox"
                        checked={day.open}
                        onChange={(e) => updateDay(key, 'open', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Open</span>
                    </label>
                    {day.open && (
                      <>
                        <label htmlFor={`dispo-${key}-start`} className="sr-only">
                          Opening time {label}
                        </label>
                        <input
                          id={`dispo-${key}-start`}
                          type="time"
                          value={day.start}
                          onChange={(e) => updateDay(key, 'start', e.target.value)}
                          aria-label={`Opening time ${label}`}
                          className={`rounded-lg border px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            timeError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm text-gray-500" aria-hidden="true">
                          to
                        </span>
                        <label htmlFor={`dispo-${key}-end`} className="sr-only">
                          Closing time {label}
                        </label>
                        <input
                          id={`dispo-${key}-end`}
                          type="time"
                          value={day.end}
                          onChange={(e) => updateDay(key, 'end', e.target.value)}
                          aria-label={`Closing time ${label}`}
                          className={`rounded-lg border px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
                            timeError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                      </>
                    )}
                  </div>
                  {timeError && (
                    <p className="ml-28 mt-1 text-xs text-red-500">
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
