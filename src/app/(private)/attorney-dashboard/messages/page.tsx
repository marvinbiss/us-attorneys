'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { MessageCircle, ArrowLeft, Send, Search, Paperclip, Loader2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import AttorneySidebar from '@/components/attorney-dashboard/AttorneySidebar'
import { getAttorneyUrl } from '@/lib/utils'

interface Partner {
  id: string
  full_name: string | null
}

interface Message {
  id: string
  sender_id: string
  conversation_id: string
  content: string
  created_at: string
  read_at: string | null
}

interface Conversation {
  id: string
  partner: Partner
  lastMessage: Message
  unreadCount: number
}

export default function MessagesArtisanPage() {
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetchConversations()
    fetchPublicUrl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attorney/messages')
      const data = await response.json()

      if (response.ok) {
        setConversations(data.conversations || [])
        if (data.conversations?.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicUrl = async () => {
    try {
      const response = await fetch('/api/attorney/stats')
      const data = await response.json()
      if (response.ok && data.profile) {
        const url = getAttorneyUrl({
          stable_id: data.profile.stable_id ?? null,
          slug: data.profile.slug ?? null,
          specialty: data.profile.specialty ?? null,
          city: data.profile.address_city ?? null,
        })
        setPublicUrl(url)
      }
    } catch {
      // Silently fail — link just won't show
    }
  }

  const fetchMessages = useCallback(async (conversationId: string, partnerId: string) => {
    try {
      const response = await fetch(`/api/attorney/messages?conversation_id=${conversationId}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
        // Extract current user ID from API response (preferred) or infer from messages
        if (data.currentUserId) {
          setCurrentUserId(data.currentUserId)
        } else if (data.messages?.length > 0) {
          // Infer: the sender that is NOT the partner is the current user
          const msg = data.messages.find((m: Message) => m.sender_id !== partnerId)
          if (msg) setCurrentUserId(msg.sender_id)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id, selectedConversation.partner.id)

      // Auto-refresh messages every 10 seconds
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedConversation.id, selectedConversation.partner.id)
      }, 10_000)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [selectedConversation, fetchMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/attorney/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage('')
        // Refresh messages
        fetchMessages(selectedConversation.id, selectedConversation.partner.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setShowChat(true)
  }

  const handleBackToList = () => {
    setShowChat(false)
  }

  const getAvatar = (partner: Partner) => {
    const name = partner.full_name || 'U'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const getDisplayName = (partner: Partner) => {
    return partner.full_name || 'User'
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumb items={[
            { label: 'Attorney Dashboard', href: '/attorney-dashboard' },
            { label: 'Messages' }
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/attorney-dashboard/dashboard" className="text-white/80 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-blue-100">Communicate with your clients</p>
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

          {/* Messages */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center h-[400px] sm:h-[600px] flex items-center justify-center">
                <div>
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center h-[400px] sm:h-[600px] flex items-center justify-center">
                <div>
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No conversations</h3>
                  <p className="text-gray-500">Your conversations with clients will appear here</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[70vh] md:h-[600px] flex flex-col md:flex-row">
                {/* Conversations list */}
                <div className={`md:w-1/3 border-b md:border-b-0 md:border-r md:block ${showChat ? 'hidden' : 'flex-1'}`}>
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto h-[calc(100%-73px)]">
                    {conversations
                      .filter(conv =>
                        !searchQuery ||
                        getDisplayName(conv.partner).toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                            {getAvatar(conv.partner)}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate">{getDisplayName(conv.partner)}</span>
                              <span className="text-xs text-gray-500">{formatTime(conv.lastMessage.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{conv.lastMessage.content}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Chat */}
                <div className={`flex-1 flex flex-col md:flex ${showChat ? 'flex' : 'hidden md:flex'}`}>
                  {selectedConversation ? (
                    <>
                      {/* Chat header */}
                      <div className="p-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleBackToList}
                            className="md:hidden p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label="Back to conversations"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                            {getAvatar(selectedConversation.partner)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{getDisplayName(selectedConversation.partner)}</h3>
                          </div>
                        </div>
                        <Link
                          href="/attorney-dashboard/demandes-recues"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Case
                        </Link>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.sender_id === currentUserId
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isOwnMessage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p>{message.content}</p>
                                <span
                                  className={`text-xs ${
                                    isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                                  }`}
                                >
                                  {formatTime(message.created_at)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled
                            title="Coming soon"
                            className="p-2 text-gray-300 cursor-not-allowed transition-colors"
                          >
                            <Paperclip className="w-5 h-5" />
                          </button>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={sendingMessage}
                          />
                          <button
                            type="submit"
                            disabled={sendingMessage || !newMessage.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {sendingMessage ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      Select a conversation
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
