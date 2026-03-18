import { ExternalLink, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Mapping of state abbreviations to full names for display */
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia', PR: 'Puerto Rico', GU: 'Guam', VI: 'U.S. Virgin Islands',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
}

interface BarVerificationLinkProps {
  /** State abbreviation (e.g., "TX", "NY") */
  barState: string | null | undefined
  /** Bar number for context */
  barNumber?: string | null
  /** Bar association URL from the states table */
  barAssociationUrl?: string | null
  /** Additional CSS classes */
  className?: string
}

/**
 * "Verify on [State] Bar website" external link.
 *
 * Links to the actual state bar association website so users can
 * independently verify an attorney's bar status.
 * Uses states.bar_association_url from the database.
 */
export function BarVerificationLink({
  barState,
  barNumber,
  barAssociationUrl,
  className,
}: BarVerificationLinkProps) {
  // Cannot render without a state and URL
  if (!barState || !barAssociationUrl) return null

  const stateName = STATE_NAMES[barState.toUpperCase()] || barState

  return (
    <a
      href={barAssociationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium',
        'text-blue-700 dark:text-blue-300',
        'bg-blue-50 dark:bg-blue-900/20',
        'border border-blue-200 dark:border-blue-800',
        'hover:bg-blue-100 dark:hover:bg-blue-900/40',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        className
      )}
      aria-label={`Verify this attorney on the ${stateName} Bar Association website${barNumber ? ` (Bar #${barNumber})` : ''}`}
    >
      <Scale className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>
        Verify on {stateName} Bar website
      </span>
      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60" aria-hidden="true" />
    </a>
  )
}

export default BarVerificationLink
