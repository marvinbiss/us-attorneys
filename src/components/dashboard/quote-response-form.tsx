'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

interface QuoteResponseFormProps {
  quoteId: string
  currentStatus: string
}

export function QuoteResponseForm({ quoteId, currentStatus }: QuoteResponseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/attorney/demandes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          estimated_amount: amount ? parseInt(amount) : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Montant estimé (€)
        </label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="350"
        />
      </div>

      <div className="flex gap-2">
        {currentStatus !== 'responded' && (
          <Button
            onClick={() => updateStatus('responded')}
            disabled={isLoading}
          >
            ✓ Marquer comme répondu
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => updateStatus('converted')}
          disabled={isLoading}
        >
          💰 Converti en client
        </Button>
        <Button
          variant="ghost"
          onClick={() => updateStatus('cancelled')}
          disabled={isLoading}
          className="text-red-600"
        >
          ✗ Annuler
        </Button>
      </div>
    </div>
  )
}
