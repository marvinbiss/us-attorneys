'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings, Video, Briefcase, FolderOpen } from 'lucide-react'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ClientSidebarProps {
  activePage?: 'my-cases' | 'cases' | 'documents' | 'consultations' | 'messages' | 'my-reviews' | 'settings' | 'invoices'
  unreadMessagesCount?: number
}

export default function ClientSidebar({ activePage = 'my-cases', unreadMessagesCount = 0 }: ClientSidebarProps) {
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
          href="/client-dashboard/my-cases"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'my-cases' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          My requests
        </Link>
        <Link
          href="/client-dashboard/cases"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'cases' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Cases
        </Link>
        <Link
          href="/client-dashboard/documents"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'documents' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          Documents
        </Link>
        <Link
          href="/client-dashboard/consultations"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'consultations' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Video className="w-5 h-5" />
          Consultations
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
          href="/client-dashboard/my-reviews"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'my-reviews' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Star className="w-5 h-5" />
          My reviews
        </Link>
        <Link
          href="/client-dashboard/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            activePage === 'settings' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <LogoutButton />
      </nav>

      {/* Site links - Internal linking */}
      <QuickSiteLinks className="mt-4" />
    </div>
  )
}
