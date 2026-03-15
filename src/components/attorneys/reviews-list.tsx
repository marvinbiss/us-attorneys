'use client'

import { formatRelativeDate } from '@/lib/utils/format'

interface Review {
  id: string
  author_name: string
  rating: number
  text?: string
  review_date: string
  response?: string
  response_at?: string
}

interface ReviewsListProps {
  reviews: Review[]
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        Aucun avis pour le moment
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{review.author_name}</span>
              <div className="flex text-yellow-400 text-sm">
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {formatRelativeDate(review.review_date)}
            </span>
          </div>

          {review.text && (
            <p className="text-gray-700 text-sm">{review.text}</p>
          )}

          {review.response && (
            <div className="mt-3 pl-4 border-l-2 border-blue-200 bg-blue-50/50 py-2 pr-2 rounded-r">
              <p className="text-xs text-blue-600 font-medium mb-1">
                Réponse de l'artisan
              </p>
              <p className="text-sm text-gray-700">{review.response}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
