'use client'

import React, { useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Send, Loader2 } from 'lucide-react'
import { renderMarkdown } from './utils'
import type { EstimationContext } from './utils'
import type { UseEstimationChatReturn } from './hooks/useEstimationChat'
import type { UseLeadSubmitReturn } from './hooks/useLeadSubmit'
import { LeadForm } from './LeadForm'

interface ChatPanelProps {
  context: EstimationContext
  chat: UseEstimationChatReturn
  lead: UseLeadSubmitReturn
  prompts: string[]
}

export const ChatPanel = memo(function ChatPanel({ context, chat, lead, prompts }: ChatPanelProps) {
  const reducedMotion = useReducedMotion()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  return (
    <>
      {/* Chat messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" role="log" aria-live="polite">
        {/* Welcome message */}
        {chat.messages.length === 0 && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="flex justify-start"
          >
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-800">
              {context.attorney ? (
                <>
                  Hello! I&apos;m the AI estimation assistant for{' '}
                  <strong>{context.attorney.name}</strong>, {context.metier.toLowerCase()} in{' '}
                  <strong>{context.ville}</strong>. Describe your case and I&apos;ll give you a cost
                  estimate.
                </>
              ) : (
                <>
                  Hello! I&apos;m the AI estimation assistant. Tell me about your legal needs with a{' '}
                  <strong>{context.metier.toLowerCase()}</strong> in{' '}
                  <strong>{context.ville}</strong>, and I&apos;ll give you a cost estimate.
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {chat.messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={
                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ' +
                (msg.role === 'user'
                  ? 'rounded-tr-sm bg-[#E07040] text-white'
                  : 'rounded-tl-sm bg-gray-100 text-gray-800')
              }
            >
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
              {/* Streaming cursor */}
              {msg.role === 'assistant' && idx === chat.messages.length - 1 && chat.isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-gray-400 align-text-bottom" />
              )}
            </div>
          </motion.div>
        ))}

        {/* Quick prompts (before first user message) */}
        {!chat.hasUserMessages && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion ? { duration: 0 } : { delay: 0.3 }}
            className="flex flex-wrap gap-2 pt-1"
          >
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => chat.sendMessage(prompt)}
                disabled={chat.isStreaming}
                className="rounded-full border border-[#E07040]/30 bg-[#E07040]/5 px-3 py-1.5 text-xs font-medium text-[#E07040] transition-colors hover:bg-[#E07040]/10 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}

        {/* Lead form (slide up after trigger) */}
        <AnimatePresence>
          {chat.showLeadForm && !lead.leadSubmitted && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }
              }
            >
              <LeadForm context={context} lead={lead} />
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <form
        onSubmit={chat.handleChatSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-gray-200 px-3 py-2.5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={chat.inputValue}
          onChange={(e) => chat.setInputValue(e.target.value)}
          placeholder="Describe your needs..."
          disabled={chat.isStreaming}
          className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E07040] disabled:opacity-50"
          style={{ fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={chat.isStreaming || !chat.inputValue.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E07040] text-white transition-colors hover:bg-[#c9603a] disabled:opacity-40"
        >
          {chat.isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </>
  )
})
