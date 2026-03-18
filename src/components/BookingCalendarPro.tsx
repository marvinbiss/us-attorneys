'use client'

/**
 * BookingCalendarPro - US Attorneys
 * World-class booking calendar with all premium features
 * Based on best practices from Calendly, Clio, LawPay
 */

import { useState, useEffect } from 'react'
import { useRealTimeAvailability, type Slot } from '@/hooks/useRealTimeAvailability'
import { BookingFunnel } from '@/lib/analytics/tracking'
import {
  getRecommendedSlots,
  type SuggestedSlot,
} from '@/lib/booking/smart-suggestions'
import { CalendarGrid } from '@/components/booking/CalendarGrid'
import { BookingForm } from '@/components/booking/BookingForm'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'
import { BookingPayment } from '@/components/booking/BookingPayment'

interface BookingCalendarProProps {
  attorneyId: string
  attorneyName: string
  specialtyName: string
  servicePrice?: number
  requireDeposit?: boolean
  depositPercentage?: number
  onBookingComplete?: (booking: BookingData) => void
}

interface BookingData {
  bookingId?: string
  slotId: string
  date: string
  startTime: string
  endTime: string
  clientName: string
  clientPhone: string
  clientEmail: string
  message?: string
}

export default function BookingCalendarPro({
  attorneyId,
  attorneyName,
  specialtyName,
  servicePrice,
  requireDeposit = false,
  depositPercentage = 30,
  onBookingComplete: _onBookingComplete,
}: BookingCalendarProProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [step, setStep] = useState<'calendar' | 'form' | 'payment' | 'confirmation'>('calendar')
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendedSlots, setRecommendedSlots] = useState<SuggestedSlot[]>([])
  const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  // Real-time availability
  const {
    slots,
    isLoading,
    error: slotsError,
    refresh: _refresh,
    optimisticallyReserve,
    cancelOptimisticReservation,
  } = useRealTimeAvailability({
    attorneyId,
    month: monthStr,
    enabled: true,
  })

  // Calculate recommended slots
  useEffect(() => {
    const allSlots = Object.entries(slots).flatMap(([date, dateSlots]) =>
      dateSlots
        .filter((s) => s.isAvailable)
        .map((s) => ({
          id: s.id,
          date,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
    )

    if (allSlots.length > 0) {
      const recommendations = getRecommendedSlots(allSlots, undefined, {
        popularSlots: ['10:00', '14:00', '16:00'],
        highDemandDays: [2, 3, 4], // Tue, Wed, Thu
      })
      setRecommendedSlots(recommendations)
    }
  }, [slots])

  // Track calendar open
  useEffect(() => {
    BookingFunnel.openCalendar(attorneyId)
  }, [attorneyId])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    BookingFunnel.selectDate(attorneyId, date.toISOString().split('T')[0])
  }

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot)
    BookingFunnel.selectSlot(attorneyId, slot.date, slot.startTime, slot.id)
  }

  const handleFormChange = (field: string, value: string) => {
    if (Object.keys(formData).every((k) => !formData[k as keyof typeof formData])) {
      BookingFunnel.startForm(attorneyId)
    }
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return

    BookingFunnel.completeForm(attorneyId, !!formData.message)
    BookingFunnel.initiateBooking(attorneyId, specialtyName)

    setIsSubmitting(true)
    setError(null)

    // Optimistic update
    optimisticallyReserve(selectedSlot.id)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attorneyId,
          slotId: selectedSlot.id,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          clientEmail: formData.clientEmail,
          serviceDescription: formData.message || specialtyName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error during booking')
      }

      setBookingResult({ bookingId: data.booking.id })

      // Track successful booking
      BookingFunnel.completeBooking(
        data.booking.id,
        attorneyId,
        specialtyName,
        selectedSlot.date,
        selectedSlot.startTime,
        servicePrice ? servicePrice * (depositPercentage / 100) : undefined
      )

      if (requireDeposit && servicePrice) {
        setStep('payment')
      } else {
        setStep('confirmation')
      }
    } catch (err: unknown) {
      console.error('Booking error:', err)
      cancelOptimisticReservation(selectedSlot.id)
      setError(err instanceof Error ? err.message : 'Error during booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep('calendar')
    setSelectedDate(null)
    setSelectedSlot(null)
    setFormData({ clientName: '', clientPhone: '', clientEmail: '', message: '' })
    setBookingResult(null)
  }

  // Confirmation screen
  if (step === 'confirmation') {
    return (
      <BookingConfirmation
        attorneyName={attorneyName}
        specialtyName={specialtyName}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        clientEmail={formData.clientEmail}
        bookingId={bookingResult?.bookingId || null}
        onReset={handleReset}
      />
    )
  }

  // Payment screen
  if (step === 'payment' && bookingResult && servicePrice) {
    return (
      <BookingPayment
        specialtyName={specialtyName}
        servicePrice={servicePrice}
        depositPercentage={depositPercentage}
        bookingId={bookingResult.bookingId}
        onPayLater={() => setStep('confirmation')}
      />
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h3 className="text-lg font-semibold mb-1">Book an appointment</h3>
        <p className="text-blue-100 text-sm">{attorneyName} - {specialtyName}</p>
        {servicePrice && (
          <p className="text-blue-200 text-sm mt-1">Starting at ${servicePrice}</p>
        )}
      </div>

      {step === 'calendar' && (
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          slots={slots}
          isLoading={isLoading}
          error={error}
          slotsError={slotsError}
          recommendedSlots={recommendedSlots}
          onMonthChange={setCurrentDate}
          onDateSelect={handleDateSelect}
          onSlotSelect={handleSlotSelect}
          onContinue={() => setStep('form')}
        />
      )}

      {step === 'form' && (
        <BookingForm
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          formData={formData}
          isSubmitting={isSubmitting}
          error={error}
          attorneyName={attorneyName}
          requireDeposit={requireDeposit}
          servicePrice={servicePrice}
          depositPercentage={depositPercentage}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
          onBack={() => setStep('calendar')}
        />
      )}
    </div>
  )
}
