'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { FileText, MessageSquare, Star, Settings, Send, Search, ArrowLeft, Loader2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { QuickSiteLinks } from '@/components/InternalLinks'
import LogoutButton from '@/components/LogoutButton'

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

export default function MessagesClientPage() {
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/client/messages')
      const data = await response.json()

      if (response.ok) {
        setConversations(data.conversations || [])
        if (data.conversations?.length > 0) {
          setSelectedConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/client/messages?conversation_id=${conversationId}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
        if (data.currentUserId) {
          setCurrentUserId(data.currentUserId)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/client/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const getAvatar = (partner: Partner) => {
    const name = partner.full_name || 'A'
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const getDisplayName = (partner: Partner) => {
    return partner.full_name || 'Artisan'
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb
            items={[
              { label: 'Espace Client', href: '/client-dashboard' },
              { label: 'Messages' }
            ]}
            className="mb-4"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/client-dashboard/mes-demandes" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600">Vos conversations avec les artisans</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-1">
              <Link
                href="/client-dashboard/mes-demandes"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-5 h-5" />
                Mes demandes
              </Link>
              <Link
                href="/client-dashboard/messages"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium"
              >
                <MessageSquare className="w-5 h-5" />
                Messages
                {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0) > 0 && (
                  <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </Link>
              <Link
                href="/client-dashboard/reviews-donnes"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Star className="w-5 h-5" />
                Avis donnés
              </Link>
              <Link
                href="/client-dashboard/parametres"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-5 h-5" />
                Paramètres
              </Link>
              <LogoutButton />
            </nav>
            <QuickSiteLinks />
          </div>

          {/* Messages */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center h-[600px] flex items-center justify-center">
                <div>
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des messages...</p>
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center h-[600px] flex items-center justify-center">
                <div>
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Aucune conversation</h3>
                  <p className="text-gray-500 mb-4">Vos conversations avec les artisans apparaîtront ici.</p>
                  <Link
                    href="/search"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Trouver un artisan
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[600px] flex">
                {/* Conversations list */}
                <div className="w-1/3 border-r">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
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
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
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
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Chat header */}
                      <div className="p-4 border-b flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {getAvatar(selectedConversation.partner)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{getDisplayName(selectedConversation.partner)}</h3>
                        </div>
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
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
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
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
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
                      Sélectionnez une conversation
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
