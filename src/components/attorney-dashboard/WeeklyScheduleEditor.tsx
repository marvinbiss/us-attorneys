'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimeSlot {
  id: string
  start_time: string // HH:MM
  end_time: string   // HH:MM
  is_active: boolean
}

export interface DaySchedule {
  day_of_week: number // 0=Sunday..6=Saturday
  enabled: boolean
  slots: TimeSlot[]
}

interface WeeklyScheduleEditorProps {
  schedule: DaySchedule[]
  onChange: (schedule: DaySchedule[]) => void
  slotDuration: 30 | 60
  onSlotDurationChange: (d: 30 | 60) => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRESET_SLOTS = {
  morning: { start_time: '09:00', end_time: '12:00', label: 'Morning', icon: Sun },
  afternoon: { start_time: '13:00', end_time: '17:00', label: 'Afternoon', icon: Sunset },
  evening: { start_time: '18:00', end_time: '21:00', label: 'Evening', icon: Moon },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToPercent(m: number): number {
  // Map 0:00-24:00 to 0-100
  return (m / 1440) * 100
}

function hasOverlap(slots: TimeSlot[]): boolean {
  const active = slots.filter(s => s.is_active)
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const aStart = timeToMinutes(active[i].start_time)
      const aEnd = timeToMinutes(active[i].end_time)
      const bStart = timeToMinutes(active[j].start_time)
      const bEnd = timeToMinutes(active[j].end_time)
      if (aStart < bEnd && aEnd > bStart) return true
    }
  }
  return false
}

function validateSlot(slot: TimeSlot): string | null {
  const start = timeToMinutes(slot.start_time)
  const end = timeToMinutes(slot.end_time)
  if (end <= start) return 'End time must be after start time'
  return null
}

// ─── Timeline Bar ────────────────────────────────────────────────────────────

function TimelineBar({ slots }: { slots: TimeSlot[] }) {
  const hours = Array.from({ length: 13 }, (_, i) => i * 2)

  return (
    <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mt-2">
      {/* Hour markers */}
      {hours.map(h => (
        <div
          key={h}
          className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-600"
          style={{ left: `${(h / 24) * 100}%` }}
        >
          {h % 6 === 0 && (
            <span className="absolute -top-0.5 left-0.5 text-[8px] text-gray-400 dark:text-gray-500 leading-none select-none">
              {h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`}
            </span>
          )}
        </div>
      ))}

      {/* Slot bars */}
      {slots.filter(s => s.is_active).map(slot => {
        const start = timeToMinutes(slot.start_time)
        const end = timeToMinutes(slot.end_time)
        const isValid = end > start

        return (
          <div
            key={slot.id}
            className={`absolute top-1 bottom-1 rounded-sm transition-all ${
              isValid
                ? 'bg-blue-500/80 dark:bg-blue-400/80'
                : 'bg-red-400/80 dark:bg-red-500/80'
            }`}
            style={{
              left: `${minutesToPercent(start)}%`,
              width: `${minutesToPercent(Math.max(0, end - start))}%`,
            }}
            title={`${slot.start_time} - ${slot.end_time}`}
          />
        )
      })}
    </div>
  )
}

// ─── Preset Buttons ─────────────────────────────────────────────────────────

function PresetToggle({
  presetKey,
  isActive,
  onToggle,
}: {
  presetKey: keyof typeof PRESET_SLOTS
  isActive: boolean
  onToggle: () => void
}) {
  const preset = PRESET_SLOTS[presetKey]
  const Icon = preset.icon

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700'
          : 'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
      }`}
      title={`${preset.start_time} - ${preset.end_time}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{preset.label}</span>
    </button>
  )
}

// ─── Day Row ────────────────────────────────────────────────────────────────

function DayRow({
  day,
  onChange,
}: {
  day: DaySchedule
  onChange: (d: DaySchedule) => void
}) {
  const overlap = useMemo(() => hasOverlap(day.slots), [day.slots])

  const toggleDay = () => {
    onChange({ ...day, enabled: !day.enabled })
  }

  const addSlot = () => {
    const newSlot: TimeSlot = {
      id: generateId(),
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
    }
    onChange({ ...day, slots: [...day.slots, newSlot], enabled: true })
  }

  const removeSlot = (slotId: string) => {
    onChange({ ...day, slots: day.slots.filter(s => s.id !== slotId) })
  }

  const updateSlot = (slotId: string, field: 'start_time' | 'end_time', value: string) => {
    onChange({
      ...day,
      slots: day.slots.map(s => s.id === slotId ? { ...s, [field]: value } : s),
    })
  }

  const togglePreset = (presetKey: keyof typeof PRESET_SLOTS) => {
    const preset = PRESET_SLOTS[presetKey]
    const existingIndex = day.slots.findIndex(
      s => s.start_time === preset.start_time && s.end_time === preset.end_time
    )

    if (existingIndex >= 0) {
      // Remove preset
      onChange({
        ...day,
        slots: day.slots.filter((_, i) => i !== existingIndex),
      })
    } else {
      // Add preset
      const newSlot: TimeSlot = {
        id: generateId(),
        start_time: preset.start_time,
        end_time: preset.end_time,
        is_active: true,
      }
      onChange({ ...day, slots: [...day.slots, newSlot], enabled: true })
    }
  }

  const isPresetActive = (presetKey: keyof typeof PRESET_SLOTS): boolean => {
    const preset = PRESET_SLOTS[presetKey]
    return day.slots.some(
      s => s.start_time === preset.start_time && s.end_time === preset.end_time && s.is_active
    )
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        day.enabled
          ? overlap
            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50'
      }`}
    >
      <div className="p-3 sm:p-4">
        {/* Day header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleDay}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label={`${day.enabled ? 'Disable' : 'Enable'} ${DAY_NAMES[day.day_of_week]}`}
            >
              {day.enabled ? (
                <ToggleRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <ToggleLeft className="w-6 h-6" />
              )}
            </button>
            <span className={`font-semibold text-sm ${
              day.enabled ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
            }`}>
              <span className="hidden sm:inline">{DAY_NAMES[day.day_of_week]}</span>
              <span className="sm:hidden">{DAY_ABBR[day.day_of_week]}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Preset toggles */}
            {(Object.keys(PRESET_SLOTS) as Array<keyof typeof PRESET_SLOTS>).map(key => (
              <PresetToggle
                key={key}
                presetKey={key}
                isActive={day.enabled && isPresetActive(key)}
                onToggle={() => togglePreset(key)}
              />
            ))}

            <button
              type="button"
              onClick={addSlot}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Add custom time slot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Custom</span>
            </button>
          </div>
        </div>

        {/* Overlap warning */}
        {overlap && day.enabled && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">
            Overlapping time slots detected. Please fix before saving.
          </p>
        )}

        {/* Time slots */}
        {day.enabled && day.slots.length > 0 && (
          <div className="space-y-2 mt-3">
            {day.slots.map(slot => {
              const slotError = validateSlot(slot)
              return (
                <div key={slot.id} className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(slot.id, 'start_time', e.target.value)}
                      className={`w-[120px] px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                        slotError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <span className="text-gray-400 dark:text-gray-500 text-xs">to</span>
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(slot.id, 'end_time', e.target.value)}
                      className={`w-[120px] px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                        slotError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {slotError && (
                    <span className="text-xs text-red-500 dark:text-red-400">{slotError}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    aria-label="Remove time slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {day.enabled && day.slots.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
            No time slots. Click a preset or &quot;Custom&quot; to add availability.
          </p>
        )}

        {/* Timeline visualization */}
        {day.enabled && day.slots.length > 0 && (
          <TimelineBar slots={day.slots} />
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function WeeklyScheduleEditor({
  schedule,
  onChange,
  slotDuration,
  onSlotDurationChange,
}: WeeklyScheduleEditorProps) {
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null)

  const updateDay = useCallback((dayOfWeek: number, updated: DaySchedule) => {
    onChange(schedule.map(d => d.day_of_week === dayOfWeek ? updated : d))
  }, [schedule, onChange])

  const handleCopySchedule = useCallback((sourceDayIndex: number, targetOption: 'weekdays' | 'all') => {
    const source = schedule.find(d => d.day_of_week === sourceDayIndex)
    if (!source) return

    const targetDays = targetOption === 'weekdays'
      ? [1, 2, 3, 4, 5] // Mon-Fri
      : [0, 1, 2, 3, 4, 5, 6] // All

    onChange(schedule.map(d => {
      if (d.day_of_week === sourceDayIndex) return d
      if (targetDays.includes(d.day_of_week)) {
        return {
          ...d,
          enabled: source.enabled,
          slots: source.slots.map(s => ({ ...s, id: generateId() })),
        }
      }
      return d
    }))
    setCopyFromDay(null)
  }, [schedule, onChange])

  // Validation summary
  const hasErrors = useMemo(() => {
    return schedule.some(d => {
      if (!d.enabled) return false
      if (hasOverlap(d.slots)) return true
      return d.slots.some(s => validateSlot(s) !== null)
    })
  }, [schedule])

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Slot duration */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Slot duration:
          </label>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => onSlotDurationChange(30)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                slotDuration === 30
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              30 min
            </button>
            <button
              type="button"
              onClick={() => onSlotDurationChange(60)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
                slotDuration === 60
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              60 min
            </button>
          </div>
        </div>

        {/* Copy schedule dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCopyFromDay(copyFromDay !== null ? null : 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy schedule
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {copyFromDay !== null && (
            <div className="absolute right-0 mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-64">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Copy from:
              </p>
              <select
                value={copyFromDay}
                onChange={(e) => setCopyFromDay(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                {schedule.map(d => (
                  <option key={d.day_of_week} value={d.day_of_week}>
                    {DAY_NAMES[d.day_of_week]} ({d.slots.length} slot{d.slots.length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopySchedule(copyFromDay, 'weekdays')}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  To weekdays
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySchedule(copyFromDay, 'all')}
                  className="flex-1 px-2 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  To all days
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCopyFromDay(null)}
                className="w-full mt-2 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Validation summary */}
      {hasErrors && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            Please fix the schedule errors (overlapping or invalid time slots) before saving.
          </p>
        </div>
      )}

      {/* Day rows */}
      <div className="space-y-2">
        {schedule.map(day => (
          <DayRow
            key={day.day_of_week}
            day={day}
            onChange={(updated) => updateDay(day.day_of_week, updated)}
          />
        ))}
      </div>
    </div>
  )
}
