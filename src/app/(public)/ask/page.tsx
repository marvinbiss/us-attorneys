import { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, ArrowRight, Filter } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Ask a Lawyer — Free Legal Q&A | ${SITE_NAME}`,
    description:
      'Get free answers to your legal questions from licensed attorneys. Browse thousands of answered questions on personal injury, criminal defense, family law, and more.',
    alternates: {
      canonical: `${SITE_URL}/ask`,
    },
    openGraph: {
      title: 'Ask a Lawyer — Free Legal Q&A',
      description:
        'Get free answers to your legal questions from licensed attorneys across all 50 states.',
      url: `${SITE_URL}/ask`,
      type: 'website',
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: `${SITE_NAME} — Ask a Lawyer` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Ask a Lawyer — Free Legal Q&A',
      description:
        'Get free answers to your legal questions from licensed attorneys across all 50 states.',
    },
  }
}

interface Question {
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
  is_featured: boolean
  created_at: string
}

async function getRecentQuestions(): Promise<Question[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('legal_questions')
      .select('id, slug, title, body, state_code, city, asked_by_name, status, view_count, answer_count, is_featured, created_at')
      .neq('status', 'flagged')
      .order('created_at', { ascending: false })
      .limit(20)

    return (data as Question[]) || []
  } catch {
    return []
  }
}

async function getFeaturedQuestions(): Promise<Question[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('legal_questions')
      .select('id, slug, title, body, state_code, city, asked_by_name, status, view_count, answer_count, is_featured, created_at')
      .eq('is_featured', true)
      .neq('status', 'flagged')
      .order('view_count', { ascending: false })
      .limit(5)

    return (data as Question[]) || []
  } catch {
    return []
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    answered: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.open}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function QuestionCard({ question }: { question: Question }) {
  const snippet = question.body.length > 150
    ? question.body.slice(0, 150) + '...'
    : question.body

  return (
    <Link
      href={`/ask/${question.slug}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-gray-900 leading-snug">
          {question.title}
        </h3>
        <StatusBadge status={question.status} />
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{snippet}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{question.asked_by_name || 'Anonymous'}</span>
        {question.state_code && (
          <span>{question.city ? `${question.city}, ` : ''}{question.state_code}</span>
        )}
        <span>{formatDate(question.created_at)}</span>
        <span className="ml-auto flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          {question.answer_count} {question.answer_count === 1 ? 'answer' : 'answers'}
        </span>
      </div>
    </Link>
  )
}

export default async function AskPage() {
  const [recentQuestions, featuredQuestions] = await Promise.all([
    getRecentQuestions(),
    getFeaturedQuestions(),
  ])

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Ask a Lawyer', url: '/ask' },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumb items={[{ label: 'Ask a Lawyer' }]} className="mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900">
            Ask a Lawyer
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl">
            Get free answers to your legal questions from licensed attorneys across all 50 states.
            Browse answered questions or ask your own.
          </p>
          <div className="mt-6">
            <Link
              href="/login?redirect=/ask"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ask a Question
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Featured Questions */}
        {featuredQuestions.length > 0 && (
          <section className="mb-10">
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
              Featured Questions
            </h2>
            <div className="space-y-3">
              {featuredQuestions.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          </section>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Recent Questions
          </h2>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>Filter by practice area or state coming soon</span>
          </div>
        </div>

        {/* Questions List */}
        {recentQuestions.length > 0 ? (
          <div className="space-y-3">
            {recentQuestions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No questions yet</h3>
            <p className="mt-2 text-gray-600">
              Be the first to ask a legal question and get a free answer from a licensed attorney.
            </p>
            <Link
              href="/login?redirect=/ask"
              className="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ask the First Question
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
