import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Search, Inbox, FileQuestion, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export interface EmptyStateProps {
  variant?: 'search' | 'inbox' | 'notFound' | 'error'
  title: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  className?: string
}

const defaultIcons = {
  search: Search,
  inbox: Inbox,
  notFound: FileQuestion,
  error: AlertCircle,
}

const iconColors = {
  search: 'text-blue-500 bg-blue-50',
  inbox: 'text-gray-500 bg-gray-50',
  notFound: 'text-amber-500 bg-amber-50',
  error: 'text-red-500 bg-red-50',
}

export function EmptyState({
  variant = 'search',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const DefaultIcon = defaultIcons[variant]
  const IconComponent = icon || <DefaultIcon className="w-12 h-12" />

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      <div
        className={clsx(
          'w-20 h-20 rounded-2xl flex items-center justify-center mb-6',
          iconColors[variant]
        )}
      >
        {IconComponent}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-8 max-w-md">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
            >
              {action.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState
