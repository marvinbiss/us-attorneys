import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ThumbsUp, CheckCircle, ArrowLeft, User, Clock } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 3600

interface QuestionRow {
  id: string
  slug: string
  title: string
  body: string
  specialty_id: string | null
  state_code: string | null
  city: string | null
  asked_by_name: string | null
  status: string
  view_count: number
  answer_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

interface AnswerRow {
  id: string
  body: string
  is_accepted: boolean
  upvotes: number
  created_at: string
  attorney_id: string | null
}

interface AttorneyInfo {
  name: string
  slug: string | null
  photo_url: string | null
  trust_score: number | null
}

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getQuestion(slug: string): Promise<QuestionRow | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('legal_questions')
      .select('*')
      .eq('slug', slug)
      .neq('status', 'flagged')
      .single()

    return data as QuestionRow | null
  } catch {
    return null
  }
}

async function getAnswers(questionId: string): Promise<(AnswerRow & { attorney: AttorneyInfo | null })[]> {
  try {
    const supabase = createAdminClient()
    const { data: answers } = await supabase
      .from('legal_answers')
      .select('id, body, is_accepted, upvotes, created_at, attorney_id')
      .eq('question_id', questionId)
      .order('is_accepted', { ascending: false })
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true })

    if (!answers || answers.length === 0) return []

    const attorneyIds = answers
      .map(a => a.attorney_id)
      .filter((id): id is string => id !== null)

    let attorneyMap: Record<string, AttorneyInfo> = {}
    if (attorneyIds.length > 0) {
      const { data: attorneys } = await supabase
        .from('attorneys')
        .select('id, name, slug, photo_url, trust_score')
        .in('id', attorneyIds)

      if (attorneys) {
        attorneyMap = Object.fromEntries(
          attorneys.map(a => [a.id, {
            name: a.name || 'Attorney',
            slug: a.slug,
            photo_url: a.photo_url,
            trust_score: a.trust_score,
          }])
        )
      }
    }

    return answers.map(a => ({
      ...a,
      attorney: a.attorney_id ? attorneyMap[a.attorney_id] || null : null,
    }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const question = await getQuestion(slug)

  if (!question) {
    return { title: 'Question Not Found' }
  }

  const description = question.body.length > 155
    ? question.body.slice(0, 155) + '...'
    : question.body

  const location = question.city && question.state_code
    ? ` in ${question.city}, ${question.state_code}`
    : question.state_code
      ? ` in ${question.state_code}`
      : ''

  return {
    title: `${question.title} | Ask a Lawyer`,
    description,
    alternates: {
      canonical: `${SITE_URL}/ask/${slug}`,
    },
    openGraph: {
      title: question.title,
      description,
      url: `${SITE_URL}/ask/${slug}`,
      type: 'website',
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: question.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: question.title,
      description,
    },
    other: {
      ...(location ? { 'geo.region': question.state_code || '' } : {}),
    },
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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
  return formatDate(dateStr)
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params
  const question = await getQuestion(slug)

  if (!question) {
    notFound()
  }

  const answers = await getAnswers(question.id)

  const acceptedAnswer = answers.find(a => a.is_accepted)

  // JSON-LD QAPage schema
  const qaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question.title,
      text: question.body,
      dateCreated: question.created_at,
      answerCount: answers.length,
      ...(acceptedAnswer
        ? {
            acceptedAnswer: {
              '@type': 'Answer',
              text: acceptedAnswer.body,
              dateCreated: acceptedAnswer.created_at,
              upvoteCount: acceptedAnswer.upvotes,
              ...(acceptedAnswer.attorney
                ? {
                    author: {
                      '@type': 'Person',
                      name: acceptedAnswer.attorney.name,
                      ...(acceptedAnswer.attorney.slug
                        ? { url: `${SITE_URL}/attorneys/${acceptedAnswer.attorney.slug}` }
                        : {}),
                    },
                  }
                : {}),
            },
          }
        : {}),
      ...(answers.length > 0
        ? {
            suggestedAnswer: answers
              .filter(a => !a.is_accepted)
              .map(a => ({
                '@type': 'Answer',
                text: a.body,
                dateCreated: a.created_at,
                upvoteCount: a.upvotes,
                ...(a.attorney
                  ? {
                      author: {
                        '@type': 'Person',
                        name: a.attorney.name,
                      },
                    }
                  : {}),
              })),
          }
        : {}),
    },
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Ask a Lawyer', url: '/ask' },
    { name: question.title, url: `/ask/${slug}` },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[qaJsonLd, breadcrumbSchema]} />

      {/* Question Header */}
      <section className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Ask a Lawyer', href: '/ask' },
              { label: question.title },
            ]}
            className="mb-4"
          />

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900">
            {question.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {question.asked_by_name || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(question.created_at)}
            </span>
            {question.state_code && (
              <span>
                {question.city ? `${question.city}, ` : ''}{question.state_code}
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              question.status === 'answered'
                ? 'bg-green-100 text-green-800'
                : question.status === 'open'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Body */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="prose prose-gray max-w-none text-gray-800 whitespace-pre-wrap">
            {question.body}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
            <span>{question.view_count} views</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {question.answer_count} {question.answer_count === 1 ? 'answer' : 'answers'}
            </span>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-8">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
            {answers.length === 0
              ? 'No answers yet'
              : `${answers.length} ${answers.length === 1 ? 'Answer' : 'Answers'}`}
          </h2>

          {answers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                No attorney has answered this question yet. Are you a licensed attorney?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in to answer
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div
                  key={answer.id}
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
                        <img
                          src={answer.attorney.photo_url}
                          alt={answer.attorney.name}
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
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <Link
          href="/ask"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all questions
        </Link>

        {/* Disclaimer */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          <strong>Legal Disclaimer:</strong> The information provided on this page does not constitute legal advice.
          Answers are provided by attorneys for informational purposes only. For advice specific to your situation,
          please consult directly with a licensed attorney.
        </div>
      </div>
    </div>
  )
}
