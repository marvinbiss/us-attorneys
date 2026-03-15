'use client'

import { useState } from 'react'
import { Award, Plus, X } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface QualificationsSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const MAX_CERTIFICATIONS = 20

const FIELDS = ['certifications'] as const

export function QualificationsSection({ provider, onSaved }: QualificationsSectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)
  const [newCertification, setNewCertification] = useState('')

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  const certifications = (formData.certifications as string[]) || []

  const addCertification = () => {
    const trimmed = newCertification.trim()
    if (!trimmed || certifications.length >= MAX_CERTIFICATIONS) return
    // Case-insensitive duplicate check
    if (certifications.some(c => c.toLowerCase() === trimmed.toLowerCase())) return
    setField('certifications', [...certifications, trimmed])
    setNewCertification('')
  }

  const removeCertification = (index: number) => {
    setField('certifications', certifications.filter((_, i) => i !== index))
  }

  const atMax = certifications.length >= MAX_CERTIFICATIONS

  return (
    <SectionCard
      title="Qualifications"
      icon={Award}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="certifications-new" className="block text-sm font-medium text-gray-700">
              Certifications &amp; qualifications
            </label>
            <span className="text-xs text-gray-400">{certifications.length}/{MAX_CERTIFICATIONS}</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Ajoutez vos certifications, labels et qualifications professionnelles (ex: RGE, Qualibat, QualiPAC, Artisan d&apos;Art...).
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {certifications.map((cert, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {cert}
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="hover:text-green-900"
                  aria-label={`Supprimer ${cert}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="certifications-new"
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification() } }}
              placeholder={atMax ? 'Limite atteinte' : 'Ajouter une certification'}
              maxLength={200}
              disabled={atMax}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              type="button"
              onClick={addCertification}
              disabled={atMax}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              aria-label="Ajouter une certification"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {atMax && (
            <p className="text-xs text-amber-600 mt-1">Limite de {MAX_CERTIFICATIONS} certifications atteinte.</p>
          )}
        </div>

        {certifications.length === 0 && (
          <p className="text-sm text-gray-500 italic bg-gray-50 px-4 py-3 rounded-lg">
            Aucune certification ajout&eacute;e. Les certifications renforcent la confiance de vos clients.
          </p>
        )}
      </div>
    </SectionCard>
  )
}
