'use client'

import { Building2 } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface IdentiteSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const FIELDS = ['name', 'siret'] as const

export function IdentiteSection({ provider, onSaved }: IdentiteSectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const isVerified = Boolean(provider.is_verified)

  const siretValue = (formData.siret as string) || ''
  const siretInvalid = siretValue.length > 0 && siretValue.length !== 14

  const onSave = async () => {
    if (siretInvalid) return
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  return (
    <SectionCard
      title="Identité"
      icon={Building2}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="identite-name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l&apos;entreprise *
            </label>
            <input
              id="identite-name"
              type="text"
              value={(formData.name as string) || ''}
              onChange={(e) => setField('name', e.target.value)}
              minLength={2}
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="identite-siret" className="block text-sm font-medium text-gray-700 mb-2">
              N&deg; SIRET
              {isVerified && (
                <span className="ml-2 text-xs text-green-600 font-normal">(vérifié - non modifiable)</span>
              )}
            </label>
            <input
              id="identite-siret"
              type="text"
              value={(formData.siret as string) || ''}
              onChange={(e) => setField('siret', e.target.value.replace(/\D/g, '').slice(0, 14))}
              maxLength={14}
              readOnly={isVerified}
              aria-describedby="siret-help"
              aria-readonly={isVerified}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isVerified ? 'bg-gray-100 cursor-not-allowed border-gray-300' : siretInvalid ? 'border-amber-400' : 'border-gray-300'
              }`}
            />
            <p id="siret-help" className={`text-xs mt-1 ${siretInvalid ? 'text-amber-600' : 'text-gray-500'}`}>
              {isVerified ? '14 chiffres — SIRET vérifié, non modifiable' : siretInvalid ? `${siretValue.length}/14 chiffres — le SIRET doit contenir exactement 14 chiffres` : '14 chiffres'}
            </p>
          </div>
        </div>

      </div>
    </SectionCard>
  )
}
