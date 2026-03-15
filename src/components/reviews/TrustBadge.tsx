'use client'

import { Shield, Award, Star, Clock, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'

type BadgeType = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'top_rated' | 'quick_responder' | 'verified_expert' | 'eco_friendly'

interface TrustBadgeProps {
  badge: BadgeType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const BADGE_CONFIG: Record<BadgeType, {
  icon: React.ElementType
  label: string
  labelFr: string
  color: string
  bgColor: string
  borderColor: string
  description: string
}> = {
  none: {
    icon: Shield,
    label: 'None',
    labelFr: 'Aucun',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: '',
  },
  bronze: {
    icon: Shield,
    label: 'Bronze',
    labelFr: 'Bronze',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: '10+ reviews, 3.5+ rating',
  },
  silver: {
    icon: Shield,
    label: 'Silver',
    labelFr: 'Argent',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    description: '25+ reviews, 4.0+ rating, 90%+ response, 1+ year on platform',
  },
  gold: {
    icon: Award,
    label: 'Gold',
    labelFr: 'Or',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    description: '50+ reviews, 4.5+ rating, 95%+ response, 3+ years on platform',
  },
  platinum: {
    icon: Award,
    label: 'Platinum',
    labelFr: 'Platine',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    description: '100+ avis, 4.8+ note, 98%+ réponse, 5+ ans sur la plateforme',
  },
  top_rated: {
    icon: Star,
    label: 'Top Rated',
    labelFr: 'Top Noté',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    description: 'Parmi les mieux notés',
  },
  quick_responder: {
    icon: Clock,
    label: 'Quick Responder',
    labelFr: 'Réponse Rapide',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    description: 'Répond en moins d\'1h',
  },
  verified_expert: {
    icon: Shield,
    label: 'Verified Expert',
    labelFr: 'Expert Qualifié',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    description: 'Qualifications contrôlées',
  },
  eco_friendly: {
    icon: Leaf,
    label: 'Eco-Friendly',
    labelFr: 'Éco-Responsable',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    description: 'Pratiques écologiques',
  },
}

const SIZE_CONFIG = {
  sm: {
    badge: 'px-1.5 py-0.5 gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
  },
  md: {
    badge: 'px-2 py-1 gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
  },
  lg: {
    badge: 'px-3 py-1.5 gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
  },
}

export function TrustBadge({
  badge,
  size = 'md',
  showLabel = true,
  className,
}: TrustBadgeProps) {
  if (badge === 'none') return null

  const config = BADGE_CONFIG[badge]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bgColor,
        config.borderColor,
        sizeConfig.badge,
        className
      )}
      title={config.description}
    >
      <Icon className={cn(sizeConfig.icon, config.color)} />
      {showLabel && (
        <span className={cn(sizeConfig.text, config.color)}>
          {config.labelFr}
        </span>
      )}
    </div>
  )
}

// Display multiple badges
interface TrustBadgesProps {
  badges: BadgeType[]
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  maxDisplay?: number
  className?: string
}

export function TrustBadges({
  badges,
  size = 'sm',
  showLabels = false,
  maxDisplay = 3,
  className,
}: TrustBadgesProps) {
  const filteredBadges = badges.filter(b => b !== 'none')
  const displayBadges = filteredBadges.slice(0, maxDisplay)
  const remaining = filteredBadges.length - maxDisplay

  if (displayBadges.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayBadges.map((badge) => (
        <TrustBadge
          key={badge}
          badge={badge}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {remaining > 0 && (
        <span className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600',
          SIZE_CONFIG[size].text
        )}>
          +{remaining}
        </span>
      )}
    </div>
  )
}

export default TrustBadge
