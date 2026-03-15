'use client'

import { ReactNode } from 'react'
import { LucideIcon, Loader2 } from 'lucide-react'

interface SectionCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  onSave: () => void
  saving: boolean
  isDirty: boolean
  error: string | null
  success: string | null
}

export function SectionCard({ title, icon: Icon, children, onSave, saving, isDirty, error, success }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-600" />
        {title}
      </h2>

      {children}

      {/* Error/Success messages with accessibility */}
      {error && (
        <div role="alert" aria-live="assertive" className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div role="status" aria-live="polite" className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Save button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isDirty}
          aria-busy={saving}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {isDirty && !saving && (
          <span className="text-sm text-amber-600" role="status" aria-live="polite">
            Modifications non sauvegardées
          </span>
        )}
      </div>
    </div>
  )
}
