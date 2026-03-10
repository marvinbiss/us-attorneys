'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { HomepageReview } from '@/lib/data/stats'

const AVATAR_PHOTOS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face&q=80',
]

const FALLBACK_REVIEWS = [
  { client_name: 'Jean-Pierre D.', rating: 5, comment: 'Fuite d\'eau un samedi soir. Artisan en 20 min. Bluffant.', created_at: '' },
  { client_name: 'Camille R.', rating: 5, comment: 'Peintre exceptionnel, salon refait en un week-end.', created_at: '' },
  { client_name: 'Nicolas P.', rating: 4, comment: 'Maçon très compétent pour la rénovation de façade.', created_at: '' },
  { client_name: 'Claire M.', rating: 5, comment: 'Serrurier arrivé rapidement, travail propre et efficace.', created_at: '' },
  { client_name: 'Antoine G.', rating: 5, comment: 'Électricien très sérieux, mise aux normes impeccable.', created_at: '' },
  { client_name: 'Isabelle F.', rating: 4, comment: 'Carreleur du tonnerre ! Salle de bain transformée.', created_at: '' },
  { client_name: 'Romain V.', rating: 5, comment: 'Chauffagiste réactif, chaudière réparée en 1h.', created_at: '' },
  { client_name: 'Lucie B.', rating: 5, comment: 'Menuisier talentueux, mes portes sont magnifiques.', created_at: '' },
]

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-stone-500'}`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

interface Props {
  reviews?: HomepageReview[]
}

export function ClayReviewsCarousel({ reviews }: Props) {
  const [paused, setPaused] = useState(false)

  const displayReviews = reviews && reviews.length >= 4 ? reviews : FALLBACK_REVIEWS
  const doubled = [...displayReviews, ...displayReviews]

  return (
    <div
      className="relative"
      role="region"
      aria-label="Avis clients en défilement"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setPaused(p => !p) }
      }}
    >
      <div
        className={`flex gap-4 ${paused ? '' : 'animate-[scroll-carousel_60s_linear_infinite]'}`}
        style={{ willChange: 'transform' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {doubled.map((review, idx) => (
          <div
            key={idx}
            className="shrink-0 w-72 bg-white/10 border border-white/20 rounded-2xl p-5 backdrop-blur-sm"
          >
            <div className="flex gap-0.5 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <StarIcon key={i} filled={i <= review.rating} />
              ))}
            </div>
            <p className="text-white/90 text-sm leading-relaxed mb-4 line-clamp-3">
              &ldquo;{review.comment}&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <Image
                src={AVATAR_PHOTOS[idx % AVATAR_PHOTOS.length]}
                alt={review.client_name || 'Client vérifié'}
                width={36}
                height={36}
                sizes="36px"
                loading="lazy"
                className="rounded-full object-cover shrink-0"
                style={{ border: '2px solid rgba(255,255,255,.15)' }}
              />
              <div>
                <p className="text-white text-sm font-medium">{review.client_name || 'Client vérifié'}</p>
                <p className="text-white/70 text-xs">Client vérifié</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
