'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare,
  ArrowLeft,
  Loader2,
  Plus,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { ConversationList, type ConversationListItem } from '@/components/chat/ConversationList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import Breadcrumb from '@/components/Breadcrumb'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserInfo {
  userId: string
  userType: 'client' | 'attorney'
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null)
  const [showMobileChat, setShowMobileChat] = useState(false)

  // ---------------------------------------------------------------------------
  // Fetch current user info
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/messages?status=active')
        const data = await res.json()
        if (data.success && data.currentUserId) {
          setUserInfo({
            userId: data.currentUserId,
            userType: data.userType || 'client',
          })
        }
      } catch {
        // Auth error — will show loading
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleSelectConversation = useCallback(
    (conv: ConversationListItem) => {
      setSelectedConversation(conv)
      setShowMobileChat(true)
    },
    []
  )

  const handleBackToList = useCallback(() => {
    setShowMobileChat(false)
  }, [])

  const handleNewConversation = useCallback(() => {
    // Could open a modal or redirect to attorney search
    if (userInfo?.userType === 'client') {
      window.location.href = '/search'
    }
  }, [userInfo])

  // ---------------------------------------------------------------------------
  // Get other user's display name
  // ---------------------------------------------------------------------------

  const getOtherUserName = (conv: ConversationListItem) => {
    if (userInfo?.userType === 'client') {
      return conv.attorney?.name || 'Attorney'
    }
    return conv.client?.full_name || 'Client'
  }

  // ---------------------------------------------------------------------------
  // Breadcrumb
  // ---------------------------------------------------------------------------

  const dashboardUrl =
    userInfo?.userType === 'attorney'
      ? '/attorney-dashboard'
      : '/client-dashboard'

  const dashboardLabel =
    userInfo?.userType === 'attorney'
      ? 'Attorney Dashboard'
      : 'Client Dashboard'

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading messages...
          </p>
        </div>
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Sign in to view messages
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You need to be signed in to access your conversations.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb
            items={[
              { label: dashboardLabel, href: dashboardUrl },
              { label: 'Messages' },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={dashboardUrl}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Secure Messages</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-green-300" />
                  <span className="text-sm text-blue-100">
                    ABA Rule 1.6 — All conversations encrypted
                  </span>
                </div>
              </div>
            </div>
            {userInfo.userType === 'client' && (
              <Link
                href="/search"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main content: split view */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}
        >
          <div className="flex h-full">
            {/* ─── Left: Conversation List ─────────────────────────────── */}
            <div
              className={cn(
                'w-full lg:w-[380px] lg:min-w-[320px] lg:max-w-[420px] border-r border-gray-200 dark:border-gray-700 flex-shrink-0',
                // Mobile: show list OR chat, not both
                showMobileChat ? 'hidden lg:block' : 'block'
              )}
            >
              <ConversationList
                userId={userInfo.userId}
                userType={userInfo.userType}
                selectedId={selectedConversation?.id}
                onSelect={handleSelectConversation}
                onNewConversation={
                  userInfo.userType === 'client'
                    ? handleNewConversation
                    : undefined
                }
              />
            </div>

            {/* ─── Right: Chat Window ─────────────────────────────────── */}
            <div
              className={cn(
                'flex-1 flex flex-col',
                // Mobile: show chat only when selected
                !showMobileChat ? 'hidden lg:flex' : 'flex'
              )}
            >
              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation.id}
                  currentUserId={userInfo.userId}
                  currentUserType={userInfo.userType}
                  otherUserName={getOtherUserName(selectedConversation)}
                  encryptionEnabled={
                    selectedConversation.encryption_enabled ?? true
                  }
                  onBack={handleBackToList}
                  className="border-0 rounded-none shadow-none"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                      Choose a conversation from the left panel to start messaging.
                      All messages are encrypted for your protection.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
