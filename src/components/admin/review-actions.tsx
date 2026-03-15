'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'

interface AdminReviewActionsProps {
  reviewId: string
}

export function AdminReviewActions({ reviewId }: AdminReviewActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  const moderate = async (status: 'approved' | 'rejected') => {
    setIsLoading(true)
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderation_status: status,
          is_visible: status === 'approved',
        }),
      })
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => moderate('approved')} disabled={isLoading}>
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => setRejectModal(true)}
          disabled={isLoading}
          className="text-red-600"
        >
          Reject
        </Button>
      </div>

      <ConfirmationModal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        onConfirm={() => { setRejectModal(false); moderate('rejected') }}
        title="Reject review"
        message="Are you sure you want to reject this review? It will no longer be publicly visible."
        confirmText="Reject"
        variant="danger"
      />
    </>
  )
}
