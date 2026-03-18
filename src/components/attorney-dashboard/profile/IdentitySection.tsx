'use client'

import { Building2 } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface IdentitySectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const FIELDS = ['name', 'bar_number'] as const

export function IdentitySection({ provider, onSaved }: IdentitySectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const isVerified = Boolean(provider.is_verified)

  const barNumberValue = (formData.bar_number as string) || ''
  const barNumberInvalid = barNumberValue.length > 0 && barNumberValue.length !== 14

  const onSave = async () => {
    if (barNumberInvalid) return
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  return (
    <SectionCard
      title="Identity"
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
              Firm name *
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
            <label htmlFor="identite-bar-number" className="block text-sm font-medium text-gray-700 mb-2">
              Bar Number
              {isVerified && (
                <span className="ml-2 text-xs text-green-600 font-normal">(verified - not editable)</span>
              )}
            </label>
            <input
              id="identite-bar-number"
              type="text"
              value={(formData.bar_number as string) || ''}
              onChange={(e) => setField('bar_number', e.target.value.replace(/\D/g, '').slice(0, 14))}
              maxLength={14}
              readOnly={isVerified}
              aria-describedby="bar-number-help"
              aria-readonly={isVerified}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isVerified ? 'bg-gray-100 cursor-not-allowed border-gray-300' : barNumberInvalid ? 'border-amber-400' : 'border-gray-300'
              }`}
            />
            <p id="bar-number-help" className={`text-xs mt-1 ${barNumberInvalid ? 'text-amber-600' : 'text-gray-500'}`}>
              {isVerified ? 'Bar number verified, not editable' : barNumberInvalid ? `${barNumberValue.length}/14 digits — bar number must contain exactly 14 digits` : 'Bar number'}
            </p>
          </div>
        </div>

      </div>
    </SectionCard>
  )
}
