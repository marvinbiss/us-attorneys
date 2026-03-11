'use client'

import React, { memo } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import type { EstimationContext } from './utils'
import type { UseLeadSubmitReturn } from './hooks/useLeadSubmit'

interface LeadFormProps {
  context: EstimationContext
  lead: UseLeadSubmitReturn
}

export const LeadForm = memo(function LeadForm({ context, lead }: LeadFormProps) {
  return (
    <form
      onSubmit={lead.handleLeadSubmit}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
    >
      <p className="text-sm font-semibold text-gray-900">
        {context.artisan
          ? `Envoyer ma demande à ${context.artisan.name}`
          : 'Recevoir mon estimation personnalisée'}
      </p>
      <input
        type="text"
        placeholder="Votre nom (optionnel)"
        value={lead.leadName}
        onChange={(e) => lead.setLeadName(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
      />
      <div>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="Votre téléphone *"
          value={lead.leadPhone}
          onChange={(e) => {
            lead.setLeadPhone(e.target.value)
            // Clear error on type (handled internally but we re-set here for UX)
          }}
          className={
            'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ' +
            (lead.leadPhoneError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-[#E07040] focus:ring-[#E07040]')
          }
          style={{ fontSize: '16px' }}
        />
        {lead.leadPhoneError && (
          <p className="text-xs text-red-600 mt-1">{lead.leadPhoneError}</p>
        )}
      </div>
      <input
        type="email"
        placeholder="Votre email (optionnel)"
        value={lead.leadEmail}
        onChange={(e) => lead.setLeadEmail(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
      />
      {/* RGPD consent */}
      <label className="flex items-start gap-2 text-xs text-gray-500">
        <input
          type="checkbox"
          checked={lead.rgpdConsent}
          onChange={(e) => lead.setRgpdConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          J&apos;accepte que mes données soient traitées pour recevoir une estimation.{' '}
          <a
            href="/confidentialite"
            target="_blank"
            className="underline"
          >
            Politique de confidentialité
          </a>
        </span>
      </label>
      {lead.leadError && (
        <p className="text-xs text-red-600 text-center">
          Une erreur est survenue. Veuillez réessayer.
        </p>
      )}
      <button
        type="submit"
        disabled={lead.leadLoading || !lead.leadPhone.trim() || !lead.rgpdConsent}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E07040] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c9603a] transition-colors disabled:opacity-50"
      >
        {lead.leadLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ArrowRight className="h-4 w-4" />
            {context.artisan
              ? `Envoyer à ${context.artisan.name}`
              : 'Être mis en relation'}
          </>
        )}
      </button>
    </form>
  )
})
