'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Loader2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { SecureChat } from '@/components/chat/SecureChat'
import {
  SecureConversationList,
  SecureConversation,
} from '@/components/chat/SecureConversationList'
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
        if (statsRes.ok && statsData?.provider) {
          const url = getAttorneyUrl({
            stable_id: statsData.provider?.stable_id ?? null,
            slug: statsData.provider?.slug ?? null,
            specialty: statsData.provider?.specialty ?? null,
            city: statsData.provider?.address_city ?? null,
          })
          setPublicUrl(url)
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false)
      }
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Attorney Dashboard', href: '/attorney-dashboard' },
              { label: 'Secure Messages' },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white dark:from-blue-800 dark:to-blue-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/attorney-dashboard/dashboard"
                className="text-white/80 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Secure Messages</h1>
                <p className="text-sm text-blue-100">Encrypted attorney-client communications</p>
              </div>
            </div>

            {/* ABA badge */}
            <div className="hidden items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 sm:flex">
              <Shield className="h-4 w-4 text-green-300" />
              <span className="text-xs font-medium text-white">ABA Rule 1.6 Compliant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <AttorneySidebar activePage="messages" publicUrl={publicUrl} />

          {/* Messages Area */}
          <div className="lg:col-span-3">
            <div className="flex h-[70vh] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 md:h-[600px] md:flex-row">
              {/* Conversation list */}
              <div
                className={`border-gray-200 dark:border-gray-800 md:block md:w-[320px] md:border-r ${showChat ? 'hidden' : 'flex-1'}`}
              >
                <SecureConversationList
                  userType="attorney"
                  selectedId={selectedConversation?.id}
                  onSelect={handleSelectConversation}
                />
              </div>

              {/* Chat area */}
              <div
                className={`flex flex-1 flex-col md:flex ${showChat ? 'flex' : 'hidden md:flex'}`}
              >
                {selectedConversation && currentUserId ? (
                  <SecureChat
                    conversationId={selectedConversation.id}
                    currentUserId={currentUserId}
                    currentUserType="attorney"
                    otherUserName={getOtherName(selectedConversation)}
                    encryptionEnabled={selectedConversation.encryption_enabled}
                    onBack={handleBack}
                    className="h-full rounded-none border-0 shadow-none"
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-gray-400 dark:text-gray-500">
                    <Shield className="mb-4 h-12 w-12 opacity-40" />
                    <p className="text-center font-medium">Select a conversation</p>
                    <p className="mt-1 text-center text-xs">Messages are encrypted at rest</p>
                  </div>
                )}
              </div>
            </div>

            {/* ABA compliance footer */}
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/10">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div className="text-xs text-green-800 dark:text-green-300">
                  <p className="mb-1 font-semibold">
                    Attorney-Client Privilege - ABA Model Rule 1.6
                  </p>
                  <p>
                    All client communications on this platform are encrypted at rest using
                    AES-256-GCM encryption. As an attorney, you have a duty to make reasonable
                    efforts to prevent inadvertent or unauthorized disclosure of, or unauthorized
                    access to, information relating to the representation of a client (ABA Model
                    Rule 1.6(c)). This messaging system is designed to help you meet that
                    obligation.
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
