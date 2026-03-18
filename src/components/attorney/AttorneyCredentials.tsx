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
  Shield,
  Hash,
  Calendar,
  Scale,
  Users,
  ShieldCheck,
} from 'lucide-react'
import type {
  AttorneyEducation,
  AttorneyAward,
  AttorneyPublication,
  DisciplinaryAction,
  AttorneyEnrichmentData,
} from '@/lib/attorney-enrichment'
import { ACTION_TYPE_LABELS, PUBLICATION_TYPE_LABELS } from '@/lib/attorney-enrichment'
import type { LegacyAttorney } from '@/types/legacy'
import BarVerificationLink from './BarVerificationLink'
import { VerificationBadgeDetailed } from '@/components/verification/VerificationBadgeDetailed'
import type { BarAdmissionRecord } from '@/lib/verification/bar-verify'

// ============================================================================
// AttorneyCredentials — Unified credentials & trust signals component
// Merges: education, awards, publications, disciplinary, bar admissions,
// business card data (bar number, creation date, legal form, team size),
// and trust score into a single coherent section.
// ============================================================================

interface AttorneyCredentialsProps {
  enrichment: AttorneyEnrichmentData
  attorney?: LegacyAttorney
  trustScore?: number
  trustScoreBreakdown?: Record<string, number>
  /** Verification timestamp (ISO string) — when bar license was last verified */
  verifiedAt?: string | null
  /** State bar association URL for external verification link */
  barAssociationUrl?: string | null
  /** Bar state abbreviation (2 letters) */
  barState?: string | null
  /** All bar admissions from bar_admissions table */
  barAdmissions?: BarAdmissionRecord[]
}

export function AttorneyCredentials({ enrichment, attorney, trustScore, trustScoreBreakdown, verifiedAt, barAssociationUrl, barState, barAdmissions }: AttorneyCredentialsProps) {
  const { education, awards, publications, disciplinary } = enrichment

  const hasBarNumber = !!attorney?.bar_number
  const hasCreationDate = !!attorney?.creation_date
  const hasLegalForm = !!attorney?.legal_form
  const hasTeamSize = attorney?.team_size != null && attorney.team_size >= 0
  const hasBusinessData = hasBarNumber || hasCreationDate || hasLegalForm || hasTeamSize
  const hasEnrichment = education.length > 0 || awards.length > 0 || publications.length > 0 || disciplinary.length > 0
  const hasTrustScore = (trustScore ?? 0) > 0
  const hasBarAdmissions = barAdmissions && barAdmissions.length > 0

  // Determine overall verification status for the badge
  const verificationStatus = hasBarNumber && (verifiedAt || attorney?.is_verified)
    ? 'verified' as const
    : hasBarNumber
      ? 'pending' as const
      : 'unverified' as const

  // Extract admission year from creation_date or first admission
  const admissionYear = barAdmissions?.[0]?.admissionDate
    ? new Date(barAdmissions[0].admissionDate).getFullYear()
    : attorney?.creation_date
      ? new Date(attorney.creation_date).getFullYear()
      : undefined

  if (!hasBusinessData && !hasEnrichment && !hasTrustScore) return null

  return (
    <div className="space-y-6">
      {/* Detailed Verification Badge — multi-state display */}
      {(hasBarNumber || hasBarAdmissions) && (
        <VerificationBadgeDetailed
          status={verificationStatus}
          primaryState={barState || barAdmissions?.[0]?.state || undefined}
          admissionYear={admissionYear}
          barAdmissions={barAdmissions}
        />
      )}

      {/* Bar Admissions & Business Profile */}
      {hasBusinessData && (
        <BarAdmissionsSection
          attorney={attorney!}
          hasBarNumber={hasBarNumber}
          hasCreationDate={hasCreationDate}
          hasLegalForm={hasLegalForm}
          hasTeamSize={hasTeamSize}
          verifiedAt={verifiedAt}
          barAssociationUrl={barAssociationUrl}
          barState={barState}
        />
      )}

      {/* Trust Score inline (collapsed by default) */}
      {hasTrustScore && (
        <TrustScoreInline score={trustScore!} breakdown={trustScoreBreakdown} />
      )}

      {education.length > 0 && <EducationSection education={education} />}
      {awards.length > 0 && <AwardsSection awards={awards} />}
      {publications.length > 0 && <PublicationsSection publications={publications} />}
      {disciplinary.length > 0 && <DisciplinarySection disciplinary={disciplinary} />}
    </div>
  )
}

// ============================================================================
// Bar Admissions / Business Profile Section (merged from AttorneyBusinessCard)
// ============================================================================

function BarAdmissionsSection({
  attorney,
  hasBarNumber,
  hasCreationDate,
  hasLegalForm,
  hasTeamSize,
  verifiedAt,
  barAssociationUrl,
  barState,
}: {
  attorney: LegacyAttorney
  hasBarNumber: boolean
  hasCreationDate: boolean
  hasLegalForm: boolean
  hasTeamSize: boolean
  verifiedAt?: string | null
  barAssociationUrl?: string | null
  barState?: string | null
}) {
  const yearsSinceCreation = attorney.creation_date ? getYearsSinceCreation(attorney.creation_date) : null
  const formattedVerifiedAt = verifiedAt ? formatVerifiedDate(verifiedAt) : null

  return (
    <div className="bg-[#FFFCF8] dark:bg-gray-900 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-sand-50 dark:from-gray-800 via-clay-50/30 dark:via-gray-800 to-sand-50 dark:to-gray-800 border-b border-stone-200/40 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center shadow-sm shadow-glow-clay flex-shrink-0">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 font-heading">
                Credentials &amp; Bar Admissions
              </h3>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {formattedVerifiedAt
                  ? `Last verified: ${formattedVerifiedAt}`
                  : 'Verified through state bar records'}
              </p>
            </div>
          </div>
          {hasBarNumber && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-200 dark:border-green-700 shadow-sm flex-shrink-0">
              <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Data grid */}
      <div className="p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bar Number */}
          {attorney.bar_number && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sand-100 dark:bg-gray-800 border border-sand-300 dark:border-gray-700">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <Hash className="w-4 h-4 text-clay-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Bar Number
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100 font-mono tracking-widest">
                  {attorney.bar_number.trim()}
                </dd>
              </div>
            </div>
          )}

          {/* Creation date */}
          {hasCreationDate && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-amber-600/90 dark:text-amber-400 uppercase tracking-wide">
                  Established
                </dt>
                <dd className="mt-0.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCreationDate(attorney.creation_date!)}
                  </span>
                  {yearsSinceCreation !== null && yearsSinceCreation > 0 && (
                    <span className="mt-1.5 flex">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-700">
                        {yearsSinceCreation}&nbsp;year{yearsSinceCreation > 1 ? 's' : ''}&nbsp;in practice
                      </span>
                    </span>
                  )}
                </dd>
              </div>
            </div>
          )}

          {/* Legal form */}
          {hasLegalForm && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sand-100 dark:bg-gray-800 border border-sand-300 dark:border-gray-700">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <Scale className="w-4 h-4 text-stone-600 dark:text-gray-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                  Legal structure
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {attorney.legal_form}
                </dd>
              </div>
            </div>
          )}

          {/* Team size */}
          {hasTeamSize && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-clay-50/50 dark:bg-clay-900/20 border border-clay-100 dark:border-clay-800">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <Users className="w-4 h-4 text-clay-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-clay-600/90 dark:text-clay-400 uppercase tracking-wide">
                  Team size
                </dt>
                <dd className="mt-0.5">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {attorney.team_size === 0 ? 'Solo practitioner' : attorney.team_size === 1 ? '1 employee' : `${attorney.team_size} employees`}
                  </span>
                </dd>
              </div>
            </div>
          )}
        </dl>

        {/* External verification link */}
        {barState && barAssociationUrl && (
          <div className="mt-4 pt-4 border-t border-stone-200/40 dark:border-gray-700">
            <BarVerificationLink
              barState={barState}
              barNumber={attorney.bar_number}
              barAssociationUrl={barAssociationUrl}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Trust Score Inline (simplified version for credentials section)
// ============================================================================

function TrustScoreInline({ score, breakdown }: { score: number; breakdown?: Record<string, number> }) {
  const [expanded, setExpanded] = useState(false)

  const getColor = (s: number) => s >= 7 ? 'text-emerald-700 dark:text-emerald-300' : s >= 4 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
  const getBarColor = (s: number) => s >= 7 ? 'bg-emerald-500' : s >= 4 ? 'bg-amber-500' : 'bg-red-500'
  const getLabel = (s: number) => s >= 9 ? 'Exceptional' : s >= 7 ? 'Highly Trusted' : s >= 5 ? 'Trusted' : s >= 3 ? 'Building Trust' : 'New Profile'

  return (
    <div className="bg-[#FFFCF8] dark:bg-gray-900 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-clay-400" aria-hidden="true" />
          Trust Score
        </h3>
        <div className={`text-2xl font-bold ${getColor(score)}`} aria-label={`Trust Score ${score} out of 10`}>
          {score.toFixed(1)}<span className="text-sm font-normal text-slate-400 dark:text-gray-500">/10</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${getBarColor(score)} transition-all`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <p className={`text-sm font-medium ${getColor(score)} mb-3`}>{getLabel(score)}</p>

      {/* Expandable breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-slate-500 dark:text-gray-400 hover:text-clay-600 dark:hover:text-clay-300 font-medium flex items-center gap-1 transition-colors"
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Show details'}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-stone-200/40 dark:border-gray-700 space-y-2">
              <p className="text-xs text-slate-400 dark:text-gray-500 mb-2">Calculated from publicly verifiable data. No payment can influence it.</p>
              {Object.entries(breakdown).map(([factor, value]) => (
                <div key={factor} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-gray-400 capitalize">{factor.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getBarColor(value)}`} style={{ width: `${(value / 10) * 100}%` }} />
                    </div>
                    <span className={`font-medium ${getColor(value)} text-xs`}>{value.toFixed(0)}/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// Collapsible Section wrapper
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
          className={`w-5 h-5 text-slate-400 dark:text-gray-500 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out motion-reduce:transition-none overflow-hidden ${
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

function VerifiedBadgeInline() {
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
                {edu.is_verified && <VerifiedBadgeInline />}
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
                      {award.is_verified && <VerifiedBadgeInline />}
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
// 3. Publications Section
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
                {pub.is_verified && <VerifiedBadgeInline />}
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
            className={`w-4 h-4 transition-transform duration-200 motion-reduce:transition-none ${showAll ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      )}
    </CollapsibleSection>
  )
}

// ============================================================================
// 4. Disciplinary Section
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

// ============================================================================
// Helpers
// ============================================================================

function formatCreationDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function getYearsSinceCreation(dateStr: string): number | null {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return Math.floor((new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  } catch {
    return null
  }
}

function formatVerifiedDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default AttorneyCredentials
