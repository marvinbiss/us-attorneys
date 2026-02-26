import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Shield, Wrench, Euro, AlertTriangle, Scale, ChevronRight, HelpCircle } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo/config'
import { getBreadcrumbSchema, getCollectionPageSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { guides, getGuidesByCategory } from '@/lib/data/guides'

export const revalidate = 86400

const categoryMeta: Record<string, { label: string; icon: typeof BookOpen; color: string; bgColor: string; borderColor: string; description: string }> = {
  choisir: { label: 'Choisir son artisan', icon: Wrench, color: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-200', description: 'Guides pour sélectionner un artisan qualifié et éviter les arnaques.' },
  entretien: { label: 'Entretien', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200', description: 'Conseils d\'entretien pour prolonger la durée de vie de vos équipements.' },
  reglementation: { label: 'Réglementation', icon: Scale, color: 'text-violet-600', bgColor: 'bg-violet-100', borderColor: 'border-violet-200', description: 'Normes, obligations légales et diagnostics pour votre logement.' },
  economiser: { label: 'Économiser', icon: Euro, color: 'text-amber-600', bgColor: 'bg-amber-100', borderColor: 'border-amber-200', description: 'Astuces et aides financières pour réduire le coût de vos travaux.' },
  urgence: { label: 'Urgences', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', description: 'Les bons réflexes en cas d\'urgence : fuite, panne, effraction.' },
}

const categories = ['choisir', 'entretien', 'reglementation', 'economiser', 'urgence'] as const

const hubFaq = [
  { question: 'Les guides sont-ils gratuits ?', answer: 'Oui, tous nos guides sont entièrement gratuits et accessibles sans inscription. Ils sont rédigés par des professionnels du bâtiment et mis à jour régulièrement.' },
  { question: 'Les tarifs indiqués sont-ils fiables ?', answer: 'Les tarifs mentionnés dans nos guides sont des moyennes nationales basées sur les données du marché en 2026. Ils peuvent varier selon votre région, la complexité des travaux et la période de l\'année.' },
  { question: 'Comment choisir un artisan de confiance ?', answer: 'Vérifiez le SIRET, l\'assurance décennale et les avis clients. Demandez au moins 3 devis et comparez les prestations. Nos guides détaillent les vérifications à effectuer pour chaque corps de métier.' },
  { question: 'Les aides à la rénovation sont-elles cumulables ?', answer: 'Oui, MaPrimeRénov\', les CEE et l\'éco-PTZ sont cumulables. Le cumul ne peut pas dépasser 90 % du coût des travaux. Consultez notre guide dédié aux aides pour optimiser votre financement.' },
  { question: 'Que faire en cas d\'urgence ?', answer: 'En cas de fuite d\'eau, coupez l\'arrivée d\'eau. En cas de panne électrique, coupez le disjoncteur. Consultez nos guides d\'urgence pour les gestes de premier secours et les contacts utiles.' },
]

export const metadata: Metadata = {
  title: 'Guides Travaux et Rénovation',
  description: 'Guides complets pour vos travaux : choisir un artisan, entretien, réglementation, économies et urgences. Conseils d\'experts, tarifs et aides financières.',
  alternates: { canonical: `${SITE_URL}/guides` },
  openGraph: {
    locale: 'fr_FR',
    title: 'Guides Travaux et Rénovation',
    description: `${guides.length} guides pratiques pour vos travaux : artisans, entretien, normes, économies et urgences.`,
    type: 'website',
    url: `${SITE_URL}/guides`,
  },
}

export default function GuidesHubPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Guides', url: '/guides' },
  ])

  const collectionSchema = getCollectionPageSchema({
    name: 'Guides pratiques — Travaux et rénovation',
    description: `${guides.length} guides pratiques pour vos travaux : choisir un artisan, entretien, réglementation, économies et urgences.`,
    url: '/guides',
    itemCount: guides.length,
  })

  const faqSchema = getFAQSchema(hubFaq)

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[breadcrumbSchema, collectionSchema, faqSchema]} />

      {/* ─── DARK HERO ──────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,70,229,0.20) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(99,102,241,0.12) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-28 md:pt-14 md:pb-36">
          <div className="mb-10">
            <Breadcrumb
              items={[{ label: 'Guides' }]}
              className="text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
            />
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/15 backdrop-blur-sm rounded-full border border-indigo-400/25 mb-5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-200">{guides.length} guides</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[-0.025em] leading-[1.1] mb-5">
              Guides pratiques — Tout savoir sur les travaux
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              Conseils d&apos;experts, tarifs détaillés, aides financières et gestes d&apos;urgence. Tout ce qu&apos;il faut savoir avant de lancer vos travaux.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ─── CATEGORY SECTIONS ────────────────────────────── */}
        {categories.map((cat) => {
          const meta = categoryMeta[cat]
          const catGuides = getGuidesByCategory(cat)
          const Icon = meta.icon
          return (
            <section key={cat} className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-10 h-10 ${meta.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
                    {meta.label}
                  </h2>
                  <p className="text-sm text-slate-500">{meta.description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {catGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${meta.bgColor} ${meta.color} rounded-full text-xs font-semibold`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="font-heading text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-2 leading-tight">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {guide.metaDescription}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {guide.relatedServices.slice(0, 3).map((svc) => (
                        <span key={svc} className="text-xs bg-gray-50 text-slate-500 px-2 py-0.5 rounded-full">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {/* ─── FAQ ──────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 tracking-tight">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-4">
            {hubFaq.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="relative bg-[#0a0f1e] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(79,70,229,0.12) 0%, transparent 60%)',
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
            Prêt à lancer vos travaux ?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Recevez jusqu&apos;à 3 devis gratuits de professionnels qualifiés.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/devis" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:-translate-y-0.5 transition-all duration-300">
              Demander un devis gratuit
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors">
              Voir les services <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SEO INTERNAL LINKS ───────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-8 tracking-tight">
            Voir aussi
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Services populaires</h3>
              <div className="space-y-2">
                {['plombier', 'electricien', 'serrurier', 'chauffagiste', 'couvreur', 'peintre-en-batiment'].map((s) => (
                  <Link key={s} href={`/services/${s}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors capitalize">
                    <ChevronRight className="w-3 h-3" />
                    {s.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Devis gratuits</h3>
              <div className="space-y-2">
                {['plombier', 'electricien', 'serrurier', 'chauffagiste', 'couvreur'].map((s) => (
                  <Link key={s} href={`/devis/${s}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors capitalize">
                    <ChevronRight className="w-3 h-3" />
                    Devis {s.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Navigation</h3>
              <div className="space-y-2">
                <Link href="/departements" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Départements
                </Link>
                <Link href="/regions" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Régions
                </Link>
                <Link href="/villes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Villes
                </Link>
                <Link href="/comment-ca-marche" className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 py-2 transition-colors">
                  <ChevronRight className="w-3 h-3" />Comment ça marche
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
