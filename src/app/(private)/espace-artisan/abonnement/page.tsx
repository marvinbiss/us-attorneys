'use client'

import Link from 'next/link'
import { ArrowLeft, Check, Shield } from 'lucide-react'
import ArtisanSidebar from '@/components/artisan-dashboard/ArtisanSidebar'

const features = [
  'Profil complet avec toutes vos informations',
  'Demandes de devis illimitées',
  'Messagerie avec les clients',
  'Statistiques de votre activité',
  'Badge vérifié (après vérification SIRET)',
  'Support par email',
]

export default function AbonnementArtisanPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/espace-artisan/dashboard" className="text-white/80 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Mon compte</h1>
              <p className="text-blue-100">Votre compte artisan est entièrement gratuit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <ArtisanSidebar activePage="abonnement" />

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Current plan */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-green-200" />
                <span className="text-sm font-medium text-green-200">Votre compte</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">Gratuit</h2>
              <p className="text-green-200">
                Toutes les fonctionnalités sont incluses, sans limite de durée.
              </p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Ce qui est inclus</h2>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-800 font-medium">
                ServicesArtisans est 100% gratuit pour les artisans.
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Pas d&apos;abonnement, pas de commission, pas de frais cachés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
