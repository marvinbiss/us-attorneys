'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Clock, ArrowRight, RotateCcw,
  Share2, Copy, Check, Scale, Shield, MapPin, ExternalLink,
  FileText, Zap,
} from 'lucide-react'
import type { AssessmentRecommendation } from '@/lib/diagnostic/assessment-engine'
import { US_STATES } from '@/lib/geography'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AssessmentResultProps {
  recommendation: AssessmentRecommendation
  stateCode?: string
  onRestart: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssessmentResult({
  recommendation,
  stateCode,
  onRestart,
}: AssessmentResultProps) {
  const [copied, setCopied] = useState(false)

  const stateName = stateCode ? US_STATES[stateCode] : null
  const primary = recommendation.practiceAreas[0]
  const secondary = recommendation.practiceAreas.slice(1)

  const isUrgent = recommendation.urgency === 'immediate'

  // Build a shareable URL (assessment summary)
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/tools/legal-assessment?pa=${primary?.slug || ''}&state=${stateCode || ''}`
    : ''

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'My Legal Assessment Result — US Attorneys',
          text: `Based on my assessment, I may need a ${primary?.name || 'legal'} attorney.`,
          url: shareUrl,
        })
      } catch {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Urgency banner */}
      {isUrgent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-3 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl"
        >
          <Zap className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Urgent Matter</p>
            <p className="text-red-700 dark:text-red-400 text-sm mt-0.5">
              Based on your answers, this appears to require immediate legal attention. We recommend contacting an attorney today.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main recommendation card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-cta-50 via-white to-cta-50/50 dark:from-cta-900/20 dark:via-gray-800 dark:to-cta-900/10 border border-cta-200 dark:border-cta-800 rounded-2xl p-6 sm:p-8 mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <Scale className="w-5 h-5 text-cta-600 dark:text-cta-400" />
          <p className="text-sm font-semibold text-cta-600 dark:text-cta-400 uppercase tracking-wider">
            Our Recommendation
          </p>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-heading mt-2 mb-1">
          {primary?.name || 'General Practice'} Attorney
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          For your <strong className="text-gray-900 dark:text-white">{recommendation.subCategoryLabel.toLowerCase()}</strong> issue
          {stateName && <> in <strong className="text-gray-900 dark:text-white">{stateName}</strong></>}
        </p>

        {/* Confidence badge */}
        {primary && (
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-cta-500"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 100' }}
                  animate={{ strokeDasharray: `${primary.confidence} 100` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{primary.confidence}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Match confidence</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Based on your answers</p>
            </div>
          </div>
        )}

        {/* CTA button */}
        <Link
          href={stateName
            ? `/practice-areas/${primary?.slug || 'general-practice'}/${stateName.toLowerCase().replace(/\s+/g, '-')}`
            : `/practice-areas/${primary?.slug || 'general-practice'}`
          }
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-cta-600 hover:bg-cta-700 dark:bg-cta-500 dark:hover:bg-cta-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] w-full sm:w-auto justify-center text-base"
        >
          {isUrgent ? (
            <>
              <Zap className="w-5 h-5" />
              Find an Attorney Now
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Request Free Consultation
            </>
          )}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {/* Secondary practice areas */}
      {secondary.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Also Relevant Practice Areas
          </h3>
          <div className="space-y-3">
            {secondary.map((pa) => (
              <Link
                key={pa.slug}
                href={`/practice-areas/${pa.slug}`}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-cta-50 dark:hover:bg-cta-900/20 hover:border-cta-200 dark:hover:border-cta-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-cta-600 dark:group-hover:text-cta-400 transition-colors" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-cta-700 dark:group-hover:text-cta-300 transition-colors text-sm">
                      {pa.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pa.confidence}% match</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-cta-600 dark:text-cta-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    View attorneys
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-cta-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Deadline warning */}
      {recommendation.deadlineWarning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-start gap-3 p-5 mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Deadline Warning</p>
            <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
              {recommendation.deadlineWarning}
            </p>
            {stateCode && (
              <p className="text-amber-600 dark:text-amber-500 text-xs mt-2 italic">
                Note: Statutes of limitations vary by state. The information above is a general estimate for {stateName || stateCode}. An attorney can provide exact deadlines for your situation.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Top 3 attorney cards (placeholder — links to search) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 mb-6"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Find Matching Attorneys {stateName ? `in ${stateName}` : 'Near You'}
        </h3>
        <div className="space-y-3">
          {[
            { title: `Top-rated ${primary?.name || ''} attorneys`, desc: 'Sorted by client reviews and experience', href: `/practice-areas/${primary?.slug || 'general-practice'}${stateName ? `/${stateName.toLowerCase().replace(/\s+/g, '-')}` : ''}` },
            { title: `${primary?.name || 'Legal'} attorneys offering free consultations`, desc: 'No upfront cost to discuss your case', href: `/practice-areas/${primary?.slug || 'general-practice'}${stateName ? `/${stateName.toLowerCase().replace(/\s+/g, '-')}` : ''}` },
            { title: `${primary?.name || 'Legal'} attorneys near your ZIP code`, desc: 'Find someone local you can meet in person', href: '/attorney-map' },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-cta-50 dark:hover:bg-cta-900/20 hover:border-cta-200 dark:hover:border-cta-800 transition-all group"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-cta-700 dark:group-hover:text-cta-300 transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cta-500 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Preparation checklist */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 mb-6"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          What to Prepare for Your First Consultation
        </h3>
        <ul className="space-y-3">
          {recommendation.preparationChecklist.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Urgency-specific advice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 sm:p-6 mb-6"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          {isUrgent ? 'Immediate Next Steps' : 'Recommended Next Steps'}
        </h3>
        <ol className="space-y-3 list-decimal list-inside">
          {isUrgent ? (
            <>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Contact an attorney today.</strong> Many offer same-day phone consultations for urgent matters.
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Preserve all evidence.</strong> Do not delete texts, emails, photos, or any documents related to your case.
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Do not discuss your case</strong> with anyone other than your attorney, especially on social media.
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Write down everything</strong> you remember about the incident while details are fresh.
              </li>
            </>
          ) : (
            <>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Gather the documents</strong> listed in the preparation checklist above.
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Compare 2-3 attorneys</strong> based on their experience with similar cases, reviews, and fees.
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Schedule free consultations</strong> to find the right fit before committing.
              </li>
              <li className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Ask about fee structures</strong> — contingency, hourly, or flat fee — before signing any agreement.
              </li>
            </>
          )}
        </ol>
      </motion.div>

      {/* Actions: Share / Restart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-cta-600 dark:hover:text-cta-400 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Result
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
