'use client'

import { CheckCircle, Shield, Award, Star, Building2, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

type VerificationType = 'identity' | 'insurance' | 'certification' | 'premium' | 'enterprise' | 'review'
type VerificationLevel = 'none' | 'basic' | 'standard' | 'premium' | 'enterprise'

interface VerifiedBadgeProps {
  type: VerificationType
  label?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const badgeConfig = {
  identity: {
    icon: Shield,
    label: 'Identité contrôlée',
    className: 'verified-badge-identity',
    color: 'text-blue-600',
  },
  insurance: {
    icon: FileCheck,
    label: 'Assurance contrôlée',
    className: 'verified-badge-insurance',
    color: 'text-green-600',
  },
  certification: {
    icon: Award,
    label: 'Qualifié',
    className: 'verified-badge-certification',
    color: 'text-purple-600',
  },
  premium: {
    icon: Star,
    label: 'Premium',
    className: 'verified-badge-premium',
    color: 'text-amber-600',
  },
  enterprise: {
    icon: Building2,
    label: 'Entreprise référencée',
    className: 'verified-badge-enterprise',
    color: 'text-slate-600',
  },
  review: {
    icon: CheckCircle,
    label: 'Avis authentique',
    className: 'verified-badge-identity',
    color: 'text-blue-600',
  },
}

const sizeConfig = {
  sm: { icon: 12, text: 'text-xs' },
  md: { icon: 14, text: 'text-xs' },
  lg: { icon: 16, text: 'text-sm' },
}

export function VerifiedBadge({
  type,
  label,
  showLabel = true,
  size = 'md',
  className,
}: VerifiedBadgeProps) {
  const config = badgeConfig[type]
  const sizeConf = sizeConfig[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'verified-badge',
        config.className,
        sizeConf.text,
        className
      )}
      title={config.label}
    >
      <Icon size={sizeConf.icon} className={config.color} />
      {showLabel && <span>{label || config.label}</span>}
    </span>
  )
}

interface TrustScoreProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TrustScore({
  score,
  showLabel = true,
  size = 'md',
  className,
}: TrustScoreProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 80) return { label: 'Excellent', className: 'trust-score-excellent', color: 'bg-green-500' }
    if (score >= 60) return { label: 'Bon', className: 'trust-score-good', color: 'bg-blue-500' }
    if (score >= 40) return { label: 'Moyen', className: 'trust-score-fair', color: 'bg-amber-500' }
    return { label: 'Faible', className: 'trust-score-poor', color: 'bg-red-500' }
  }

  const config = getScoreConfig(score)
  const sizeConf = sizeConfig[size]

  return (
    <div className={cn('trust-score', config.className, className)}>
      <div className="flex items-center gap-1">
        <div className={cn('h-2 w-8 rounded-full bg-gray-200 overflow-hidden')}>
          <div
            className={cn('h-full rounded-full transition-all', config.color)}
            style={{ width: `${score}%` }}
          />
        </div>
        {showLabel && (
          <span className={cn(sizeConf.text, 'font-medium')}>
            {score}% - {config.label}
          </span>
        )}
      </div>
    </div>
  )
}

interface VerificationLevelBadgeProps {
  level: VerificationLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const levelConfig = {
  none: { label: 'Non référencé', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null },
  basic: { label: 'Vérifié', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  standard: { label: 'Référencé+', className: 'bg-green-100 text-green-700 border-green-200', icon: Shield },
  premium: { label: 'Premium', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: Star },
  enterprise: { label: 'Entreprise', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: Building2 },
}

export function VerificationLevelBadge({
  level,
  size = 'md',
  className,
}: VerificationLevelBadgeProps) {
  const config = levelConfig[level]
  const sizeConf = sizeConfig[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
        config.className,
        sizeConf.text,
        className
      )}
    >
      {Icon && <Icon size={sizeConf.icon} />}
      <span>{config.label}</span>
    </span>
  )
}

interface VerifiedReviewBadgeProps {
  isVerified: boolean
  bookingId?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function VerifiedReviewBadge({
  isVerified,
  size = 'sm',
  className,
}: VerifiedReviewBadgeProps) {
  if (!isVerified) return null

  const sizeConf = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium',
        sizeConf.text,
        className
      )}
      title="Cet avis provient d'un client ayant utilisé la plateforme"
    >
      <CheckCircle size={sizeConf.icon} />
      <span>Avis vérifié</span>
    </span>
  )
}

interface KYCStatusBadgeProps {
  status: 'verified' | 'pending' | 'rejected' | 'not_started'
  type?: 'identity' | 'insurance' | 'certification'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const kycStatusConfig = {
  verified: { label: 'Vérifié', className: 'kyc-status-verified', icon: CheckCircle },
  pending: { label: 'En cours', className: 'kyc-status-pending', icon: null },
  rejected: { label: 'Rejeté', className: 'kyc-status-rejected', icon: null },
  not_started: { label: 'Non soumis', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null },
}

export function KYCStatusBadge({
  status,
  size = 'md',
  className,
}: KYCStatusBadgeProps) {
  const config = kycStatusConfig[status]
  const sizeConf = sizeConfig[size]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
        config.className,
        sizeConf.text,
        className
      )}
    >
      {Icon && <Icon size={sizeConf.icon} />}
      <span>{config.label}</span>
    </span>
  )
}

interface EscrowStatusBadgeProps {
  status: 'created' | 'funded' | 'in_progress' | 'work_completed' | 'released' | 'disputed' | 'refunded'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const escrowStatusConfig = {
  created: { label: 'Créé', className: 'bg-gray-100 text-gray-700' },
  funded: { label: 'Financé', className: 'escrow-funded' },
  in_progress: { label: 'En cours', className: 'escrow-in-progress' },
  work_completed: { label: 'Travaux terminés', className: 'bg-blue-100 text-blue-700' },
  released: { label: 'Libéré', className: 'escrow-completed' },
  disputed: { label: 'Litige', className: 'escrow-disputed' },
  refunded: { label: 'Remboursé', className: 'bg-purple-100 text-purple-700' },
}

export function EscrowStatusBadge({
  status,
  size = 'md',
  className,
}: EscrowStatusBadgeProps) {
  const config = escrowStatusConfig[status]
  const sizeConf = sizeConfig[size]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        config.className,
        sizeConf.text,
        className
      )}
    >
      {config.label}
    </span>
  )
}

interface ArtisanVerificationSummaryProps {
  identity: boolean
  insurance: boolean
  certification: boolean
  level: VerificationLevel
  trustScore?: number
  compact?: boolean
  className?: string
}

export function ArtisanVerificationSummary({
  identity,
  insurance,
  certification,
  level,
  trustScore,
  compact = false,
  className,
}: ArtisanVerificationSummaryProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <VerificationLevelBadge level={level} size="sm" />
        {trustScore !== undefined && trustScore >= 60 && (
          <TrustScore score={trustScore} showLabel={false} size="sm" />
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <VerificationLevelBadge level={level} size="sm" />
        {trustScore !== undefined && (
          <TrustScore score={trustScore} size="sm" />
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {identity && <VerifiedBadge type="identity" size="sm" />}
        {insurance && <VerifiedBadge type="insurance" size="sm" />}
        {certification && <VerifiedBadge type="certification" size="sm" />}
      </div>
    </div>
  )
}
