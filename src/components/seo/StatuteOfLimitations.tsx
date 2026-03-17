import {
  PA_TO_SOL_CATEGORY,
  STATE_SOL,
  STATE_NAMES,
  type SOLCategory,
} from '@/lib/data/state-legal-data'

interface Props {
  specialtySlug: string
  specialtyName: string
  stateCode: string
  stateName: string
}

/** Category-level labels for user-facing display */
const SOL_CATEGORY_LABELS: Record<SOLCategory, string> = {
  'personal-injury': 'Personal Injury',
  'medical-malpractice': 'Medical Malpractice',
  'property-damage': 'Property Damage',
  'written-contract': 'Written Contract',
  'oral-contract': 'Oral Contract',
  'fraud': 'Fraud',
  'employment': 'Employment',
  'wrongful-death': 'Wrongful Death',
  'product-liability': 'Product Liability',
  'defamation': 'Defamation',
  'professional-malpractice': 'Professional Malpractice',
  'real-estate': 'Real Estate',
  'debt-collection': 'Debt Collection',
}

/** Categories where the discovery rule commonly extends the SOL */
const DISCOVERY_RULE_CATEGORIES: SOLCategory[] = [
  'medical-malpractice',
  'professional-malpractice',
  'fraud',
  'product-liability',
]

/**
 * Displays Statute of Limitations information for a practice area in a given state.
 * Uses static data only (no DB queries). Returns null if no data is available.
 */
export default function StatuteOfLimitations({
  specialtySlug,
  specialtyName,
  stateCode,
  stateName,
}: Props) {
  const solCategory = PA_TO_SOL_CATEGORY[specialtySlug]
  if (!solCategory) return null

  const sc = stateCode.toUpperCase()
  const solYears = STATE_SOL[solCategory]?.[sc]
  if (solYears == null) return null

  const resolvedStateName = stateName || STATE_NAMES[sc] || stateCode
  const categoryLabel = SOL_CATEGORY_LABELS[solCategory]
  const hasDiscoveryRule = DISCOVERY_RULE_CATEGORIES.includes(solCategory)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: `${resolvedStateName} Statute of Limitations for ${categoryLabel}`,
    description: `The statute of limitations for ${specialtyName.toLowerCase()} cases in ${resolvedStateName} is ${solYears} year${solYears !== 1 ? 's' : ''}.`,
    legislationJurisdiction: {
      '@type': 'AdministrativeArea',
      name: resolvedStateName,
    },
    temporalCoverage: `P${solYears}Y`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026'),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Statute of Limitations for {specialtyName} in {resolvedStateName}
          </h2>

          <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
            <p className="text-3xl font-bold text-blue-800">
              {solYears} year{solYears !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Filing deadline under {resolvedStateName} law ({categoryLabel} claims)
            </p>
          </div>

          <div className="text-sm text-gray-700 space-y-2">
            <p>
              In {resolvedStateName}, you generally have{' '}
              <strong>{solYears} year{solYears !== 1 ? 's' : ''}</strong> from the
              date of the incident to file a {specialtyName.toLowerCase()} lawsuit.
              If you miss this deadline, the court will almost certainly dismiss your
              case, regardless of its merits.
            </p>

            {hasDiscoveryRule && (
              <p>
                <strong>Discovery rule:</strong> In some {categoryLabel.toLowerCase()}{' '}
                cases, {resolvedStateName} courts may apply the discovery rule, which
                starts the clock from when the injury was discovered or reasonably
                should have been discovered, rather than when it occurred.
              </p>
            )}

            <p className="text-blue-800 font-medium mt-3">
              Consult an attorney immediately if you are approaching the deadline.
              Time-sensitive cases require prompt legal action to preserve your rights.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
