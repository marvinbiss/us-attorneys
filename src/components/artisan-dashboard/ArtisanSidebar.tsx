'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings, TrendingUp, Euro, Calendar, ExternalLink, Search, Image as ImageIcon, Inbox } from 'lucide-react'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ArtisanSidebarProps {
  activePage?: 'dashboard' | 'leads' | 'demandes-recues' | 'calendrier' | 'messages' | 'portfolio' | 'statistiques' | 'avis-recus' | 'profil' | 'abonnement'
  newDemandesCount?: number
  unreadMessagesCount?: number
  publicUrl?: string | null
  subscriptionPlan?: string
}

export default function ArtisanSidebar({ activePage = 'dashboard', newDemandesCount = 0, unreadMessagesCount = 0, publicUrl, subscriptionPlan }: ArtisanSidebarProps) {
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  return (
    <div className="lg:col-span-1">
      <nav className="bg-white rounded-xl shadow-sm p-4 space-y-1">
        {/* Notifications */}
        <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</span>
          <NotificationBell userId={userId} />
        </div>
        <Link
          href="/espace-artisan/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Tableau de bord
        </Link>
        <Link
          href="/espace-artisan/leads"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'leads' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Inbox className="w-5 h-5" />
          Leads reçus
        </Link>
        <Link
          href="/espace-artisan/demandes-recues"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'demandes-recues' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          Demandes reçues
          {newDemandesCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newDemandesCount}</span>
          )}
        </Link>
        <Link
          href="/espace-artisan/calendrier"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'calendrier' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-5 h-5" />
          Calendrier
          {(subscriptionPlan === 'pro' || subscriptionPlan === 'premium') && (
            <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">Pro</span>
          )}
        </Link>
        <Link
          href="/espace-artisan/messages"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'messages' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          Messages
          {unreadMessagesCount > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{unreadMessagesCount}</span>
          )}
        </Link>
        <Link
          href="/espace-artisan/portfolio"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'portfolio' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="w-5 h-5" />
          Portfolio
        </Link>
        <Link
          href="/espace-artisan/statistiques"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'statistiques' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Statistiques
        </Link>
        <Link
          href="/espace-artisan/avis-recus"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'avis-recus' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Star className="w-5 h-5" />
          Avis reçus
        </Link>
        <Link
          href="/espace-artisan/profil"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'profil' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          Mon profil
        </Link>
        <Link
          href="/espace-artisan/abonnement"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'abonnement' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Euro className="w-5 h-5" />
          Mon compte
        </Link>
        <LogoutButton />
      </nav>

      {/* Voir mon profil public */}
      {publicUrl && (
        <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
          <Link
            href={publicUrl}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Voir mon profil public
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-4">
        <QuickSiteLinks />
      </div>

      {/* Additional links */}
      <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
        <h4 className="font-medium text-gray-900 mb-3">Liens utiles</h4>
        <div className="space-y-2 text-sm">
          <Link href="/services" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 py-1">
            <Search className="w-4 h-4" />
            Parcourir les services
          </Link>
          <Link href="/recherche" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 py-1">
            <Search className="w-4 h-4" />
            Rechercher un artisan
          </Link>
        </div>
      </div>
    </div>
  )
}
