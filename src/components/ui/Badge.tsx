import { ReactNode } from 'react'
import { clsx } from 'clsx'

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const variantStyles = {
  primary: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  secondary: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  warning: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  neutral: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
}

const dotColors = {
  primary: 'bg-blue-500',
  secondary: 'bg-violet-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  neutral: 'bg-gray-500',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant]
          )}
        />
      )}
      {icon}
      {children}
    </span>
  )
}

// Preset badges for booking statuses
export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    confirmed: { variant: 'success', label: 'Confirmed' },
    pending: { variant: 'warning', label: 'Pending' },
    cancelled: { variant: 'error', label: 'Cancelled' },
    completed: { variant: 'primary', label: 'Completed' },
    no_show: { variant: 'neutral', label: 'No show' },
  }

  const config = statusConfig[status] || { variant: 'neutral' as const, label: status }

  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  )
}

// Slot availability badges
export function SlotBadge({ type }: { type: 'popular' | 'recommended' | 'last_minute' | 'available' }) {
  const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    popular: { variant: 'warning', label: 'High demand' },
    recommended: { variant: 'primary', label: 'Recommended' },
    last_minute: { variant: 'error', label: 'Last minute' },
    available: { variant: 'success', label: 'Available' },
  }

  const { variant, label } = config[type]

  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  )
}
