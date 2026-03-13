import Link from 'next/link'
import { Euro, Star, Search, AlertTriangle, FileText } from 'lucide-react'

interface CrossIntentLinksProps {
  service: string
  serviceName: string
  ville?: string
  villeName?: string
  currentIntent: 'tarifs' | 'avis' | 'services' | 'urgence' | 'devis'
}

const intents = [
  { key: 'tarifs', label: 'Tarifs', icon: Euro, href: (s: string, v?: string) => v ? `/tarifs/${s}/${v}` : `/tarifs/${s}` },
  { key: 'avis', label: 'Avis', icon: Star, href: (s: string, v?: string) => v ? `/avis/${s}/${v}` : `/avis/${s}` },
  { key: 'services', label: 'Artisans', icon: Search, href: (s: string, v?: string) => v ? `/services/${s}/${v}` : `/services/${s}` },
  { key: 'urgence', label: 'Urgence', icon: AlertTriangle, href: (s: string, v?: string) => v ? `/urgence/${s}/${v}` : `/urgence/${s}` },
  { key: 'devis', label: 'Devis', icon: FileText, href: (s: string, v?: string) => v ? `/devis/${s}/${v}` : `/devis/${s}` },
] as const

export default function CrossIntentLinks({
  service,
  serviceName,
  ville,
  villeName,
  currentIntent,
}: CrossIntentLinksProps) {
  return (
    <nav
      aria-label={`Voir aussi pour ${serviceName}${villeName ? ` a ${villeName}` : ''}`}
      className="border-t border-gray-200 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {serviceName}{villeName ? ` ${'\u00E0'} ${villeName}` : ''} — voir aussi
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
