'use client'

import { MapPin } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface LocalisationSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const FIELDS = ['address_street', 'address_city', 'address_postal_code', 'intervention_radius_km'] as const

export function LocalisationSection({ provider, onSaved }: LocalisationSectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  const radiusValue = typeof formData.intervention_radius_km === 'number' ? formData.intervention_radius_km : 30

  return (
    <SectionCard
      title="Localisation"
      icon={MapPin}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="localisation-street" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse
          </label>
          <input
            id="localisation-street"
            type="text"
            value={(formData.address_street as string) || ''}
            onChange={(e) => setField('address_street', e.target.value || null)}
            maxLength={200}
            placeholder="12 rue des Artisans"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="localisation-city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              id="localisation-city"
              type="text"
              value={(formData.address_city as string) || ''}
              onChange={(e) => setField('address_city', e.target.value || null)}
              maxLength={100}
              placeholder="Paris"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="localisation-postal-code" className="block text-sm font-medium text-gray-700 mb-2">
              Code postal
            </label>
            <input
              id="localisation-postal-code"
              type="text"
              value={(formData.address_postal_code as string) || ''}
              onChange={(e) => setField('address_postal_code', e.target.value.replace(/\D/g, '').slice(0, 5) || null)}
              maxLength={5}
              placeholder="75001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">5 chiffres</p>
          </div>
        </div>

        <div>
          <label htmlFor="localisation-radius" className="block text-sm font-medium text-gray-700 mb-2">
            Rayon d&apos;intervention : <span className="text-blue-600 font-semibold">{radiusValue} km</span>
          </label>
          <input
            id="localisation-radius"
            type="range"
            min={1}
            max={200}
            value={radiusValue}
            onChange={(e) => setField('intervention_radius_km', parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 km</span>
            <span>100 km</span>
            <span>200 km</span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
