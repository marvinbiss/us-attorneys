'use client'

import { useState } from 'react'
import {
  GraduationCap,
  Award,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  BadgeCheck,
} from 'lucide-react'
import type {
  AttorneyEducation,
  AttorneyAward,
  AttorneyPublication,
  DisciplinaryAction,
  AttorneyEnrichmentData,
} from '@/lib/attorney-enrichment'
import { ACTION_TYPE_LABELS, PUBLICATION_TYPE_LABELS } from '@/lib/attorney-enrichment'

// ============================================================================
// AttorneyCredentials — Trust signals component
// Displays education, awards, publications, and disciplinary records
// for an attorney profile page. Sections only render if data exists.
// ============================================================================

interface AttorneyCredentialsProps {
  enrichment: AttorneyEnrichmentData
}

export function AttorneyCredentials({ enrichment }: AttorneyCredentialsProps) {
  const { education, awards, publications, disciplinary } = enrichment

  const hasAnyData =
    education.length > 0 ||
    awards.length > 0 ||
    publications.length > 0 ||
    disciplinary.length > 0

  if (!hasAnyData) return null

  return (
    <div className="space-y-6">
      {education.length > 0 && <EducationSection education={education} />}
      {awards.length > 0 && <AwardsSection awards={awards} />}
      {publications.length > 0 && <PublicationsSection publications={publications} />}
      {disciplinary.length > 0 && <DisciplinarySection disciplinary={disciplinary} />}
    </div>
  )
}

// ============================================================================
// Collapsible Section wrapper — shared pattern for all credential sections
// ============================================================================

interface CollapsibleSectionProps {
  icon: typeof GraduationCap
  title: string
  count: number
  iconBgClass: string
  iconColorClass: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({
  icon: Icon,
  title,
  count,
  iconBgClass,
  iconColorClass,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-[#FFFCF8] dark:bg-gray-900 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-inset rounded-2xl transition-colors hover:bg-sand-100 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg ${iconBgClass} flex items-center justify-center`}>
            <Icon className={`w-[18px] h-[18px] ${iconColorClass}`} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 font-heading">
            {title}
          </h2>
          <span className="text-xs font-medium text-slate-500 dark:text-gray-400 bg-sand-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}

// ============================================================================
// Verified Badge — reusable inline badge
// ============================================================================

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-1.5 py-0.5"
      title="Verified"
    >
      <BadgeCheck className="w-3 h-3" aria-hidden="true" />
      Verified
    </span>
  )
}

// ============================================================================
// 1. Education Section
// ============================================================================

function EducationSection({ education }: { education: AttorneyEducation[] }) {
  return (
    <CollapsibleSection
      icon={GraduationCap}
      title="Education"
      count={education.length}
      iconBgClass="bg-blue-50 dark:bg-blue-900/30"
      iconColorClass="text-blue-500 dark:text-blue-400"
    >
      <ul className="space-y-3" role="list" aria-label="Education history">
        {education.map((edu) => (
          <li
            key={edu.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-sand-100 dark:bg-gray-800 border border-stone-200/40 dark:border-gray-700"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GraduationCap className="w-4 h-4 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {edu.institution}
                </span>
                {edu.is_verified && <VerifiedBadge />}
              </div>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-0.5">
                {edu.degree}
                {edu.graduation_year && <span> &mdash; {edu.graduation_year}</span>}
                {edu.honors && (
                  <span className="italic text-slate-500 dark:text-gray-500">
                    , {edu.honors}
                  </span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  )
}

// ============================================================================
// 2. Awards Section — grouped by issuer
// ============================================================================

function AwardsSection({ awards }: { awards: AttorneyAward[] }) {
  // Group by issuer
  const grouped = awards.reduce<Record<string, AttorneyAward[]>>((acc, award) => {
    const key = award.issuer
    if (!acc[key]) acc[key] = []
    acc[key].push(award)
    return acc
  }, {})

  return (
    <CollapsibleSection
      icon={Award}
      title="Awards & Recognitions"
      count={awards.length}
      iconBgClass="bg-amber-50 dark:bg-amber-900/30"
      iconColorClass="text-amber-500 dark:text-amber-400"
    >
      <div className="space-y-4" role="list" aria-label="Professional awards">
        {Object.entries(grouped).map(([issuer, issuerAwards]) => (
          <div key={issuer}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
              {issuer}
            </h3>
            <ul className="space-y-2" role="list">
              {issuerAwards.map((award) => (
                <li
                  key={award.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-sand-100 dark:bg-gray-800 border border-stone-200/40 dark:border-gray-700"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {award.title}
                        {award.year && (
                          <span className="text-slate-500 dark:text-gray-400 font-normal">
                            {' '}({award.year})
                          </span>
                        )}
                      </span>
                      {award.is_verified && <VerifiedBadge />}
                    </div>
                  </div>
                  {award.url && (
                    <a
                      href={award.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-slate-400 hover:text-clay-400 transition-colors"
                      aria-label={`View ${award.title} details`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}

// ============================================================================
// 3. Publications Section — limited to 5, expandable
// ============================================================================

function PublicationsSection({ publications }: { publications: AttorneyPublication[] }) {
  const [showAll, setShowAll] = useState(false)
  const INITIAL_LIMIT = 5
  const visiblePubs = showAll ? publications : publications.slice(0, INITIAL_LIMIT)
  const hasMore = publications.length > INITIAL_LIMIT

  return (
    <CollapsibleSection
      icon={BookOpen}
      title="Publications"
      count={publications.length}
      iconBgClass="bg-violet-50 dark:bg-violet-900/30"
      iconColorClass="text-violet-500 dark:text-violet-400"
    >
      <ul className="space-y-2" role="list" aria-label="Publications and speaking engagements">
        {visiblePubs.map((pub) => (
          <li
            key={pub.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-sand-100 dark:bg-gray-800 border border-stone-200/40 dark:border-gray-700"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-violet-500 dark:text-violet-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  &ldquo;{pub.title}&rdquo;
                </span>
                {pub.is_verified && <VerifiedBadge />}
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                {pub.publisher && <span>{pub.publisher}</span>}
                {pub.publisher && pub.published_date && <span> &mdash; </span>}
                {pub.published_date && (
                  <span>{new Date(pub.published_date).getFullYear()}</span>
                )}
              </p>
              <span className="inline-block mt-1 text-xs font-medium text-slate-400 dark:text-gray-500 bg-sand-200 dark:bg-gray-700 rounded px-1.5 py-0.5">
                {PUBLICATION_TYPE_LABELS[pub.publication_type] || pub.publication_type}
              </span>
            </div>
            {pub.url && (
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-slate-400 hover:text-clay-400 transition-colors mt-0.5"
                aria-label={`Read "${pub.title}"`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-clay-400 dark:text-clay-300 font-medium text-sm flex items-center gap-1 hover:text-clay-600 dark:hover:text-clay-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2 rounded transition-colors"
        >
          {showAll
            ? 'Show fewer'
            : `Show all ${publications.length} publications`}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      )}
    </CollapsibleSection>
  )
}

// ============================================================================
// 4. Disciplinary Section — subtle, factual, always linked to source
// ============================================================================

function DisciplinarySection({ disciplinary }: { disciplinary: DisciplinaryAction[] }) {
  return (
    <CollapsibleSection
      icon={AlertTriangle}
      title="Disciplinary Record"
      count={disciplinary.length}
      iconBgClass="bg-gray-100 dark:bg-gray-800"
      iconColorClass="text-gray-400 dark:text-gray-500"
      defaultOpen={false}
    >
      <p className="text-xs text-slate-400 dark:text-gray-500 mb-3">
        Public disciplinary records sourced from official state bar databases.
        Each record links to the original source for verification.
      </p>
      <ul className="space-y-2" role="list" aria-label="Public disciplinary records">
        {disciplinary.map((action) => {
          const label = ACTION_TYPE_LABELS[action.action_type] || action.action_type
          const year = action.effective_date
            ? new Date(action.effective_date).getFullYear()
            : null

          return (
            <li
              key={action.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  {label}
                  {action.state && <span> &mdash; {action.state}</span>}
                  {year && <span>, {year}</span>}
                </span>
                {action.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {action.description}
                  </p>
                )}
                {action.docket_number && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Docket: {action.docket_number}
                  </p>
                )}
              </div>
              <a
                href={action.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-0.5"
                aria-label={`View source for ${label}`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </li>
          )
        })}
      </ul>
    </CollapsibleSection>
  )
}

export default AttorneyCredentials
