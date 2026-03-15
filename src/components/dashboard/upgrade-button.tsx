'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface UpgradeButtonProps {
  planId: string
  className?: string
}

export function UpgradeButton({ planId, className }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (planId === 'free') return

    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading || planId === 'free'}
      className={className}
    >
      {planId === 'free'
        ? 'Free plan'
        : isLoading
        ? 'Loading...'
        : 'Choose this plan'}
    </Button>
  )
}
