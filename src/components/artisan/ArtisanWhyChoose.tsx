'use client'

import { motion } from 'framer-motion'
import { Trophy, Calendar, Shield, Star, Users, MapPin, CheckCircle } from 'lucide-react'
import type { LegacyArtisan } from '@/types/legacy'

interface WhyCard {
  icon: React.ElementType
  title: string
  description: string
}

function getWhyCards(artisan: LegacyArtisan): WhyCard[] {
  const cards: WhyCard[] = []

  if (artisan.creation_date) {
    const creationYear = new Date(artisan.creation_date).getFullYear()
    const currentYear = new Date().getFullYear()
    const years = currentYear - creationYear
    if (years > 0) {
      cards.push({
        icon: Calendar,
        title: 'Exp\u00e9rience',
        description: `${years} ans d\u2019activit\u00e9`,
      })
    }
  }

  if (artisan.is_verified) {
    cards.push({
      icon: Shield,
      title: 'Fiabilit\u00e9',
      description: 'Identit\u00e9 v\u00e9rifi\u00e9e (SIRET)',
    })
  }

  if (artisan.average_rating > 0) {
    cards.push({
      icon: Star,
      title: 'Satisfaction',
      description: `Note de ${artisan.average_rating.toFixed(1)}/5 (${artisan.review_count} avis)`,
    })
  }

  if (artisan.team_size && artisan.team_size > 1) {
    cards.push({
      icon: Users,
      title: '\u00c9quipe',
      description: `\u00c9quipe de ${artisan.team_size} professionnels`,
    })
  }

  if (artisan.intervention_radius_km) {
    cards.push({
      icon: MapPin,
      title: 'Proximit\u00e9',
      description: `Intervention dans un rayon de ${artisan.intervention_radius_km}\u202fkm`,
    })
  }

  if (artisan.free_quote) {
    cards.push({
      icon: CheckCircle,
      title: 'Sans engagement',
      description: 'Devis gratuit',
    })
  }

  return cards.slice(0, 3)
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

export function ArtisanWhyChoose({ artisan }: { artisan: LegacyArtisan }) {
  const cards = getWhyCards(artisan)

  if (cards.length === 0) return null

  return (
    <div className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
          <Trophy className="w-4.5 h-4.5 text-amber-500" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 font-heading">
          Pourquoi choisir cet artisan
        </h2>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {cards.map((card) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            className="rounded-xl bg-white border border-stone-200/60 p-5"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-clay-50 mb-3">
              <card.icon className="w-5 h-5 text-clay-400" aria-hidden="true" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">{card.title}</p>
            <p className="text-sm text-slate-600">{card.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
