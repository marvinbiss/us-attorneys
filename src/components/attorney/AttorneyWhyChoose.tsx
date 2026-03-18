import { Trophy, Calendar, Shield, Star, Users, MapPin, CheckCircle } from 'lucide-react'
import type { LegacyAttorney } from '@/types/legacy'

interface WhyCard {
  icon: React.ElementType
  title: string
  description: string
}

function getWhyCards(attorney: LegacyAttorney): WhyCard[] {
  const cards: WhyCard[] = []

  if (attorney.creation_date) {
    const creationYear = new Date(attorney.creation_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const years = currentYear - creationYear
    if (years > 0) {
      cards.push({
        icon: Calendar,
        title: 'Experience',
        description: `${years} years in practice`,
      })
    }
  }

  if (attorney.is_verified) {
    cards.push({
      icon: Shield,
      title: 'Reliability',
      description: 'Identity verified (Bar Number)',
    })
  }

  if (attorney.average_rating > 0) {
    cards.push({
      icon: Star,
      title: 'Satisfaction',
      description: `Rated ${attorney.average_rating.toFixed(1)}/5 (${attorney.review_count} reviews)`,
    })
  }

  if (attorney.team_size && attorney.team_size > 1) {
    cards.push({
      icon: Users,
      title: 'Team',
      description: `Team of ${attorney.team_size} professionals`,
    })
  }

  if (attorney.intervention_radius_km) {
    cards.push({
      icon: MapPin,
      title: 'Proximity',
      description: `Service area within ${attorney.intervention_radius_km} miles`,
    })
  }

  if (attorney.free_quote) {
    cards.push({
      icon: CheckCircle,
      title: 'No obligation',
      description: 'Free consultation',
    })
  }

  return cards.slice(0, 3)
}

export function AttorneyWhyChoose({ attorney }: { attorney: LegacyAttorney }) {
  const cards = getWhyCards(attorney)

  if (cards.length === 0) return null

  return (
    <div className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
          <Trophy className="w-4.5 h-4.5 text-amber-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 font-heading">
          Why choose this attorney
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl bg-white border border-stone-200/60 p-5"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-clay-50 mb-3">
              <card.icon className="w-5 h-5 text-clay-400" aria-hidden="true" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">{card.title}</p>
            <p className="text-sm text-slate-600">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
