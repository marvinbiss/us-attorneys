'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  MessageSquare,
} from 'lucide-react'
import { QuoteForm } from './quote-form'
import { ReviewsList } from './reviews-list'

interface Review {
  id: string
  author_name: string
  rating: number
  text?: string
  review_date: string
  response?: string
  response_at?: string
}

interface Provider {
  id: string
  slug: string
  name: string
  description?: string
  full_description?: string
  city: string
  region: string
  address?: string
  postal_code?: string
  phone?: string
  email?: string
  website?: string
  rating_average: number
  review_count: number
  is_verified: boolean
  is_available_24h?: boolean
  response_time?: string
  years_experience?: number
  services?: string[]
  service_areas?: string[]
  image_url?: string
  gallery?: string[]
  opening_hours?: Record<string, string>
  created_at: string
  reviews?: Review[]
}

interface ProviderDetailProps {
  provider: Provider
  showQuoteForm?: boolean
}

export function ProviderDetail({ provider, showQuoteForm = true }: ProviderDetailProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews'>('about')

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const dayNames: Record<string, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {provider.image_url ? (
                <Image
                  src={provider.image_url}
                  alt={provider.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                  {provider.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {provider.name}
                </h1>
                {provider.is_verified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Vérifié
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                {renderStars(provider.rating_average)}
                <span className="font-semibold text-gray-900">
                  {provider.rating_average.toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({provider.review_count} avis)
                </span>
              </div>

              <div className="flex items-center gap-1 text-gray-600 mt-2">
                <MapPin className="w-5 h-5" />
                <span>
                  {provider.address ? `${provider.address}, ` : ''}
                  {provider.postal_code} {provider.city}, {provider.region}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {provider.is_available_24h && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Disponible 24h/24
                  </span>
                )}
                {provider.years_experience && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    <Award className="w-4 h-4" />
                    {provider.years_experience} ans d'expérience
                  </span>
                )}
                {provider.response_time && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <MessageSquare className="w-4 h-4" />
                    Répond en {provider.response_time}
                  </span>
                )}
              </div>
            </div>

            {/* Contact buttons */}
            <div className="flex flex-col gap-3 md:min-w-[200px]">
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Phone className="w-5 h-5" />
                  {provider.phone}
                </a>
              )}
              {provider.email && (
                <a
                  href={`mailto:${provider.email}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <Mail className="w-5 h-5" />
                  Envoyer un email
                </a>
              )}
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                >
                  <Globe className="w-5 h-5" />
                  Site web
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'about', label: 'À propos' },
              { id: 'services', label: 'Services' },
              { id: 'reviews', label: `Avis (${provider.review_count})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'about' && (
              <>
                {/* Description */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    À propos
                  </h2>
                  <p className="text-gray-600 whitespace-pre-line">
                    {provider.full_description || provider.description || 'Pas de description disponible.'}
                  </p>
                </div>

                {/* Opening hours */}
                {provider.opening_hours && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Horaires d'ouverture
                    </h2>
                    <div className="space-y-2">
                      {Object.entries(provider.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="text-gray-600">{dayNames[day] || day}</span>
                          <span className="font-medium text-gray-900">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'services' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Services proposés
                </h2>
                {provider.services && provider.services.length > 0 ? (
                  <ul className="space-y-2">
                    {provider.services.map((service, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        {service}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">Aucun service spécifié.</p>
                )}

                {provider.service_areas && provider.service_areas.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Zones d'intervention
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.service_areas.map((area, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Avis clients ({provider.review_count})
                </h2>
                <ReviewsList reviews={provider.reviews || []} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {showQuoteForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Demander un devis
                </h2>
                <QuoteForm providerId={provider.id} serviceSlug={provider.slug} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderDetail
