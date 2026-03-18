'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui'

interface ReviewResponseFormProps {
  reviewId: string
}

export function ReviewResponseForm({ reviewId }: ReviewResponseFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!response.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/attorney/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })

      if (!res.ok) {
        throw new Error('Error publishing response')
      }

      router.refresh()
      setIsOpen(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Reply
      </Button>
    )
  }

  return (
    <div className="mt-4 space-y-3" aria-busy={isLoading}>
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Your response..."
        rows={3}
        disabled={isLoading}
      />

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !response.trim()}
        >
          {isLoading ? 'Publishing...' : 'Publish'}
        </Button>
        <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
