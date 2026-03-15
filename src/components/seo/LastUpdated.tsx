import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LastUpdatedProps {
  /** Label before the date. Default: "Fees verified and updated on" */
  label?: string
  className?: string
}

/**
 * Server component — displays the ISR generation date for freshness signals.
 * Uses <time datetime="..."> for SEO structured data.
 */
export default function LastUpdated({
  label = 'Fees verified and updated on',
  className,
}: LastUpdatedProps) {
  const now = new Date()
  const formatted = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const iso = now.toISOString().split('T')[0]

  return (
    <p className={cn('text-sm text-gray-500 flex items-center gap-1.5', className)}>
      <Clock className="h-3.5 w-3.5" />
      {label}{' '}
      <time dateTime={iso}>{formatted}</time>
    </p>
  )
}
