'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { trackEvent } from '@/lib/analytics/tracking'
import { CONVERSATION_STORAGE_KEY } from '../constants'
import { shouldShowLeadForm } from '../utils'
import type { EstimationContext, ChatMessage } from '../utils'

export interface UseEstimationChatReturn {
  messages: ChatMessage[]
  isStreaming: boolean
  showLeadForm: boolean
  inputValue: string
  setInputValue: (v: string) => void
  sendMessage: (text: string) => void
  handleChatSubmit: (e: React.FormEvent) => void
  hasUserMessages: boolean
  addConfirmationMessage: (msg: string) => void
}

export function useEstimationChat(context: EstimationContext): UseEstimationChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Restore from sessionStorage
    try {
      const saved = sessionStorage.getItem(CONVERSATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* SSR / private browsing */ }
    return []
  })
  const [isStreaming, setIsStreaming] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const abortRef = useRef<AbortController | null>(null)

  // Persist messages to sessionStorage
  useEffect(() => {
    if (messages.length === 0) return
    try {
      sessionStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages))
    } catch { /* noop */ }
  }, [messages])

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const hasUserMessages = messages.some((m) => m.role === 'user')

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      // Abort any previous streaming request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMessage: ChatMessage = { role: 'user', content: text.trim() }
      const updatedMessages = [...messages, userMessage]
      setMessages([...updatedMessages, { role: 'assistant', content: '' }])
      setInputValue('')
      setIsStreaming(true)

      trackEvent('chat_message_sent', {
        metier: context.metierSlug,
        message_count: updatedMessages.length,
      })

      try {
        const response = await fetch('/api/estimation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            context,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '')
          console.error('Estimation API error:', response.status, errorBody)
          throw new Error(`HTTP ${response.status}: ${errorBody}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let assistantMessage = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantMessage += decoder.decode(value, { stream: true })
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
            }
            return updated
          })
        }

        // Check if we should show the lead form
        if (shouldShowLeadForm(assistantMessage)) {
          setShowLeadForm(true)
          trackEvent('chat_lead_form_shown', {
            metier: context.metierSlug,
            messages_before_form: updatedMessages.length + 1,
          })
        }
      } catch (error) {
        // Don't show error if it was an abort
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Estimation streaming error:', error)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content:
              "Désolé, une erreur est survenue. Veuillez réessayer ou nous contacter directement.",
          }
          return updated
        })
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [messages, isStreaming, context],
  )

  const handleChatSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      sendMessage(inputValue)
    },
    [sendMessage, inputValue],
  )

  const addConfirmationMessage = useCallback((msg: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content: msg }])
    setShowLeadForm(false)
  }, [])

  return {
    messages,
    isStreaming,
    showLeadForm,
    inputValue,
    setInputValue,
    sendMessage,
    handleChatSubmit,
    hasUserMessages,
    addConfirmationMessage,
  }
}
