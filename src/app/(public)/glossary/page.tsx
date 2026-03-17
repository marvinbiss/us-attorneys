import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { glossaryTerms, glossaryCategories } from '@/lib/data/glossary'
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

export const revalidate = 86400 // CDN cache: 24 h (ISR)

export const metadata: Metadata = {
  title: 'Legal Glossary — 150+ Terms Explained Simply',
  description:
    'Complete legal glossary: 150+ legal and technical terms explained in plain English for clients. Practice areas, procedures, contracts, litigation, and more.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Legal Glossary — 150+ Terms Explained',
    description:
      'All legal terms explained in plain English. Understand your attorney\'s language and make informed decisions about your case.',
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
  'Immigration': PaintBucket,
  'Administrative & Regulatory': Scale,
}

const categoryColors: Record<string, { bg: string; text: string; border: string; light: string }> = {
  'Civil Litigation': { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', light: 'bg-stone-50' },
  'Criminal Law': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50' },
  'Family Law': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50' },
  'Corporate Law': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', light: 'bg-yellow-50' },
  'Real Estate & Property': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', light: 'bg-green-50' },
  'Employment Law': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', light: 'bg-orange-50' },
  'Immigration': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', light: 'bg-purple-50' },
  'Administrative & Regulatory': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', light: 'bg-red-50' },
}

// Build alphabetical index
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const termsFirstLetters = new Set(
  glossaryTerms.map((t) => t.term.charAt(0).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase())
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
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Legal reference
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {'Legal Glossary — 150+ Terms Explained'}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {
              'Don\'t understand a term in your legal documents? This glossary explains all the technical legal terminology in plain English.'
            }
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
              <div className="text-2xl font-extrabold text-blue-600">{glossaryTerms.length}</div>
              <div className="text-sm text-gray-500">terms defined</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
              <div className="text-2xl font-extrabold text-blue-600">{glossaryCategories.length}</div>
              <div className="text-sm text-gray-500">categories</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4">
              <div className="text-2xl font-extrabold text-blue-600">100%</div>
              <div className="text-sm text-gray-500">free</div>
            </div>
          </div>
        </section>

        {/* Alphabetical index */}
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Alphabetical index
            </h2>
            <div className="flex flex-wrap gap-2">
              {alphabet.map((letter) => {
                const hasTerms = termsFirstLetters.has(letter)
                return hasTerms ? (
                  <a
                    key={letter}
                    href={`#lettre-${letter}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-colors"
                  >
                    {letter}
                  </a>
                ) : (
                  <span
                    key={letter}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 text-gray-300 font-bold text-sm cursor-default"
                  >
                    {letter}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* Category navigation */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Browse by category
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {termsByCategory.map(({ category, terms }) => {
              const Icon = categoryIcons[category] || Layers
              const colors = categoryColors[category] || categoryColors['Civil Litigation']
              return (
                <a
                  key={category}
                  href={`#cat-${category.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`}
                  className={`flex items-center gap-3 ${colors.light} rounded-xl border ${colors.border} p-4 hover:shadow-md transition-all group`}
                >
                  <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
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
          const catId = category.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
          return (
            <section
              key={category}
              id={`cat-${catId}`}
              className="max-w-6xl mx-auto px-4 py-10 scroll-mt-20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">
                    {category}
                  </h2>
                  <p className="text-sm text-gray-500">{terms.length} terms</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {terms
                  .sort((a, b) => a.term.localeCompare(b.term, 'en'))
                  .map((t) => (
                    <div
                      key={t.slug}
                      id={`terme-${t.slug}`}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow scroll-mt-20"
                    >
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{t.term}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">{t.definition}</p>
                      {t.relatedService && (
                        <Link
                          href={`/practice-areas/${t.relatedService}`}
                          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Find an attorney
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )
        })}

        {/* Alphabetical listing */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 font-heading">
            All terms from A to Z
          </h2>
          <div className="space-y-10">
            {Object.entries(termsByLetter).map(([letter, terms]) => (
              <div key={letter} id={`lettre-${letter}`} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white font-extrabold rounded-lg text-lg">
                    {letter}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {terms.map((t) => (
                    <a
                      key={t.slug}
                      href={`#terme-${t.slug}`}
                      className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-4 py-3 hover:border-blue-200 hover:bg-blue-50 transition-all text-sm group"
                    >
                      <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {t.term}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{t.category}</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Additional resources
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              href="/guides/certified-attorney"
              className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors text-sm">
                  Attorney verification guide
                </span>
                <p className="text-xs text-gray-500">Certifications and credentials</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
            </Link>
            <Link
              href="/guides"
              className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                  Legal guides
                </span>
                <p className="text-xs text-gray-500">Practical resources for clients</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
            </Link>
            <Link
              href="/faq"
              className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-amber-700 transition-colors text-sm">
                  FAQ
                </span>
                <p className="text-xs text-gray-500">Frequently asked questions</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-amber-600 transition-colors" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {'Need an attorney for your case?'}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {
                'Now that you understand the terminology, find a qualified professional near you and request a free consultation.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                Find an attorney
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
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
