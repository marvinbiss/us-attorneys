'use client'

import { motion } from 'framer-motion'
import { MessageCircle, Shield, Clock, Zap, CheckCircle } from 'lucide-react'
import { Artisan, getDisplayName } from './types'

interface AttorneyQuoteFormProps {
  artisan: Artisan
}

export function AttorneyQuoteForm({ artisan }: AttorneyQuoteFormProps) {
  const displayName = getDisplayName(artisan)

  const openEstimationWidget = () => {
    window.dispatchEvent(new Event('sa:open-estimation'))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-clay-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-clay-500 to-clay-700 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Devis gratuit instantané</h2>
            <p className="text-clay-100 text-sm mt-1">
              Obtenez une estimation personnalisée de {displayName}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <Clock className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white text-xs font-medium">Réponse en &lt; 2 min</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 text-sm mb-5 leading-relaxed">
          Notre assistant IA analyse votre projet et vous fournit une estimation détaillée en quelques questions. Gratuit, sans engagement, immédiat.
        </p>

        {/* Trust badges */}
        <div className="space-y-2.5 mb-6">
          {[
            { icon: Zap, text: 'Estimation en moins de 2 minutes' },
            { icon: CheckCircle, text: 'Tarifs basés sur les prix réels du marché' },
            { icon: Shield, text: 'Sans engagement — vos données restent protégées' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
              <Icon className="w-4 h-4 text-clay-400 flex-shrink-0" aria-hidden="true" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Trust footer */}
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-gray-100">
          <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs text-gray-500">
            Service gratuit • Données protégées (RGPD) • Sans engagement
          </p>
        </div>

        {/* Single dominant CTA */}
        <motion.button
          onClick={openEstimationWidget}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-clay-400 to-clay-500 text-white font-semibold text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-glow-clay hover:shadow-glow-clay hover:from-clay-500 hover:to-clay-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-offset-2"
          aria-label="Ouvrir l'assistant d'estimation pour un devis gratuit"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          Estimer mon projet gratuitement
        </motion.button>
      </div>
    </div>
  )
}
