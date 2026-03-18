import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, ThumbsUp, User } from 'lucide-react'

interface AnswerCardProps {
  answer: {
    id: string
    body: string
    is_accepted: boolean
    upvotes: number
    created_at: string
    attorney: {
      name: string
      slug: string | null
      photo_url: string | null
      trust_score: number | null
    } | null
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        answer.is_accepted
          ? 'border-green-300 ring-1 ring-green-100'
          : 'border-gray-200'
      }`}
    >
      {answer.is_accepted && (
        <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium mb-3">
          <CheckCircle className="w-4 h-4" />
          Accepted Answer
        </div>
      )}

      <div className="prose prose-gray max-w-none text-gray-800 whitespace-pre-wrap">
        {answer.body}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
        {/* Attorney info */}
        <div className="flex items-center gap-3">
          {answer.attorney?.photo_url ? (
            <Image
              src={answer.attorney.photo_url}
              alt={answer.attorney.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          )}
          <div>
            {answer.attorney?.slug ? (
              <Link
                href={`/attorneys/${answer.attorney.slug}`}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {answer.attorney.name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                {answer.attorney?.name || 'Attorney'}
              </span>
            )}
            {answer.attorney?.trust_score != null && (
              <span className="ml-2 text-xs text-gray-500">
                Trust Score: {answer.attorney.trust_score}%
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            {answer.upvotes}
          </span>
          <span>{formatRelativeDate(answer.created_at)}</span>
        </div>
      </div>
    </div>
  )
}
