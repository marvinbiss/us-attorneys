'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { ProspectionNav } from '@/components/admin/prospection/ProspectionNav'
import { ContactTypeBadge, ChannelIcon } from '@/components/admin/prospection/StatsCards'
import { Bot, User, Send, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { ProspectionConversation, ProspectionConversationMessage } from '@/types/prospection'

const MAX_REPLY_LENGTH = 5000

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [conversation, setConversation] = useState<ProspectionConversation | null>(null)
  const [messages, setMessages] = useState<ProspectionConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)

  const fetchConversation = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      const res = await fetch(`/api/admin/prospection/conversations/${id}`, { signal })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setConversation(data.data)
        setMessages(data.data.messages || [])
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Loading error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    fetchConversation(controller.signal)
    return () => controller.abort()
  }, [fetchConversation])

  const handleReply = async () => {
    if (!replyText.trim()) return
    if (replyText.length > MAX_REPLY_LENGTH) {
      setError(`Reply is too long (${replyText.length}/${MAX_REPLY_LENGTH} characters)`)
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/prospection/conversations/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, sender_type: 'human' }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setReplyText('')
        fetchConversation()
      } else {
        setError(data.error?.message || 'Error sending message')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error sending message')
      }
    } finally {
      setSending(false)
    }
  }

  const handleAIGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/prospection/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: id }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      if (data.success) {
        setReplyText(data.data.content)
      } else {
        setError(data.error?.message || 'AI error')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error generating AI response')
      }
    } finally {
      setGenerating(false)
    }
  }

  const contact = conversation?.contact as { contact_name?: string; company_name?: string; email?: string; phone?: string; contact_type?: string } | undefined

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prospection</h1>
        <ProspectionNav />
        <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/prospection/inbox" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to inbox
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {contact?.contact_name || contact?.company_name || 'Conversation'}
          </h1>
          {contact?.contact_type && <ContactTypeBadge type={contact.contact_type} />}
          {conversation && <ChannelIcon channel={conversation.channel} className="w-5 h-5 text-gray-400" />}
        </div>
        {contact?.email && <p className="text-sm text-gray-500">{contact.email}</p>}
        {contact?.phone && <p className="text-sm text-gray-500">{contact.phone}</p>}
      </div>

      <ProspectionNav />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} aria-label="Close error message" className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No messages in this conversation</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.direction === 'outbound'
                    ? msg.sender_type === 'ai'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 text-xs opacity-60">
                    {msg.sender_type === 'ai' ? <Bot className="w-3 h-3" /> : msg.sender_type === 'human' ? <User className="w-3 h-3" /> : null}
                    <span>{msg.sender_type === 'ai' ? 'AI' : msg.sender_type === 'human' ? 'Human' : 'Contact'}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.ai_provider && (
                    <p className="text-xs opacity-40 mt-1">{msg.ai_provider}/{msg.ai_model} - {msg.ai_prompt_tokens}+{msg.ai_completion_tokens} tokens</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply box */}
        <div className="border-t p-4">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            aria-label="Reply to contact"
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg text-sm mb-1 ${replyText.length > MAX_REPLY_LENGTH ? 'border-red-300 bg-red-50' : ''}`}
          />
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${replyText.length > MAX_REPLY_LENGTH ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
              {replyText.length}/{MAX_REPLY_LENGTH}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAIGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate with AI'}
            </button>
            <button
              onClick={handleReply}
              disabled={sending || !replyText.trim() || replyText.length > MAX_REPLY_LENGTH}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ml-auto"
            >
              <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
