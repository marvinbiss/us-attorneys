import { clsx } from 'clsx'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'purple'

interface StatusBadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
  purple: 'bg-blue-100 text-blue-700',
}

export function StatusBadge({ variant = 'default', children, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'px-2 py-1 rounded-full text-xs font-medium inline-flex items-center',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Pre-defined status badges for common use cases
export function UserStatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeVariant> = {
    active: 'success',
    pending: 'warning',
    suspended: 'error',
    banned: 'error',
    deleted: 'default',
  }
  const labels: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    suspended: 'Suspended',
    banned: 'Banned',
    deleted: 'Deleted',
  }
  return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>
}

export function ProviderStatusBadge({ isVerified, isActive }: { isVerified: boolean; isActive: boolean }) {
  if (!isActive) {
    return <StatusBadge variant="error">Suspended</StatusBadge>
  }
  if (!isVerified) {
    return <StatusBadge variant="warning">Pending</StatusBadge>
  }
  return <StatusBadge variant="success">Verified</StatusBadge>
}

export function SubscriptionBadge({ plan }: { plan: string }) {
  const variants: Record<string, BadgeVariant> = {
    premium: 'purple',
    pro: 'info',
    basic: 'info',
    gratuit: 'default',
    free: 'default',
  }
  return (
    <StatusBadge variant={variants[plan] || 'default'}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </StatusBadge>
  )
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeVariant> = {
    succeeded: 'success',
    paid: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'info',
    canceled: 'default',
  }
  const labels: Record<string, string> = {
    succeeded: 'Paid',
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
    canceled: 'Canceled',
  }
  return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>
}

export function ReviewStatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeVariant> = {
    approved: 'success',
    published: 'success',
    pending: 'warning',
    pending_review: 'warning',
    rejected: 'error',
    hidden: 'default',
    flagged: 'error',
  }
  const labels: Record<string, string> = {
    approved: 'Approved',
    published: 'Published',
    pending: 'Pending',
    pending_review: 'Under review',
    rejected: 'Rejected',
    hidden: 'Hidden',
    flagged: 'Flagged',
  }
  return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>
}

export function BookingStatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeVariant> = {
    confirmed: 'success',
    completed: 'success',
    pending: 'warning',
    cancelled: 'error',
    canceled: 'error',
  }
  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    canceled: 'Canceled',
  }
  return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>
}

export function ReportStatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeVariant> = {
    pending: 'warning',
    reviewed: 'info',
    resolved: 'success',
    dismissed: 'default',
  }
  const labels: Record<string, string> = {
    pending: 'Pending',
    reviewed: 'In review',
    resolved: 'Resolved',
    dismissed: 'Dismissed',
  }
  return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>
}
