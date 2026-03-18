import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import { getStateBySlug, getStateByCode } from '@/lib/data/usa'

// ============================================================================
// StateHubLink — "Back to state" navigation breadcrumb link
// Server component: renders a prominent "Browse all attorneys in {State}"
// link pointing to /states/{state-slug}. Strengthens the state hub page
// authority by funneling PageRank from city/PA pages.
// ============================================================================

interface StateHubLinkProps {
  /** State slug (e.g., 'california') OR state code (e.g., 'CA') */
  stateSlug?: string
  stateCode?: string
  /** Optional practice area context */
  specialtySlug?: string
  specialtyName?: string
  /** Additional CSS classes */
  className?: string
}

export default function StateHubLink({
  stateSlug,
  stateCode,
  specialtySlug,
  specialtyName,
  className = '',
}: StateHubLinkProps) {
  const state = stateSlug
    ? getStateBySlug(stateSlug)
    : stateCode
      ? getStateByCode(stateCode)
      : null

  if (!state) return null

  return (
    <nav
      className={`py-4 ${className}`}
      aria-label={`Browse attorneys in ${state.name}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* Primary state hub link */}
          <Link
            href={`/states/${state.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-stone-700 hover:text-clay-600 dark:text-gray-300 dark:hover:text-white rounded-lg text-sm font-medium border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.08] dark:hover:border-white/[0.16] transition-all duration-200 group"
          >
            <MapPin className="w-4 h-4 text-clay-400 flex-shrink-0" aria-hidden="true" />
            Browse all attorneys in {state.name}
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>

          {/* Practice area in this state — if specialty context provided */}
          {specialtySlug && specialtyName && (
            <Link
              href={`/practice-areas/${specialtySlug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sand-100 hover:bg-clay-50 dark:bg-white/[0.06] dark:hover:bg-white/[0.10] text-stone-700 hover:text-clay-600 dark:text-gray-300 dark:hover:text-white rounded-lg text-sm font-medium border border-stone-200/40 hover:border-clay-200 dark:border-white/[0.08] dark:hover:border-white/[0.16] transition-all duration-200 group"
            >
              {specialtyName} attorneys nationwide
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          )}

          {/* All states link */}
          <Link
            href="/states"
            className="text-clay-400 hover:text-clay-600 dark:text-clay-400 dark:hover:text-clay-300 text-sm flex items-center gap-1 group"
          >
            All states
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
