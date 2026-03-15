'use client'

import { Shield, Award, CheckCircle, AlertTriangle, Building2, Calendar, TrendingUp, Users } from 'lucide-react'
import type { EntrepriseComplete } from '@/lib/api/pappers'

interface TrustBadgeProps {
  niveau: 'gold' | 'silver' | 'bronze' | 'none'
  label: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function TrustBadge({
  niveau,
  label,
  description,
  size = 'md',
  showTooltip = true
}: TrustBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const styles = {
    gold: {
      bg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
      border: 'border-amber-300',
      text: 'text-amber-800',
      icon: 'text-amber-600'
    },
    silver: {
      bg: 'bg-gradient-to-r from-slate-100 to-gray-100',
      border: 'border-slate-300',
      text: 'text-slate-700',
      icon: 'text-slate-500'
    },
    bronze: {
      bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'text-orange-500'
    },
    none: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-500',
      icon: 'text-gray-400'
    }
  }

  const style = styles[niveau]
  const Icon = niveau === 'gold' ? Award : niveau === 'silver' ? Shield : niveau === 'bronze' ? CheckCircle : AlertTriangle

  return (
    <div className="relative group">
      <div
        className={`
          inline-flex items-center rounded-full border font-medium
          ${sizeClasses[size]}
          ${style.bg}
          ${style.border}
          ${style.text}
        `}
      >
        <Icon className={`${iconSizes[size]} ${style.icon}`} />
        <span>{label}</span>
      </div>

      {showTooltip && description && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-3 py-2 bg-gray-900 text-white text-xs rounded-lg
          opacity-0 group-hover:opacity-100 pointer-events-none
          transition-opacity whitespace-nowrap z-50
        ">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  )
}

interface EntrepriseInfoCardProps {
  entreprise: EntrepriseComplete
  compact?: boolean
}

export function EntrepriseInfoCard({ entreprise, compact = false }: EntrepriseInfoCardProps) {
  const anciennete = entreprise.dateCreation
    ? Math.floor((Date.now() - new Date(entreprise.dateCreation).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null

  const formatMontant = (montant: number | null) => {
    if (montant === null) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(montant)
  }

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {entreprise.badges.entrepriseSaine && (
          <span className="inline-flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Verified business
          </span>
        )}
        {anciennete !== null && anciennete > 0 && (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <Calendar className="w-4 h-4" />
            {anciennete} year{anciennete > 1 ? 's' : ''}
          </span>
        )}
        {entreprise.effectif && (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <Users className="w-4 h-4" />
            {entreprise.effectif}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{entreprise.nom}</h3>
          <p className="text-sm text-gray-500">
            Bar #: {entreprise.siret} • {entreprise.formeJuridique}
          </p>
        </div>

        {entreprise.badges.entrepriseSaine ? (
          <TrustBadge
            niveau={
              entreprise.badges.plusDe5Ans && entreprise.badges.caSuperieur100k
                ? 'gold'
                : entreprise.badges.plusDe5Ans
                ? 'silver'
                : 'bronze'
            }
            label={
              entreprise.badges.plusDe5Ans && entreprise.badges.caSuperieur100k
                ? 'Established'
                : entreprise.badges.plusDe5Ans
                ? 'Confirmed'
                : 'Verified'
            }
          />
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Warning
          </span>
        )}
      </div>

      {/* Infos principales */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{entreprise.libelleNAF}</span>
        </div>

        {anciennete !== null && (
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Established {entreprise.dateCreationFormate} ({anciennete} year{anciennete > 1 ? 's' : ''})</span>
          </div>
        )}

        {entreprise.dernierCA !== null && (
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span>CA: {formatMontant(entreprise.dernierCA)}</span>
          </div>
        )}

        {entreprise.effectif && (
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span>Team: {entreprise.effectif}</span>
          </div>
        )}
      </div>

      {/* Dirigeants */}
      {entreprise.dirigeants.length > 0 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Director{entreprise.dirigeants.length > 1 ? 's' : ''}</p>
          <div className="flex flex-wrap gap-2">
            {entreprise.dirigeants.slice(0, 2).map((d, i) => (
              <span key={i} className="text-sm text-gray-700">
                {d.prenom} {d.nom}
                <span className="text-gray-400 ml-1">({d.fonction})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alertes */}
      {entreprise.procedureCollective && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Active legal proceeding: {entreprise.procedureEnCours}</span>
        </div>
      )}
    </div>
  )
}

interface SiretVerificationStatusProps {
  verified: boolean
  verifiedAt?: string
  badgeNiveau?: 'gold' | 'silver' | 'bronze' | 'none'
}

export function SiretVerificationStatus({
  verified,
  verifiedAt,
  badgeNiveau = 'none'
}: SiretVerificationStatusProps) {
  if (!verified) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
        <AlertTriangle className="w-4 h-4" />
        Bar number not verified
      </span>
    )
  }

  const dateVerif = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString('en-US')
    : null

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        Bar number verified
      </span>
      {dateVerif && (
        <span className="text-xs text-gray-400">on {dateVerif}</span>
      )}
      {badgeNiveau !== 'none' && (
        <TrustBadge
          niveau={badgeNiveau}
          label={
            badgeNiveau === 'gold'
              ? 'Established'
              : badgeNiveau === 'silver'
              ? 'Confirmed'
              : 'Verified'
          }
          size="sm"
        />
      )}
    </div>
  )
}
