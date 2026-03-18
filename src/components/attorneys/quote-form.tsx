'use client'

import { useState } from 'react'
import { Button, Input, Textarea } from '@/components/ui'

interface QuoteFormProps {
  attorneyId: string
  specialtySlug: string
  onSuccess?: () => void
}

export function QuoteForm({ attorneyId, specialtySlug, onSuccess }: QuoteFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    description: '',
    urgency: 'normal',
    city: '',
    postal_code: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attorney_id: attorneyId,
          service_slug: specialtySlug,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Error sending request')
      }

      setIsSuccess(true)
      onSuccess?.()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-green-600 font-medium">Request sent!</p>
        <p className="text-sm text-gray-500 mt-1">
          The attorney will contact you as soon as possible.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSuccess(false)}
          className="mt-3"
        >
          New request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <Input
        placeholder="Your name *"
        value={formData.client_name}
        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
        required
      />

      <Input
        type="tel"
        placeholder="Phone *"
        value={formData.client_phone}
        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
        required
      />

      <Input
        type="email"
        placeholder="Email *"
        value={formData.client_email}
        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
        required
      />

      <Textarea
        placeholder="Describe your needs *"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
        required
      />

      <select
        value={formData.urgency}
        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      >
        <option value="normal">Normal</option>
        <option value="urgent">Urgent (within 48h)</option>
        <option value="very_urgent">Very urgent (within 24h)</option>
      </select>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="City"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
        <Input
          placeholder="ZIP code"
          value={formData.postal_code}
          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
          maxLength={5}
        />
      </div>

      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? 'Sending...' : 'Submit my request'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By submitting, you agree to be contacted by the attorney.
      </p>
    </form>
  )
}
