'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  Star,
  Settings,
  Shield,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'
import { SecureChat } from '@/components/chat/SecureChat'
import { SecureConversationList, SecureConversation } from '@/components/chat/SecureConversationList'

export default function MessagesClientPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<SecureConversation | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/messages')
        const data = await res.json()
        if (data.success && data.currentUserId) {
          setCurrentUserId(data.currentUserId)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [])

  const handleSelectConversation = (conv: SecureConversation) => {
    setSelectedConversation(conv)
    setShowChat(true)
  }

  const handleBack = () => {
    setShowChat(false)
  }

  const getOtherName = (conv: SecureConversation) => {
    return conv.attorney?.name || 'Attorney'
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
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            items={[
              { label: 'Client Dashboard', href: '/client-dashboard' },
              { label: 'Secure Messages' },
            ]}
            className="mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/client-dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Secure Messages
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Encrypted attorney-client communications
                </p>
              </div>
            </div>

            {/* ABA badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-700 dark:text-green-400 font-medium">
                ABA Rule 1.6 Compliant
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <nav className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 space-y-1">
              <Link
                href="/client-dashboard/my-cases"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-5 h-5" />
                My Cases
              </Link>
              <Link
                href="/client-dashboard/messages"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </Link>
              <Link
                href="/client-dashboard/my-reviews"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Star className="w-5 h-5" />
                My Reviews
              </Link>
              <Link
                href="/client-dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <LogoutButton />
            </nav>
            <QuickSiteLinks />
          </div>

          {/* Messages Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden h-[70vh] md:h-[600px] flex flex-col md:flex-row">
              {/* Conversation list */}
              <div className={`md:w-[320px] md:border-r border-gray-200 dark:border-gray-800 md:block ${showChat ? 'hidden' : 'flex-1'}`}>
                <SecureConversationList
                  userType="client"
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
                    currentUserType="client"
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
                      Your messages are encrypted at rest
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
                  <p className="font-semibold mb-1">Attorney-Client Privilege Notice</p>
                  <p>
                    All messages on this platform are encrypted at rest using AES-256-GCM encryption
                    in compliance with ABA Model Rule 1.6 (Confidentiality of Information).
                    Communications between you and your attorney are protected by attorney-client privilege.
                    Do not share these messages with unauthorized third parties.
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
