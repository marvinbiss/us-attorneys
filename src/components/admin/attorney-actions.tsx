'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { ConfirmationModal } from '@/components/admin/ConfirmationModal'

interface AdminProviderActionsProps {
  attorneyId: string
  isActive: boolean
}

export function AdminProviderActions({ attorneyId, isActive }: AdminProviderActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [toggleModal, setToggleModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const toggleActive = async () => {
    setToggleModal(false)
    setIsLoading(true)
    try {
      await fetch(`/api/admin/providers/${attorneyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAttorney = async () => {
    setDeleteModal(false)
    setIsLoading(true)
    try {
      await fetch(`/api/admin/providers/${attorneyId}`, {
        method: 'DELETE',
      })
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setToggleModal(true)}
          disabled={isLoading}
        >
          {isActive ? 'Désactiver' : 'Activer'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteModal(true)}
          disabled={isLoading}
          className="text-red-600"
        >
          Supprimer
        </Button>
      </div>

      <ConfirmationModal
        isOpen={toggleModal}
        onClose={() => setToggleModal(false)}
        onConfirm={toggleActive}
        title={isActive ? 'Désactiver l\'artisan' : 'Activer l\'artisan'}
        message={`Êtes-vous sûr de vouloir ${isActive ? 'désactiver' : 'activer'} cet artisan ?`}
        confirmText={isActive ? 'Désactiver' : 'Activer'}
        variant={isActive ? 'warning' : 'success'}
      />

      <ConfirmationModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={deleteAttorney}
        title="Supprimer l'artisan"
        message="Êtes-vous sûr de vouloir supprimer cet artisan ? Cette action est irréversible."
        confirmText="Supprimer"
        variant="danger"
      />
    </>
  )
}
