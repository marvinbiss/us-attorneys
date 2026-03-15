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
    label: 'Identity verified',
    className: 'verified-badge-identity',
    color: 'text-blue-600',
  },
  insurance: {
    icon: FileCheck,
    label: 'Insurance verified',
    className: 'verified-badge-insurance',
    color: 'text-green-600',
  },
  certification: {
    icon: Award,
    label: 'Qualified',
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
    label: 'Listed firm',
    className: 'verified-badge-enterprise',
    color: 'text-slate-600',
  },
  review: {
    icon: CheckCircle,
    label: 'Authentic review',
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
    if (score >= 60) return { label: 'Good', className: 'trust-score-good', color: 'bg-blue-500' }
    if (score >= 40) return { label: 'Fair', className: 'trust-score-fair', color: 'bg-amber-500' }
    return { label: 'Low', className: 'trust-score-poor', color: 'bg-red-500' }
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
  none: { label: 'Not listed', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null },
  basic: { label: 'Verified', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle },
  standard: { label: 'Listed+', className: 'bg-green-100 text-green-700 border-green-200', icon: Shield },
  premium: { label: 'Premium', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: Star },
  enterprise: { label: 'Enterprise', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: Building2 },
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
      title="This review comes from a client who used the platform"
    >
      <CheckCircle size={sizeConf.icon} />
      <span>Verified review</span>
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
  verified: { label: 'Verified', className: 'kyc-status-verified', icon: CheckCircle },
  pending: { label: 'Pending', className: 'kyc-status-pending', icon: null },
  rejected: { label: 'Rejected', className: 'kyc-status-rejected', icon: null },
  not_started: { label: 'Not submitted', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null },
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
  created: { label: 'Created', className: 'bg-gray-100 text-gray-700' },
  funded: { label: 'Funded', className: 'escrow-funded' },
  in_progress: { label: 'In progress', className: 'escrow-in-progress' },
  work_completed: { label: 'Work completed', className: 'bg-blue-100 text-blue-700' },
  released: { label: 'Released', className: 'escrow-completed' },
  disputed: { label: 'Disputed', className: 'escrow-disputed' },
  refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' },
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
