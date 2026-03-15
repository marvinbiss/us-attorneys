import Link from 'next/link'
import { DollarSign, Star, Search, AlertTriangle, FileText } from 'lucide-react'

interface CrossIntentLinksProps {
  service: string
  specialtyName: string
  ville?: string
  villeName?: string
  currentIntent: 'tarifs' | 'avis' | 'services' | 'urgence' | 'devis'
}

const intents = [
  { key: 'tarifs', label: 'Fees', icon: DollarSign, href: (s: string, v?: string) => v ? `/pricing/${s}/${v}` : `/pricing/${s}` },
  { key: 'avis', label: 'Reviews', icon: Star, href: (s: string, v?: string) => v ? `/reviews/${s}/${v}` : `/reviews/${s}` },
  { key: 'services', label: 'Attorneys', icon: Search, href: (s: string, v?: string) => v ? `/practice-areas/${s}/${v}` : `/practice-areas/${s}` },
  { key: 'urgence', label: 'Emergency', icon: AlertTriangle, href: (s: string, v?: string) => v ? `/emergency/${s}/${v}` : `/emergency/${s}` },
  { key: 'devis', label: 'Consultation', icon: FileText, href: (s: string, v?: string) => v ? `/quotes/${s}/${v}` : `/quotes/${s}` },
] as const

export default function CrossIntentLinks({
  service,
  specialtyName,
  ville,
  villeName,
  currentIntent,
}: CrossIntentLinksProps) {
  return (
    <nav
      aria-label={`See also for ${specialtyName}${villeName ? ` in ${villeName}` : ''}`}
      className="border-t border-gray-200 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {specialtyName}{villeName ? ` in ${villeName}` : ''} — see also
        </p>
        <div className="flex flex-wrap gap-2">
          {intents.map(({ key, label, icon: Icon, href }) => {
            const isCurrent = key === currentIntent
            if (isCurrent) {
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white cursor-default"
                  aria-current="page"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
              )
            }
            return (
              <Link
                key={key}
                href={href(service, ville)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
