'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings } from 'lucide-react'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ClientSidebarProps {
  activePage?: 'mes-demandes' | 'messages' | 'avis-donnes' | 'parametres' | 'factures'
  unreadMessagesCount?: number
}

export default function ClientSidebar({ activePage = 'mes-demandes', unreadMessagesCount = 0 }: ClientSidebarProps) {
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
          href="/client-dashboard/mes-demandes"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'mes-demandes' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          Mes demandes
        </Link>
        <Link
          href="/client-dashboard/messages"
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
          href="/client-dashboard/reviews-donnes"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'avis-donnes' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Star className="w-5 h-5" />
          Avis donnés
        </Link>
        <Link
          href="/client-dashboard/parametres"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'parametres' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          Paramètres
        </Link>
        <LogoutButton />
      </nav>

      {/* Liens vers le site - Maillage interne */}
      <QuickSiteLinks className="mt-4" />
    </div>
  )
}
