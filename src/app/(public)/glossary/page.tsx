import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { glossaryTerms, glossaryCategories } from '@/lib/data/glossary'
import { REVALIDATE } from '@/lib/cache'
import {
  BookOpen,
  Search,
  ArrowRight,
  Layers,
  Wrench,
  Droplets,
  Zap,
  Thermometer,
  DoorOpen,
  PaintBucket,
  Scale,
} from 'lucide-react'

const PAGE_URL = `${SITE_URL}/glossary`

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: 'Legal Glossary — 150+ Terms Explained Simply',
  description:
    'Complete legal glossary: 150+ legal and technical terms explained in plain English for clients. Practice areas, procedures, contracts, litigation, and more.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Legal Glossary — 150+ Terms Explained',
    description:
      "All legal terms explained in plain English. Understand your attorney's language and make informed decisions about your case.",
    url: PAGE_URL,
    type: 'website',
    siteName: SITE_NAME,
  },
}

const breadcrumbItems = [{ label: 'Legal Glossary' }]

const categoryIcons: Record<string, typeof Layers> = {
  'Civil Litigation': Layers,
  'Criminal Law': Wrench,
  'Family Law': Droplets,
  'Corporate Law': Zap,
  'Real Estate & Property': Thermometer,
  'Employment Law': DoorOpen,
  Immigration: PaintBucket,
  'Administrative & Regulatory': Scale,
}

const categoryColors: Record<string, { bg: string; text: string; border: string; light: string }> =
  {
    'Civil Litigation': {
      bg: 'bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-200',
      light: 'bg-stone-50',
    },
    'Criminal Law': {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      light: 'bg-amber-50',
    },
    'Family Law': {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      light: 'bg-blue-50',
    },
    'Corporate Law': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      light: 'bg-yellow-50',
    },
    'Real Estate & Property': {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-200',
      light: 'bg-green-50',
    },
    'Employment Law': {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
      light: 'bg-orange-50',
    },
    Immigration: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      light: 'bg-purple-50',
    },
    'Administrative & Regulatory': {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      light: 'bg-red-50',
    },
  }

// Build alphabetical index
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const termsFirstLetters = new Set(
  glossaryTerms.map((t) =>
    t.term
      .charAt(0)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
  )
)

export default function GlossaryPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Legal Glossary',
      },
    ],
  }

  const definedTermSetSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Legal Glossary',
    description:
      'Complete glossary of legal terms and procedures for clients and the general public.',
    url: PAGE_URL,
    hasDefinedTerm: glossaryTerms.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.term,
      description: t.definition,
      inDefinedTermSet: PAGE_URL,
    })),
  }

  // Group terms by category
  const termsByCategory = glossaryCategories.map((cat) => ({
    category: cat,
    terms: glossaryTerms.filter((t) => t.category === cat),
  }))

  // Group terms by first letter (normalized)
  const termsByLetter = alphabet.reduce(
    (acc, letter) => {
      const matching = glossaryTerms.filter(
        (t) =>
          t.term
            .charAt(0)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase() === letter
      )
      if (matching.length > 0) {
        acc[letter] = matching.sort((a, b) => a.term.localeCompare(b.term, 'en'))
      }
      return acc
    },
    {} as Record<string, typeof glossaryTerms>
  )

  return (
    <>
      <JsonLd data={[breadcrumbSchema, definedTermSetSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-white">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-12 text-center md:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
            <BookOpen className="h-4 w-4" />
            Legal reference
          </div>
          <h1 className="mb-6 font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
            {'Legal Glossary — 150+ Terms Explained'}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
            {
              "Don't understand a term in your legal documents? This glossary explains all the technical legal terminology in plain English."
            }
          </p>

          {/* Stats */}
          <div className="mt-10 flex flex-wrap justify-center gap-6">
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
              <div className="text-2xl font-extrabold text-blue-600">{glossaryTerms.length}</div>
              <div className="text-sm text-gray-500">terms defined</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
              <div className="text-2xl font-extrabold text-blue-600">
                {glossaryCategories.length}
              </div>
              <div className="text-sm text-gray-500">categories</div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-sm">
              <div className="text-2xl font-extrabold text-blue-600">100%</div>
              <div className="text-sm text-gray-500">free</div>
            </div>
          </div>
        </section>

        {/* Alphabetical index */}
        <section className="mx-auto max-w-6xl px-4 pb-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <Search className="h-4 w-4" />
              Alphabetical index
            </h2>
            <div className="flex flex-wrap gap-2">
              {alphabet.map((letter) => {
                const hasTerms = termsFirstLetters.has(letter)
                return hasTerms ? (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    {letter}
                  </a>
                ) : (
                  <span
                    key={letter}
                    className="flex h-9 w-9 cursor-default items-center justify-center rounded-lg bg-gray-50 text-sm font-bold text-gray-300"
                  >
                    {letter}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* Category navigation */}
        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
            Browse by category
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {termsByCategory.map(({ category, terms }) => {
              const Icon = categoryIcons[category] || Layers
              const colors = categoryColors[category] || categoryColors['Civil Litigation']
              return (
                <a
                  key={category}
                  href={`#category-${category
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')}`}
                  className={`flex items-center gap-3 ${colors.light} rounded-xl border ${colors.border} group p-4 transition-all hover:shadow-md`}
                >
                  <div
                    className={`h-10 w-10 ${colors.bg} flex items-center justify-center rounded-lg`}
                  >
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                      {category}
                    </div>
                    <div className="text-xs text-gray-500">{terms.length} terms</div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* Terms by category */}
        {termsByCategory.map(({ category, terms }) => {
          const Icon = categoryIcons[category] || Layers
          const colors = categoryColors[category] || categoryColors['Civil Litigation']
          const catId = category
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
          return (
            <section
              key={category}
              id={`category-${catId}`}
              className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10"
            >
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`h-12 w-12 ${colors.bg} flex items-center justify-center rounded-xl`}
                >
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-3xl">
                    {category}
                  </h2>
                  <p className="text-sm text-gray-500">{terms.length} terms</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {terms
                  .sort((a, b) => a.term.localeCompare(b.term, 'en'))
                  .map((t) => (
                    <div
                      key={t.slug}
                      id={`term-${t.slug}`}
                      className="scroll-mt-20 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <h3 className="mb-2 text-lg font-bold text-gray-900">{t.term}</h3>
                      <p className="text-sm leading-relaxed text-gray-600">{t.definition}</p>
                      {t.relatedService && (
                        <Link
                          href={`/practice-areas/${t.relatedService}`}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
                        >
                          Find an attorney
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )
        })}

        {/* Alphabetical listing */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
            All terms from A to Z
          </h2>
          <div className="space-y-10">
            {Object.entries(termsByLetter).map(([letter, terms]) => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-20">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-extrabold text-white">
                    {letter}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {terms.map((t) => (
                    <a
                      key={t.slug}
                      href={`#term-${t.slug}`}
                      className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm transition-all hover:border-blue-200 hover:bg-blue-50"
                    >
                      <span className="font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                        {t.term}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">{t.category}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
            Additional resources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/guides/certified-attorney"
              className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 transition-colors group-hover:bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700">
                  Attorney verification guide
                </span>
                <p className="text-xs text-gray-500">Certifications and credentials</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400 transition-colors group-hover:text-green-600" />
            </Link>
            <Link
              href="/guides"
              className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  Legal guides
                </span>
                <p className="text-xs text-gray-500">Practical resources for clients</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600" />
            </Link>
            <Link
              href="/faq"
              className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 transition-colors group-hover:bg-amber-100">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-amber-700">
                  FAQ
                </span>
                <p className="text-xs text-gray-500">Frequently asked questions</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400 transition-colors group-hover:text-amber-600" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white md:p-12">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              {'Need an attorney for your case?'}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
              {
                'Now that you understand the terminology, find a qualified professional near you and request a free consultation.'
              }
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/practice-areas"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-blue-700 transition-colors hover:bg-blue-50"
              >
                <Search className="h-5 w-5" />
                Find an attorney
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400 bg-blue-500 px-8 py-3.5 font-bold text-white transition-colors hover:bg-blue-400"
              >
                Request a free consultation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
