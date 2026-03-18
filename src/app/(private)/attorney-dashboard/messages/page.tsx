'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  Loader2,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { SecureChat } from '@/components/chat/SecureChat'
import { SecureConversationList, SecureConversation } from '@/components/chat/SecureConversationList'
import { getAttorneyUrl } from '@/lib/utils'

export default function MessagesAttorneyPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<SecureConversation | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch user info
        const res = await fetch('/api/messages')
        const data = await res.json()
        if (data.success && data.currentUserId) {
          setCurrentUserId(data.currentUserId)
        }

        // Fetch attorney public URL
        const statsRes = await fetch('/api/attorney/stats')
        const statsData = await statsRes.json()
        if (statsRes.ok && statsData.profile) {
          const url = getAttorneyUrl({
            stable_id: statsData.profile.stable_id ?? null,
            slug: statsData.profile.slug ?? null,
            specialty: statsData.profile.specialty ?? null,
            city: statsData.profile.address_city ?? null,
          })
          setPublicUrl(url)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    init()
  }, [])

  const handleSelectConversation = (conv: SecureConversation) => {
    setSelectedConversation(conv)
    setShowChat(true)
  }

  const handleBack = () => {
    setShowChat(false)
  }

  const getOtherName = (conv: SecureConversation) => {
    return conv.client?.full_name || 'Client'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Attorney Dashboard', href: '/attorney-dashboard' },
            { label: 'Secure Messages' },
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/attorney-dashboard/dashboard"
                className="text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Secure Messages</h1>
                <p className="text-blue-100 text-sm">Encrypted attorney-client communications</p>
              </div>
            </div>

            {/* ABA badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
              <Shield className="w-4 h-4 text-green-300" />
              <span className="text-xs text-white font-medium">
                ABA Rule 1.6 Compliant
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AttorneySidebar
            activePage="messages"
            publicUrl={publicUrl}
          />

          {/* Messages Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden h-[70vh] md:h-[600px] flex flex-col md:flex-row">
              {/* Conversation list */}
              <div className={`md:w-[320px] md:border-r border-gray-200 dark:border-gray-800 md:block ${showChat ? 'hidden' : 'flex-1'}`}>
                <SecureConversationList
                  userType="attorney"
                  selectedId={selectedConversation?.id}
                  onSelect={handleSelectConversation}
                />
              </div>

              {/* Chat area */}
              <div className={`flex-1 flex flex-col md:flex ${showChat ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation && currentUserId ? (
                  <SecureChat
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    currentUserType="attorney"
                    otherUserName={getOtherName(selectedConversation)}
                    encryptionEnabled={selectedConversation.encryption_enabled}
                    onBack={handleBack}
                    className="h-full border-0 rounded-none shadow-none"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
                    <Shield className="w-12 h-12 mb-4 opacity-40" />
                    <p className="text-center font-medium">Select a conversation</p>
                    <p className="text-xs text-center mt-1">
                      Messages are encrypted at rest
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ABA compliance footer */}
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-800 dark:text-green-300">
                  <p className="font-semibold mb-1">Attorney-Client Privilege - ABA Model Rule 1.6</p>
                  <p>
                    All client communications on this platform are encrypted at rest using AES-256-GCM encryption.
                    As an attorney, you have a duty to make reasonable efforts to prevent inadvertent or unauthorized
                    disclosure of, or unauthorized access to, information relating to the representation of a client
                    (ABA Model Rule 1.6(c)). This messaging system is designed to help you meet that obligation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
