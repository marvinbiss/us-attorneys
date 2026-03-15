'use client'

import { Phone } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface ContactSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

const FIELDS = ['phone', 'phone_secondary', 'email', 'website'] as const

const PHONE_PATTERN = '^(?:\\+33|0)[1-9](?:[\\s.\\-]*\\d{2}){4}$'

export function ContactSection({ provider, onSaved }: ContactSectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  return (
    <SectionCard
      title="Contact"
      icon={Phone}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone principal
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={(formData.phone as string) || ''}
              onChange={(e) => setField('phone', e.target.value)}
              pattern={PHONE_PATTERN}
              maxLength={20}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Format : 06 12 34 56 78 ou +33 6 12 34 56 78</p>
          </div>
          <div>
            <label htmlFor="contact-phone-secondary" className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone secondaire
            </label>
            <input
              id="contact-phone-secondary"
              type="tel"
              value={(formData.phone_secondary as string) || ''}
              onChange={(e) => setField('phone_secondary', e.target.value || null)}
              pattern={PHONE_PATTERN}
              maxLength={20}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Format : 06 12 34 56 78 ou +33 6 12 34 56 78</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={(formData.email as string) || ''}
              onChange={(e) => setField('email', e.target.value || null)}
              maxLength={200}
              placeholder="contact@entreprise.fr"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="contact-website" className="block text-sm font-medium text-gray-700 mb-2">
              Site web
            </label>
            <input
              id="contact-website"
              type="url"
              value={(formData.website as string) || ''}
              onChange={(e) => setField('website', e.target.value || null)}
              maxLength={500}
              placeholder="https://www.entreprise.fr"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
