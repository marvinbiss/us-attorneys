'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Plus,
  Share2,
  Bell,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface BookingDetails {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceName: string
  artisanName: string
  artisanPhone?: string
  artisanAddress?: string
  date: string
  startTime: string
  endTime: string
  status: string
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedToCalendar, setAddedToCalendar] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let confettiTimer: NodeJS.Timeout | undefined

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (!response.ok) throw new Error('Réservation non trouvée')
        const data = await response.json()
        setBooking(data.booking)

        // Trigger confetti on successful load
        confettiTimer = setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
          })
        }, 500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }

    return () => clearTimeout(confettiTimer)
  }, [bookingId])

  const handleAddToCalendar = () => {
    if (!booking) return

    // Create ICS file content
    const startDate = new Date(`${booking.date}T${booking.startTime}`)
    const endDate = new Date(`${booking.date}T${booking.endTime}`)

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ServicesArtisans//FR
BEGIN:VEVENT
UID:${booking.id}@servicesartisans.fr
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:RDV ${booking.serviceName} - ${booking.artisanName}
DESCRIPTION:Rendez-vous avec ${booking.artisanName}
LOCATION:${booking.artisanAddress || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rdv-${booking.artisanName.toLowerCase().replace(/\s+/g, '-')}.ics`
    link.click()
    URL.revokeObjectURL(url)

    setAddedToCalendar(true)
  }

  const handleShare = async () => {
    if (!booking) return

    const shareData = {
      title: `RDV ${booking.serviceName}`,
      text: `J'ai pris RDV avec ${booking.artisanName} le ${booking.date} à ${booking.startTime}`,
      url: window.location.href,
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      )
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Réservation non trouvée
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rendez-vous confirmé !
          </h1>
          <p className="text-gray-600">
            Un email de confirmation a été envoyé à {booking.clientEmail}
          </p>
        </div>

        {/* Booking details card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{booking.artisanName}</h2>
                <p className="text-violet-200">{booking.serviceName}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-violet-50 rounded-xl">
              <Calendar className="w-6 h-6 text-violet-600" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Horaire</p>
                <p className="font-semibold text-gray-900">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>
            </div>

            {booking.artisanAddress && (
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                <MapPin className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-semibold text-gray-900">
                    {booking.artisanAddress}
                  </p>
                </div>
              </div>
            )}

            {booking.artisanPhone && (
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                <Phone className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <a
                    href={`tel:${booking.artisanPhone}`}
                    className="font-semibold text-gray-900 hover:text-violet-600"
                  >
                    {booking.artisanPhone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Reference number */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm text-gray-500">Numéro de réservation</p>
                <p className="font-mono font-bold text-gray-900">
                  {booking.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(booking.id.slice(0, 8).toUpperCase())
                }}
                className="text-violet-600 hover:text-violet-700 text-sm font-medium"
              >
                Copier
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleAddToCalendar}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition ${
              addedToCalendar
                ? 'bg-green-100 text-green-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {addedToCalendar ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Ajouté !
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Ajouter au calendrier
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition ${
              shared
                ? 'bg-green-100 text-green-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {shared ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Copié !
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Partager
              </>
            )}
          </button>
        </div>

        {/* Reminder note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Rappels automatiques</p>
              <p className="text-sm text-amber-700 mt-1">
                Vous recevrez un rappel par email et SMS 24h et 1h avant votre rendez-vous.
              </p>
            </div>
          </div>
        </div>

        {/* Manage booking link */}
        <Link
          href={`/booking/${booking.id}`}
          className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition group"
        >
          <div>
            <p className="font-medium text-gray-900">Gérer ma réservation</p>
            <p className="text-sm text-gray-500">
              Modifier, annuler ou reporter le rendez-vous
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 transition" />
        </Link>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  )
}
