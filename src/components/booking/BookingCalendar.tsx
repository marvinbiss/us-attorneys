'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  Sun,
  Moon,
} from 'lucide-react'
import {
  format,
  addDays,
  startOfWeek,
  addWeeks,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface TimeSlot {
  time: string
  available: boolean
}

interface BookingCalendarProps {
  attorneyId: string
  attorneyName: string
  specialtyName?: string
  serviceDuration?: number // minutes
  servicePrice?: number
  onSlotSelect?: (date: Date, time: string) => void
  onConfirm?: (date: Date, time: string) => void
  className?: string
}

// Générer des créneaux exemple (en production, vient de l'API)
function generateMockSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = []
  const isWeekend = date.getDay() === 0 || date.getDay() === 6

  // Matinée
  for (let h = 8; h < 12; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push({
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        available: !isWeekend && Math.random() > 0.3,
      })
    }
  }

  // Après-midi
  for (let h = 14; h < 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push({
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        available: !isWeekend && Math.random() > 0.4,
      })
    }
  }

  return slots
}

export function BookingCalendar({
  attorneyId: _attorneyId,
  attorneyName,
  specialtyName = 'Intervention',
  serviceDuration = 60,
  servicePrice,
  onSlotSelect,
  onConfirm,
  className = '',
}: BookingCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date')

  // Générer les jours de la semaine
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i)
      return {
        date,
        slots: generateMockSlots(date),
        isPast: isBefore(date, startOfDay(new Date())),
      }
    })
  }, [currentWeekStart])

  // Slots du jour sélectionné
  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return null
    const day = weekDays.find((d) => isSameDay(d.date, selectedDate))
    return day?.slots || []
  }, [selectedDate, weekDays])

  // Navigation semaines
  const goToPreviousWeek = () => {
    const prevWeek = addWeeks(currentWeekStart, -1)
    if (!isBefore(prevWeek, startOfWeek(new Date(), { weekStartsOn: 1 }))) {
      setCurrentWeekStart(prevWeek)
    }
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  // Sélection date
  const handleDateSelect = (date: Date, isPast: boolean, hasSlots: boolean) => {
    if (isPast || !hasSlots) return
    setSelectedDate(date)
    setSelectedTime(null)
    setStep('time')
    onSlotSelect?.(date, '')
  }

  // Sélection heure
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    onSlotSelect?.(selectedDate!, time)
  }

  // Confirmation
  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return

    setIsLoading(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500))
    setIsLoading(false)
    setStep('confirm')
    onConfirm?.(selectedDate, selectedTime)
  }

  // Séparer créneaux matin/après-midi
  const morningSlots = selectedDaySlots?.filter(
    (s) => parseInt(s.time.split(':')[0]) < 12
  ) || []
  const afternoonSlots = selectedDaySlots?.filter(
    (s) => parseInt(s.time.split(':')[0]) >= 12
  ) || []

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
        <h3 className="text-lg font-bold mb-1">Réserver un créneau</h3>
        <p className="text-blue-100 text-sm">
          {specialtyName} • {serviceDuration} min
          {servicePrice && ` • ${servicePrice}€`}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex border-b border-slate-200">
        {['Date', 'Heure', 'Confirmation'].map((label, i) => {
          const stepNum = i + 1
          const isActive =
            (step === 'date' && i === 0) ||
            (step === 'time' && i <= 1) ||
            (step === 'confirm' && i <= 2)
          const isCurrent =
            (step === 'date' && i === 0) ||
            (step === 'time' && i === 1) ||
            (step === 'confirm' && i === 2)

          return (
            <div
              key={label}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                isCurrent
                  ? 'text-blue-600 bg-blue-50'
                  : isActive
                  ? 'text-green-600'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive && !isCurrent
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200'
                }`}
              >
                {isActive && !isCurrent ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Date Selection */}
        {step === 'date' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-5"
          >
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousWeek}
                disabled={isBefore(
                  addWeeks(currentWeekStart, -1),
                  startOfWeek(new Date(), { weekStartsOn: 1 })
                )}
                className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="font-semibold text-slate-900">
                  {format(currentWeekStart, 'MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-sm text-slate-500">
                  Semaine du {format(currentWeekStart, 'd', { locale: fr })} au{' '}
                  {format(addDays(currentWeekStart, 6), 'd MMMM', { locale: fr })}
                </div>
              </div>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(({ date, slots, isPast }) => {
                const availableSlots = slots.filter((s) => s.available).length
                const hasSlots = availableSlots > 0
                const isSelected = selectedDate && isSameDay(date, selectedDate)

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date, isPast, hasSlots)}
                    disabled={isPast || !hasSlots}
                    className={`
                      relative p-3 rounded-xl text-center transition-all
                      ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                      ${!hasSlots && !isPast ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-blue-600 text-white shadow-lg' : ''}
                      ${!isSelected && hasSlots && !isPast ? 'hover:bg-blue-50 cursor-pointer' : ''}
                      ${isToday(date) && !isSelected ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <div className="text-xs font-medium mb-1">
                      {format(date, 'EEE', { locale: fr })}
                    </div>
                    <div className="text-lg font-bold">{format(date, 'd')}</div>
                    {hasSlots && !isPast && (
                      <div
                        className={`text-xs mt-1 ${
                          isSelected ? 'text-blue-100' : 'text-green-600'
                        }`}
                      >
                        {availableSlots} dispo
                      </div>
                    )}
                    {!hasSlots && !isPast && (
                      <div className="text-xs mt-1 text-slate-400">Complet</div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected date action */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <button
                  onClick={() => setStep('time')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Choisir l'heure →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 2: Time Selection */}
        {step === 'time' && selectedDate && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-5"
          >
            {/* Back & Date */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setStep('date')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="font-semibold text-slate-900">
                  {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                </div>
                <div className="text-sm text-slate-500">
                  Choisissez votre créneau
                </div>
              </div>
            </div>

            {/* Morning Slots */}
            {morningSlots.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3">
                  <Sun className="w-4 h-4" />
                  Matin
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {morningSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`
                        py-2.5 px-3 rounded-lg text-sm font-medium transition-all
                        ${!slot.available ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                        ${slot.available && selectedTime !== slot.time ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
                        ${selectedTime === slot.time ? 'bg-blue-600 text-white shadow-lg' : ''}
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Slots */}
            {afternoonSlots.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3">
                  <Moon className="w-4 h-4" />
                  Après-midi
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {afternoonSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`
                        py-2.5 px-3 rounded-lg text-sm font-medium transition-all
                        ${!slot.available ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                        ${slot.available && selectedTime !== slot.time ? 'bg-green-50 text-green-700 hover:bg-green-100' : ''}
                        ${selectedTime === slot.time ? 'bg-blue-600 text-white shadow-lg' : ''}
                      `}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Button */}
            {selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Réservation en cours...
                    </>
                  ) : (
                    <>
                      Confirmer {selectedTime}
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirm' && selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Réservation confirmée !
            </h3>
            <p className="text-slate-600 mb-4">
              Votre rendez-vous avec {attorneyName}
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg mb-6">
              <CalendarIcon className="w-5 h-5 text-slate-500" />
              <span className="font-medium">
                {format(selectedDate, 'EEEE d MMMM', { locale: fr })} à {selectedTime}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Un email de confirmation vous a été envoyé.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
