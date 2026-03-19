'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Star,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
// SiretAutocomplete removed (French SIRET validation) — using plain input for bar number
import { SpecialtyAutocomplete } from '@/components/ui/SpecialtyAutocomplete'
import { CityAutocomplete } from '@/components/ui/VilleAutocomplete'

const benefits = [
  { icon: Users, title: 'New Clients', description: 'Receive qualified consultation requests' },
  { icon: Star, title: 'Visibility', description: 'Appear in local search results' },
  { icon: TrendingUp, title: 'Growth', description: 'Grow your practice' },
]

export default function AttorneyRegistrationPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1 - Firm
    firmName: '',
    barNumber: '',
    practiceArea: '',
    otherPracticeArea: '',
    // Step 2 - Contact
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    // Step 3 - Location
    address: '',
    zipCode: '',
    city: '',
    serviceRadius: '30',
    // Step 4 - Description
    description: '',
    experience: '',
    certifications: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [stepError, setStepError] = useState('')

  const validateStep = (currentStep: number): boolean => {
    setStepError('')
    switch (currentStep) {
      case 1:
        if (
          !formData.firmName.trim() ||
          !formData.barNumber.trim() ||
          !formData.practiceArea.trim()
        ) {
          setStepError('Please fill in all required fields before continuing.')
          return false
        }
        return true
      case 2:
        if (
          !formData.firstName.trim() ||
          !formData.lastName.trim() ||
          !formData.email.trim() ||
          !formData.phone.trim()
        ) {
          setStepError('Please fill in all required fields before continuing.')
          return false
        }
        return true
      case 3:
        if (!formData.address.trim() || !formData.city.trim()) {
          setStepError('Please fill in all required fields before continuing.')
          return false
        }
        return true
      default:
        return true
    }
  }

  const breadcrumbItems = [{ label: 'Attorney Registration' }]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/register-attorney', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration error')
      }

      setIsSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Registration Received!</h1>
          <p className="mb-8 text-gray-600">
            Thank you for registering. Our team will review your information and you will receive a
            confirmation email within 24-48 hours.
          </p>
          <div className="space-y-4">
            <Link
              href="/"
              className="block w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Back to Home
            </Link>
            <Link
              href="/practice-areas"
              className="block w-full rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 md:pb-36 md:pt-14 lg:px-8">
          <Breadcrumb
            items={breadcrumbItems}
            className="mb-6 text-slate-400 [&>span]:text-white [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
          />
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="mb-6 text-4xl font-extrabold tracking-[-0.025em] md:text-5xl">
                Join the US Attorneys Network
              </h1>
              <p className="mb-8 text-xl text-slate-400">
                Free registration. Receive qualified consultation requests and grow your practice.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title} className="text-center">
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur">
                        <Icon className="h-6 w-6 text-amber-400" />
                      </div>
                      <div className="font-semibold">{benefit.title}</div>
                      <div className="text-sm text-slate-400">{benefit.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress Card */}
            <div className="rounded-2xl bg-white p-6 text-gray-900">
              <div className="mb-6 flex items-center justify-between">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                        step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step > s ? '✓' : s}
                    </div>
                    {s < 4 && (
                      <div className={`mx-1 h-1 w-8 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1 - Firm */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="mb-4 text-xl font-bold">Your Firm</h2>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Firm Name *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          autoComplete="organization"
                          value={formData.firmName}
                          onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          placeholder="My Law Firm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Bar Number / EIN *
                      </label>
                      <input
                        type="text"
                        value={formData.barNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, barNumber: e.target.value }))
                        }
                        placeholder="Enter your bar number..."
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Primary Practice Area *
                      </label>
                      <SpecialtyAutocomplete
                        value={formData.practiceArea}
                        onSelect={(service) =>
                          setFormData((prev) => ({ ...prev, practiceArea: service.name }))
                        }
                        onClear={() => setFormData((prev) => ({ ...prev, practiceArea: '' }))}
                        placeholder="Search your practice area..."
                        showAllOnFocus={true}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2 - Contact */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="mb-4 text-xl font-bold">Your Contact Info</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          First Name *
                        </label>
                        <input
                          type="text"
                          autoComplete="given-name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          autoComplete="family-name"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Phone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 - Location */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="mb-4 text-xl font-bold">Service Area</h2>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Address *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          autoComplete="street-address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                          disabled={isLoading}
                          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">City *</label>
                      <CityAutocomplete
                        value={formData.city}
                        onSelect={(city, zipCode, _coords) => {
                          setFormData((prev) => ({
                            ...prev,
                            city,
                            zipCode,
                          }))
                        }}
                        onClear={() => setFormData((prev) => ({ ...prev, city: '', zipCode: '' }))}
                        showGeolocation={true}
                        placeholder="Search your city..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Service Radius (km)
                      </label>
                      <select
                        value={formData.serviceRadius}
                        onChange={(e) =>
                          setFormData({ ...formData, serviceRadius: e.target.value })
                        }
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="10">10 km</option>
                        <option value="20">20 km</option>
                        <option value="30">30 km</option>
                        <option value="50">50 km</option>
                        <option value="100">100 km</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 4 - Description */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="mb-4 text-xl font-bold">About You</h2>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Description of your practice
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="Describe your services, specialties..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Years of Experience
                      </label>
                      <input
                        type="text"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="e.g., 15 years"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Certifications / Bar Admissions
                      </label>
                      <input
                        type="text"
                        value={formData.certifications}
                        onChange={(e) =>
                          setFormData({ ...formData, certifications: e.target.value })
                        }
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        placeholder="State Bar, ABA, etc."
                      />
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                      By registering, you agree to our{' '}
                      <Link href="/legal" className="underline hover:text-blue-600">
                        Terms of Service
                      </Link>{' '}
                      and our{' '}
                      <Link href="/privacy" className="underline hover:text-blue-600">
                        Privacy Policy
                      </Link>
                      .
                    </div>
                  </div>
                )}

                {/* Step Validation Error */}
                {stepError && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-amber-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{stepError}</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-6 flex justify-between border-t pt-6">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Back
                    </button>
                  ) : (
                    <div />
                  )}
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(step)) {
                          setStepError('')
                          setStep(step + 1)
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      Continue
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          Complete Registration
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-gray-900">They Trust Us</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: 'James M.',
                job: 'Personal Injury Attorney in New York',
                jobLink: '/practice-areas/personal-injury/new-york',
                text: 'Thanks to US Attorneys, I doubled my caseload in one year.',
              },
              {
                name: 'Sarah L.',
                job: 'Family Law Attorney in Los Angeles',
                jobLink: '/practice-areas/family-law/los-angeles',
                text: 'A true goldmine for finding qualified new clients.',
              },
              {
                name: 'David R.',
                job: 'Criminal Defense Attorney in Chicago',
                jobLink: '/practice-areas/criminal-defense/chicago',
                text: 'The best investment for my practice. Highly recommend!',
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-5 w-5 fill-current text-yellow-400" />
                  ))}
                </div>
                <p className="mb-4 text-gray-600">"{t.text}"</p>
                <div className="font-semibold text-gray-900">{t.name}</div>
                <Link href={t.jobLink} className="text-sm text-blue-600 hover:underline">
                  {t.job}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">Explore the Network</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <PopularServicesLinks />
            <PopularCitiesLinks />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Link
              href="/pricing"
              className="group rounded-xl bg-gray-50 p-6 transition-colors hover:bg-blue-50"
            >
              <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-blue-600">
                Our Pricing
              </h3>
              <p className="text-sm text-gray-600">Discover plans tailored to your practice</p>
            </Link>
            <Link
              href="/reviews"
              className="group rounded-xl bg-gray-50 p-6 transition-colors hover:bg-blue-50"
            >
              <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-blue-600">
                Client Reviews
              </h3>
              <p className="text-sm text-gray-600">What clients say about our attorneys</p>
            </Link>
            <Link
              href="/how-it-works"
              className="group rounded-xl bg-gray-50 p-6 transition-colors hover:bg-blue-50"
            >
              <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-blue-600">
                How It Works
              </h3>
              <p className="text-sm text-gray-600">Everything about our platform</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer links */}
    </div>
  )
}
