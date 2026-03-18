import Link from 'next/link'
import { MessageSquare, ThumbsUp, Clock, MapPin } from 'lucide-react'

interface QuestionCardProps {
  question: {
    id: string
    slug: string
    title: string
    body: string
    state_code: string | null
    city: string | null
    asked_by_name: string | null
    status: string
    view_count: number
    answer_count: number
    vote_count?: number
    specialty_name?: string | null
    created_at: string
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  answered: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const snippet = question.body.length > 160
    ? question.body.slice(0, 160) + '...'
    : question.body

  return (
    <Link
      href={`/ask/${question.slug}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
          {question.title}
        </h3>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[question.status] || STATUS_STYLES.open}`}>
          {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{snippet}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        {question.specialty_name && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
            {question.specialty_name}
          </span>
        )}

        <span>{question.asked_by_name || 'Anonymous'}</span>

        {question.state_code && (
          <span className="flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {question.city ? `${question.city}, ` : ''}{question.state_code}
          </span>
        )}

        <span className="flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {formatRelativeDate(question.created_at)}
        </span>

        <span className="ml-auto flex items-center gap-3">
          {(question.vote_count ?? 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              {question.vote_count}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {question.answer_count} {question.answer_count === 1 ? 'answer' : 'answers'}
          </span>
        </span>
      </div>
    </Link>
  )
}
