'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Search, HelpCircle, ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'
import { faqCategories } from '@/lib/data/faq-data'

export default function FAQPageClient() {
  const [openItems, setOpenItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredCategories = faqCategories.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[{ label: 'FAQ' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <div className="text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-60" />
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold mb-4 tracking-[-0.025em]">
              Questions fr&eacute;quentes
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Trouvez rapidement les r&eacute;ponses &agrave; vos questions
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une question..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-300"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCategories.map((category) => (
            <div key={category.name} className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {category.name}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, index) => {
                  const id = `${category.name}-${index}`
                  const isOpen = openItems.includes(id)
                  return (
                    <div
                      key={id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{item.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600">
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun résultat pour "{searchQuery}"</p>
            </div>
          )}
        </div>
      </section>

      {/* Contextual Links */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Ressources utiles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/how-it-works"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Comment ça marche ?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Découvrez le fonctionnement de notre service en 3 étapes.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                En savoir plus <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/quotes"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Demander un devis</h3>
              <p className="text-gray-600 text-sm mb-3">
                Obtenez jusqu'à 3 devis gratuits d'artisans qualifiés.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                Demander <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link
              href="/register"
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Créer un compte</h3>
              <p className="text-gray-600 text-sm mb-3">
                Inscrivez-vous pour suivre vos demandes et réservations.
              </p>
              <span className="text-blue-600 text-sm font-medium inline-flex items-center gap-1">
                S'inscrire <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="text-gray-600 mb-8">
            Notre équipe est là pour vous aider
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contactez-nous
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Related Links Section */}
      <section className="bg-gray-50 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Trouvez un artisan près de chez vous
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <PopularServicesLinks />
            <PopularCitiesLinks />
          </div>
        </div>
      </section>
    </div>
  )
}
