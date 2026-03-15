'use client'

import { FileText } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface PresentationSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const FIELDS = ['description', 'bio', 'specialty'] as const

export function PresentationSection({ provider, onSaved }: PresentationSectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  const descriptionLength = ((formData.description as string) || '').length
  const bioLength = ((formData.bio as string) || '').length

  return (
    <SectionCard
      title="Présentation"
      icon={FileText}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="presentation-specialty" className="block text-sm font-medium text-gray-700 mb-2">
            Spécialité principale
          </label>
          <input
            id="presentation-specialty"
            type="text"
            value={(formData.specialty as string) || ''}
            onChange={(e) => setField('specialty', e.target.value || null)}
            maxLength={200}
            placeholder="Ex: Plombier, Électricien, Menuisier..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="presentation-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="presentation-description"
            value={(formData.description as string) || ''}
            onChange={(e) => setField('description', e.target.value || null)}
            rows={6}
            maxLength={5000}
            placeholder="Décrivez votre entreprise, vos services et ce qui vous distingue..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              Si vous ne renseignez pas de description, elle sera générée automatiquement à partir de vos informations.
            </p>
            <span className={`text-xs ${descriptionLength > 4500 ? 'text-amber-600' : 'text-gray-400'}`}>
              {descriptionLength} / 5 000
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="presentation-bio" className="block text-sm font-medium text-gray-700 mb-2">
            Biographie
          </label>
          <textarea
            id="presentation-bio"
            value={(formData.bio as string) || ''}
            onChange={(e) => setField('bio', e.target.value || null)}
            rows={4}
            maxLength={5000}
            placeholder="Parlez de votre parcours, vos valeurs, votre engagement..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${bioLength > 4500 ? 'text-amber-600' : 'text-gray-400'}`}>
              {bioLength} / 5 000
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
