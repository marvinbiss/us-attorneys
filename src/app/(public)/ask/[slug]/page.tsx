import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ArrowLeft, User, Clock, MapPin, Eye, ThumbsUp } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
// SECURITY: createAdminClient used for read-only SSR query — bypasses RLS safely
import { createAdminClient } from '@/lib/supabase/admin'
import AnswerCard from '@/components/qa/AnswerCard'

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
  vote_count: number
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

async function getQuestion(
  slug: string
): Promise<(QuestionRow & { specialty_name: string | null }) | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('legal_questions')
      .select('*')
      .eq('slug', slug)
      .neq('status', 'flagged')
      .single()

    if (!data) return null

    let specialtyName: string | null = null
    if (data.specialty_id) {
      const { data: spec } = await supabase
        .from('specialties')
        .select('name')
        .eq('id', data.specialty_id)
        .single()
      specialtyName = spec?.name || null
    }

    // SECURITY: view_count increment moved to createClient() — createAdminClient must NOT write in public pages
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const rlsClient = await createClient()
      rlsClient
        .from('legal_questions')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id)
        .then(() => {})
    } catch {
      // fire-and-forget — view count is non-critical
    }

    return { ...(data as QuestionRow), specialty_name: specialtyName }
  } catch {
    return null
  }
}

async function getAnswers(
  questionId: string
): Promise<(AnswerRow & { attorney: AttorneyInfo | null })[]> {
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

    const attorneyIds = answers.map((a) => a.attorney_id).filter((id): id is string => id !== null)

    let attorneyMap: Record<string, AttorneyInfo> = {}
    if (attorneyIds.length > 0) {
      const { data: attorneys } = await supabase
        .from('attorneys')
        .select('id, name, slug, photo_url, trust_score')
        .in('id', attorneyIds)

      if (attorneys) {
        attorneyMap = Object.fromEntries(
          attorneys.map((a) => [
            a.id,
            {
              name: a.name || 'Attorney',
              slug: a.slug,
              photo_url: a.photo_url,
              trust_score: a.trust_score,
            },
          ])
        )
      }
    }

    return answers.map((a) => ({
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

  const description =
    question.body.length > 155 ? question.body.slice(0, 155) + '...' : question.body

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
      images: [
        { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: question.title },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: question.title,
      description,
    },
    other: {
      ...(question.state_code ? { 'geo.region': question.state_code } : {}),
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

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params
  const question = await getQuestion(slug)

  if (!question) {
    notFound()
  }

  const answers = await getAnswers(question.id)
  const acceptedAnswer = answers.find((a) => a.is_accepted)

  // JSON-LD QAPage schema for rich snippets
  const qaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question.title,
      text: question.body,
      dateCreated: question.created_at,
      answerCount: answers.length,
      upvoteCount: question.vote_count || 0,
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
              .filter((a) => !a.is_accepted)
              .map((a) => ({
                '@type': 'Answer',
                text: a.body,
                dateCreated: a.created_at,
                upvoteCount: a.upvotes,
                ...(a.attorney
                  ? {
                      author: {
                        '@type': 'Person',
                        name: a.attorney.name,
                        ...(a.attorney.slug
                          ? { url: `${SITE_URL}/attorneys/${a.attorney.slug}` }
                          : {}),
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
      <section className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[{ label: 'Ask a Lawyer', href: '/ask' }, { label: question.title }]}
            className="mb-4"
          />

          <h1 className="font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            {question.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {question.asked_by_name || 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDate(question.created_at)}
            </span>
            {question.state_code && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {question.city ? `${question.city}, ` : ''}
                {question.state_code}
              </span>
            )}
            {question.specialty_name && (
              <span className="inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {question.specialty_name}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                question.status === 'answered'
                  ? 'bg-green-100 text-green-800'
                  : question.status === 'open'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Question Body */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-800">
            {question.body}
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {question.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {question.vote_count || 0} votes
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {question.answer_count} {question.answer_count === 1 ? 'answer' : 'answers'}
            </span>
          </div>
        </div>

        {/* Answers */}
        <div className="mb-8">
          <h2 className="mb-4 font-heading text-xl font-bold text-gray-900">
            {answers.length === 0
              ? 'No answers yet'
              : `${answers.length} ${answers.length === 1 ? 'Answer' : 'Answers'}`}
          </h2>

          {answers.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
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
                <AnswerCard key={answer.id} answer={answer} />
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <Link
          href="/ask"
          className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all questions
        </Link>

        {/* Disclaimer */}
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Legal Disclaimer:</strong> The information provided on this page does not
          constitute legal advice. Answers are provided by attorneys for informational purposes
          only. For advice specific to your situation, please consult directly with a licensed
          attorney.
        </div>
      </div>
    </div>
  )
}
