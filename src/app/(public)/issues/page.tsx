import { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Search, ArrowRight, CheckCircle, ChevronDown, Shield, Clock, Wrench, Zap, Key, Flame, HardHat } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getFAQSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import problems from '@/lib/data/problems'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Problèmes Courants — Solutions',
  description: 'Identifiez votre problème (fuite d’eau, panne électrique, serrure bloquée…) et trouvez la solution adaptée. Diagnostic gratuit, conseils pratiques et mise en relation avec des artisans référencés.',
  alternates: { canonical: `${SITE_URL}/issues` },
  openGraph: {
    locale: 'fr_FR',
    title: 'Problèmes Courants — Solutions',
    description: 'Identifiez votre problème et trouvez la solution adaptée. Diagnostic gratuit, conseils pratiques et artisans référencés.',
    url: `${SITE_URL}/issues`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Problèmes courants' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Problèmes Courants — Solutions',
    description: 'Identifiez votre problème et trouvez la solution adaptée avec nos artisans référencés.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

const urgencyConfig = {
  haute: { label: 'Urgence haute', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  moyenne: { label: 'Urgence moyenne', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  basse: { label: 'Non urgent', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
}

const serviceCategories = [
  { name: 'Plomberie', slug: 'plombier', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Électricité', slug: 'electricien', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Serrurerie', slug: 'serrurier', icon: Key, color: 'text-green-600', bg: 'bg-green-50' },
  { name: 'Chauffage', slug: 'chauffagiste', icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
  { name: 'Toiture', slug: 'couvreur', icon: HardHat, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { name: 'Maçonnerie', slug: 'macon', icon: HardHat, color: 'text-gray-600', bg: 'bg-gray-100' },
  { name: 'Autres', slug: '_other', icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const otherServiceSlugs = ['peintre-en-batiment', 'vitrier', 'menuisier', 'isolation-thermique', 'desinsectisation']

function getProblemsByCategory(slug: string) {
  if (slug === '_other') {
    return problems.filter((p) => otherServiceSlugs.includes(p.primaryService))
  }
  return problems.filter((p) => p.primaryService === slug)
}

const specialtyNameMap: Record<string, string> = {
  plombier: 'Plombier',
  electricien: 'Électricien',
  serrurier: 'Serrurier',
  chauffagiste: 'Chauffagiste',
  couvreur: 'Couvreur',
  macon: 'Maçon',
  'peintre-en-batiment': 'Peintre en bâtiment',
  vitrier: 'Vitrier',
  menuisier: 'Menuisier',
  'isolation-thermique': 'Isolation thermique',
  desinsectisation: 'Désinsectisation',
}

const howSteps = [
  {
    step: 1,
    icon: Search,
    title: 'Identifiez votre problème',
    description: 'Parcourez notre liste de problèmes courants ou décrivez votre situation pour trouver le diagnostic adapté.',
  },
  {
    step: 2,
    icon: CheckCircle,
    title: 'Suivez nos conseils',
    description: 'Consultez les gestes d’urgence, les symptômes à surveiller et les actions à mener en attendant l’artisan.',
  },
  {
    step: 3,
    icon: Wrench,
    title: 'Contactez un artisan',
    description: 'Demandez un devis gratuit auprès d’artisans référencés spécialisés dans votre type de problème.',
  },
]

const faqItems = [
  {
    question: 'Comment identifier le type de problème que j’ai ?',
    answer: 'Parcourez notre liste de problèmes classés par catégorie (plomberie, électricité, serrurerie…). Chaque fiche détaille les symptômes typiques pour vous aider à identifier votre situation. En cas de doute, contactez un artisan pour un diagnostic professionnel.',
  },
  {
    question: 'Que faire en attendant l’artisan ?',
    answer: 'Chaque fiche problème liste les gestes d’urgence à réaliser immédiatement : couper l’eau, l’électricité ou le gaz si nécessaire, sécuriser la zone et protéger vos biens. Ces actions simples limitent les dégâts en attendant l’intervention.',
  },
  {
    question: 'Les diagnostics sont-ils gratuits ?',
    answer: 'Les fiches de diagnostic sur ServicesArtisans sont entièrement gratuites. La demande de devis est également gratuite et sans engagement. Seule l’intervention de l’artisan est payante, après acceptation de votre part.',
  },
  {
    question: 'Comment trouver un artisan pour mon problème ?',
    answer: 'Depuis chaque fiche problème, vous pouvez accéder directement à la page du service concerné et demander un devis gratuit. Nos artisans sont référencés par SIREN et leurs coordonnées sont vérifiées.',
  },
  {
    question: 'Les coûts indiqués sont-ils fiables ?',
    answer: 'Les fourchettes de prix sont des estimations indicatives basées sur les tarifs constatés en France. Le coût réel dépend de la complexité du problème, de votre région et de l’urgence. Seul un devis personnalisé fait foi.',
  },
]

export default function ProblemesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={[
        getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Problèmes courants', url: '/issues' },
        ]),
        getFAQSchema(faqItems.map((item) => ({ question: item.question, answer: item.answer }))),
      ]} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[{ label: 'Problèmes courants' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(239,68,68,0.1) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-16 md:pb-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-full mb-6">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-200">30 problèmes documentés</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-[-0.025em] leading-[1.1]">
              Problèmes courants{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-300">
                Diagnostic et solutions
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Identifiez votre problème, suivez nos conseils d&apos;urgence et trouvez un artisan référencé
              pour intervenir rapidement. Fiches complètes avec symptômes, coûts et prévention.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/80">Artisans référencés</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/80">Conseils immédiats</span>
              </div>
              <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/80">Devis gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems by category */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Par catégorie</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Trouvez votre problème
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Sélectionnez la catégorie correspondante pour accéder au diagnostic détaillé et aux solutions.
            </p>
          </div>

          <div className="space-y-12">
            {serviceCategories.map((category) => {
              const categoryProblems = getProblemsByCategory(category.slug)
              if (categoryProblems.length === 0) return null
              const Icon = category.icon
              return (
                <div key={category.slug}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 ${category.bg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                    <span className="text-sm text-gray-400">({categoryProblems.length} problème{categoryProblems.length > 1 ? 's' : ''})</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProblems.map((problem) => {
                      const urgency = urgencyConfig[problem.urgencyLevel]
                      return (
                        <Link
                          key={problem.slug}
                          href={`/issues/${problem.slug}`}
                          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                              {problem.name}
                            </h4>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${urgency.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`} />
                              {urgency.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{problem.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {problem.estimatedCost.min} – {problem.estimatedCost.max} €
                            </span>
                            <span className="text-xs text-gray-400">
                              {specialtyNameMap[problem.primaryService] || problem.primaryService}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Simple et rapide</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              Trois étapes pour diagnostiquer votre problème et trouver un artisan.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-14 left-[20%] right-[20%]">
              <div className="h-px border-t-2 border-dashed border-gray-200" />
            </div>
            {howSteps.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-slate-700">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Questions fréquentes
            </h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left hover:bg-gray-100 transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-amber-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Besoin d&apos;un artisan ?
          </h2>
          <p className="text-xl text-amber-100/90 mb-8 max-w-2xl mx-auto">
            Demandez un devis gratuit et recevez jusqu&apos;à 3 propositions d&apos;artisans référencés dans votre région.
          </p>
          <Link
            href="/quotes"
            className="inline-flex items-center gap-3 bg-white text-amber-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Demander un devis gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Voir aussi */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Voir aussi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Services d&apos;urgence</h3>
              <div className="space-y-2">
                <Link href="/emergency" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Urgence artisan 24h/24</Link>
                <Link href="/emergency/plombier" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Plombier urgence</Link>
                <Link href="/emergency/electricien" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Électricien urgence</Link>
                <Link href="/emergency/serrurier" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Serrurier urgence</Link>
                <Link href="/emergency/chauffagiste" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Chauffagiste urgence</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Devis par métier</h3>
              <div className="space-y-2">
                <Link href="/quotes/plombier" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Devis plombier</Link>
                <Link href="/quotes/electricien" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Devis électricien</Link>
                <Link href="/quotes/serrurier" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Devis serrurier</Link>
                <Link href="/quotes/chauffagiste" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Devis chauffagiste</Link>
                <Link href="/quotes/couvreur" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Devis couvreur</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Informations utiles</h3>
              <div className="space-y-2">
                <Link href="/how-it-works" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Comment ça marche</Link>
                <Link href="/pricing" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Guide des tarifs</Link>
                <Link href="/tools/diagnostic" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Diagnostic en ligne</Link>
                <Link href="/faq" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">FAQ</Link>
                <Link href="/verification-process" className="block text-sm text-gray-600 hover:text-amber-600 py-1 transition-colors">Processus de vérification</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial credibility */}
      <section className="mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Information importante</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Les coûts et délais indiqués sont des estimations moyennes constatées en France métropolitaine. Ils varient selon la complexité du problème, votre région et l&apos;urgence. Seul un devis personnalisé fait foi. ServicesArtisans est un annuaire indépendant — nous mettons en relation mais ne réalisons pas les interventions. En cas d&apos;urgence vitale, appelez le 18 (pompiers) ou le 112.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
