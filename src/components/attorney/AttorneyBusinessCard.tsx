'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  Shield,
  CheckCircle,
  ExternalLink,
  Building2,
  Calendar,
  Hash,
  Scale,
  Users,
  Briefcase,
} from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'

interface AttorneyBusinessCardProps {
  attorney: LegacyAttorney
}

/** Format bar number for display */
function formatBarNumber(barNumber: string): string {
  return barNumber.trim()
}

/** Format creation date to US locale — full date */
function formatCreationDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/** Calculate full years since creation */
function getYearsSinceCreation(dateStr: string): number | null {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  } catch {
    return null
  }
}

/** Format employee / team size to a readable label */
function formatTeamSize(size: number): string {
  if (size === 0) return 'Solo practitioner'
  if (size === 1) return '1 employee'
  return `${size} employees`
}

export function AttorneyBusinessCard({ attorney }: AttorneyBusinessCardProps) {
  const reducedMotion = useReducedMotion()
  const hasSiret = !!attorney.siret
  const hasEmployees = attorney.team_size != null && attorney.team_size >= 0
  const hasAnyData =
    hasSiret ||
    !!attorney.legal_form ||
    !!attorney.creation_date ||
    !!attorney.email ||
    !!attorney.website ||
    hasEmployees

  if (!hasAnyData) return null

  const yearsSinceCreation = attorney.creation_date
    ? getYearsSinceCreation(attorney.creation_date)
    : null

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.2 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 py-5 bg-gradient-to-r from-sand-50 via-clay-50/30 to-sand-50 border-b border-stone-200/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-clay-400 to-clay-600 flex items-center justify-center shadow-sm shadow-glow-clay flex-shrink-0">
              <Shield className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 font-heading">
                Business profile
              </h3>
              <p className="text-sm text-slate-500">
                Verified through state bar records
              </p>
            </div>
          </div>
          {hasSiret && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 shadow-sm flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* ── Data grid ──────────────────────────────────────────────── */}
      <div className="p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Bar Number */}
          {attorney.siret && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sand-100 border border-sand-300 hover:bg-sand-200/60 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Hash className="w-4 h-4 text-clay-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Bar Number
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-gray-900 font-mono tracking-widest">
                  {formatBarNumber(attorney.siret)}
                </dd>
              </div>
            </div>
          )}

          {/* Creation date — prominent */}
          {attorney.creation_date && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-amber-600/90 uppercase tracking-wide">
                  Established
                </dt>
                <dd className="mt-0.5">
                  <span className="text-sm font-bold text-gray-900">
                    {formatCreationDate(attorney.creation_date)}
                  </span>
                  {yearsSinceCreation !== null && yearsSinceCreation > 0 && (
                    <span className="mt-1.5 flex">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                        {yearsSinceCreation}&nbsp;year{yearsSinceCreation > 1 ? 's' : ''}&nbsp;in practice
                      </span>
                    </span>
                  )}
                </dd>
              </div>
            </div>
          )}

          {/* Legal form */}
          {attorney.legal_form && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sand-100 border border-sand-300 hover:bg-sand-200/60 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Scale className="w-4 h-4 text-stone-600" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Legal structure
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-gray-900">
                  {attorney.legal_form}
                </dd>
              </div>
            </div>
          )}

          {/* Team size / headcount — prominent */}
          {hasEmployees && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-clay-50/50 border border-clay-100 hover:bg-clay-50/80 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                <Users className="w-4 h-4 text-clay-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-clay-600/90 uppercase tracking-wide">
                  Team size
                </dt>
                <dd className="mt-0.5">
                  <span className="text-sm font-bold text-gray-900">
                    {formatTeamSize(attorney.team_size!)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Source: State bar records
                  </span>
                </dd>
              </div>
            </div>
          )}
        </dl>

        {/* ── Secondary links: website & email only (no phone here) ── */}
        {(attorney.email || attorney.website) && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex flex-wrap gap-3">
              {attorney.email && (
                <a
                  href={`mailto:${attorney.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  aria-label={`Send email to ${attorney.email}`}
                >
                  <Briefcase className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span className="truncate max-w-[200px]">{attorney.email}</span>
                </a>
              )}

              {attorney.website && (
                <a
                  href={
                    attorney.website.startsWith('http')
                      ? attorney.website
                      : `https://${attorney.website}`
                  }
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-clay-400 hover:text-clay-600 hover:border-clay-200 hover:bg-clay-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
                >
                  <Building2 className="w-4 h-4" aria-hidden="true" />
                  <span className="truncate max-w-[180px]">
                    {attorney.website
                      .replace(/^https?:\/\/(www\.)?/, '')
                      .replace(/\/$/, '')}
                  </span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
