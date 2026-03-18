import { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, ArrowRight, Search } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { createAdminClient } from '@/lib/supabase/admin'
import QuestionCard from '@/components/qa/QuestionCard'

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
  vote_count: number
  is_featured: boolean
  created_at: string
  specialty_name: string | null
}

interface SpecialtyCount {
  name: string
  id: string
  count: number
}

async function getRecentQuestions(): Promise<Question[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('legal_questions')
      .select('id, slug, title, body, state_code, city, asked_by_name, status, view_count, answer_count, vote_count, is_featured, created_at, specialty_id')
      .neq('status', 'flagged')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!data || data.length === 0) return []

    // Enrich with specialty names
    const specialtyIds = Array.from(new Set(data.map(q => q.specialty_id).filter(Boolean)))
    let specialtyMap: Record<string, string> = {}
    if (specialtyIds.length > 0) {
      const { data: specs } = await supabase
        .from('specialties')
        .select('id, name')
        .in('id', specialtyIds as string[])
      if (specs) {
        specialtyMap = Object.fromEntries(specs.map(s => [s.id, s.name]))
      }
    }

    return data.map(q => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      body: q.body,
      state_code: q.state_code,
      city: q.city,
      asked_by_name: q.asked_by_name,
      status: q.status,
      view_count: q.view_count ?? 0,
      answer_count: q.answer_count ?? 0,
      vote_count: q.vote_count ?? 0,
      is_featured: q.is_featured ?? false,
      created_at: q.created_at,
      specialty_name: q.specialty_id ? specialtyMap[q.specialty_id] || null : null,
    }))
  } catch {
    return []
  }
}

async function getFeaturedQuestions(): Promise<Question[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('legal_questions')
      .select('id, slug, title, body, state_code, city, asked_by_name, status, view_count, answer_count, vote_count, is_featured, created_at, specialty_id')
      .eq('is_featured', true)
      .neq('status', 'flagged')
      .order('view_count', { ascending: false })
      .limit(5)

    if (!data || data.length === 0) return []

    const specialtyIds = Array.from(new Set(data.map(q => q.specialty_id).filter(Boolean)))
    let specialtyMap: Record<string, string> = {}
    if (specialtyIds.length > 0) {
      const { data: specs } = await supabase
        .from('specialties')
        .select('id, name')
        .in('id', specialtyIds as string[])
      if (specs) {
        specialtyMap = Object.fromEntries(specs.map(s => [s.id, s.name]))
      }
    }

    return data.map(q => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      body: q.body,
      state_code: q.state_code,
      city: q.city,
      asked_by_name: q.asked_by_name,
      status: q.status,
      view_count: q.view_count ?? 0,
      answer_count: q.answer_count ?? 0,
      vote_count: q.vote_count ?? 0,
      is_featured: q.is_featured ?? false,
      created_at: q.created_at,
      specialty_name: q.specialty_id ? specialtyMap[q.specialty_id] || null : null,
    }))
  } catch {
    return []
  }
}

async function getTopSpecialties(): Promise<SpecialtyCount[]> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('specialties')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .limit(20)

    return (data || []).map(s => ({ name: s.name, id: s.id, count: 0 }))
  } catch {
    return []
  }
}

async function getQuestionStats(): Promise<{ total: number; answered: number; attorneys: number }> {
  try {
    const supabase = createAdminClient()
    const [totalRes, answeredRes, attorneyRes] = await Promise.all([
      supabase.from('legal_questions').select('id', { count: 'exact', head: true }).neq('status', 'flagged'),
      supabase.from('legal_questions').select('id', { count: 'exact', head: true }).eq('status', 'answered'),
      supabase.from('legal_answers').select('attorney_id', { count: 'exact', head: true }),
    ])
    return {
      total: totalRes.count || 0,
      answered: answeredRes.count || 0,
      attorneys: attorneyRes.count || 0,
    }
  } catch {
    return { total: 0, answered: 0, attorneys: 0 }
  }
}

export default async function AskPage() {
  const [recentQuestions, featuredQuestions, specialties, stats] = await Promise.all([
    getRecentQuestions(),
    getFeaturedQuestions(),
    getTopSpecialties(),
    getQuestionStats(),
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/ask/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ask a Question
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ask#questions"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse Questions
            </Link>
          </div>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="mt-8 flex gap-8 text-sm">
              <div>
                <span className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</span>
                <p className="text-gray-500">Questions Asked</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-green-600">{stats.answered.toLocaleString()}</span>
                <p className="text-gray-500">Answered</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-600">{stats.attorneys.toLocaleString()}</span>
                <p className="text-gray-500">Attorney Answers</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Practice Area Filter */}
        {specialties.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Browse by Practice Area
            </h2>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <Link
                  key={s.id}
                  href={`/legal-questions/${s.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}

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

        {/* Questions List */}
        <section id="questions">
          <h2 className="font-heading text-xl font-bold text-gray-900 mb-4">
            Recent Questions
          </h2>

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
                href="/ask/new"
                className="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Ask the First Question
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* SEO Content */}
        <section className="mt-16 prose prose-gray max-w-none">
          <h2>How "Ask a Lawyer" Works</h2>
          <ol>
            <li><strong>Ask your question</strong> — Describe your legal situation with as much detail as possible. Select your state and practice area for more relevant answers.</li>
            <li><strong>Get attorney answers</strong> — Licensed attorneys from across the country review questions and provide free informational answers.</li>
            <li><strong>Find the right lawyer</strong> — If you need representation, connect directly with the attorney who answered your question.</li>
          </ol>
          <p>
            All answers on this platform are for informational purposes only and do not constitute legal advice or create an attorney-client relationship.
            For advice specific to your situation, consult directly with a licensed attorney.
          </p>
        </section>
      </div>
    </div>
  )
}
