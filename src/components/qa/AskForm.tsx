'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
] as const

export default function AskForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [specialtyId, setSpecialtyId] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [city, setCity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          specialty_id: specialtyId || undefined,
          state_code: stateCode || undefined,
          city: city || undefined,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to submit question')
      }

      // Redirect to the new question page
      router.push(`/ask/${result.data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSubmitting}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-1">
          Question Title <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Be specific — a clear title helps attorneys understand your situation quickly.
        </p>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Can my landlord evict me without 30 days notice in Texas?"
          required
          minLength={10}
          maxLength={200}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-400">{title.length}/200</p>
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block text-sm font-semibold text-gray-900 mb-1">
          Details <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Include relevant facts, dates, and what you have already tried. Do not share personally identifiable information.
        </p>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your legal situation in detail..."
          required
          disabled={isSubmitting}
          minLength={30}
          maxLength={5000}
          rows={8}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 resize-y disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-400">{body.length}/5000</p>
      </div>

      {/* Filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Practice Area */}
        <div>
          <label htmlFor="specialty" className="block text-sm font-semibold text-gray-900 mb-1">
            Practice Area
          </label>
          <select
            id="specialty"
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white disabled:opacity-50"
          >
            <option value="">Select (optional)</option>
            {specialties.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-semibold text-gray-900 mb-1">
            State
          </label>
          <select
            id="state"
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 bg-white disabled:opacity-50"
          >
            <option value="">Select (optional)</option>
            {US_STATES.map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-semibold text-gray-900 mb-1">
            City
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Optional"
            disabled={isSubmitting}
            maxLength={100}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Important:</strong> Do not share sensitive personal information (SSN, bank details, etc.).
        Responses are for informational purposes only and do not create an attorney-client relationship.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || title.length < 10 || body.length < 30}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Question
          </>
        )}
      </button>
    </form>
  )
}
