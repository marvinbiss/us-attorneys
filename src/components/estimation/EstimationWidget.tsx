'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/tracking'

// Hooks
import { useEstimationChat } from './hooks/useEstimationChat'
import { useLeadSubmit } from './hooks/useLeadSubmit'
import { useEngagementTriggers } from './hooks/useEngagementTriggers'

// Sub-components
import { ChatPanel } from './ChatPanel'
import { CallbackPanel } from './CallbackPanel'
import { GreetingBubble } from './GreetingBubble'
import { LauncherButton } from './LauncherButton'

// Constants & types
import { quickPrompts, defaultPrompts, priceTeasers } from './constants'
import { getGreetingMessage } from './utils'
import type { EstimationContext } from './utils'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EstimationWidgetProps {
  context: EstimationContext
  /** Hide the floating launcher button (e.g. on artisan pages where CTA bar opens the widget) */
  hideLauncher?: boolean
}

export default function EstimationWidget({ context, hideLauncher = false }: EstimationWidgetProps) {
  // --- Main state ---
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'callback'>('chat')

  // --- Hooks ---
  const chat = useEstimationChat(context)
  const lead = useLeadSubmit(context, chat.messages, chat.addConfirmationMessage)
  const engagement = useEngagementTriggers(isOpen, context.metierSlug, context.ville)

  // --- Refs ---
  const widgetRef = useRef<HTMLDivElement>(null)

  // --- Derived ---
  const prompts = quickPrompts[context.metierSlug] ?? defaultPrompts
  const priceTeaser = priceTeasers[context.metierSlug]
  const greetingMessage = getGreetingMessage(context, engagement.isReturningVisitor)

  // --- Open handler ---
  const handleOpen = useCallback(
    (trigger: string) => {
      setIsOpen(true)
      engagement.dismissGreeting()
      trackEvent('chat_opened' as any, {
        trigger,
        metier: context.metierSlug,
        ville: context.ville,
      })
    },
    [engagement, context.metierSlug, context.ville],
  )

  // --- Lock body scroll on mobile when fullscreen + hide mobile nav ---
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden'
      document.body.setAttribute('data-estimation-open', 'true')
      return () => {
        document.body.style.overflow = ''
        document.body.removeAttribute('data-estimation-open')
      }
    }
  }, [isOpen])

  // --- Listen for external open event (e.g. from CTA bar on artisan pages) ---
  useEffect(() => {
    function handleExternalOpen() {
      handleOpen('cta_bar')
    }
    window.addEventListener('sa:open-estimation', handleExternalOpen)
    return () => window.removeEventListener('sa:open-estimation', handleExternalOpen)
  }, [handleOpen])

  // --- Escape key to close ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // --- Focus trap on mobile fullscreen ---
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || window.innerWidth >= 640) return
    const widget = widgetRef.current
    if (!widget) return

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = widget!.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])

  // --- Render ---
  return (
    <>
      {/* Launcher + Greeting (when closed, hidden when hideLauncher is set) */}
      <AnimatePresence>
        {!isOpen && !hideLauncher && (
          <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-3">
            <AnimatePresence>
              {engagement.showGreeting && (
                <GreetingBubble
                  message={greetingMessage}
                  priceTeaser={priceTeaser}
                  onOpen={() => handleOpen('greeting')}
                  onDismiss={engagement.dismissGreeting}
                />
              )}
            </AnimatePresence>

            <LauncherButton
              isExpanded={engagement.isLauncherExpanded}
              shouldWiggle={engagement.shouldWiggle}
              showNotification={!engagement.showGreeting}
              onClick={() => handleOpen('launcher')}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Widget Panel (when open) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={widgetRef}
            role="dialog"
            aria-label={`Estimation ${context.metier} à ${context.ville}`}
            aria-modal="true"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={
              'fixed z-[9999] flex flex-col bg-white shadow-2xl ' +
              'inset-0 ' +
              'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[600px] sm:rounded-[20px]'
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-[#E07040] px-4 py-3 text-white sm:rounded-t-[20px] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mini logo SA */}
                <div className="flex items-center font-heading font-bold text-base shrink-0">
                  <span className="text-black">S</span>
                  <span className="bg-white text-[#E07040] rounded-sm px-0.5 mx-0.5 text-xs font-extrabold leading-none">
                    A
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {context.artisan
                      ? `Devis avec ${context.artisan.name}`
                      : `${context.metier} à ${context.ville}`}
                  </p>
                  <p className="text-[11px] text-white/80">
                    Estimation gratuite IA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer le chat"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={
                  'flex-1 py-2.5 text-sm font-medium transition-colors ' +
                  (activeTab === 'chat'
                    ? 'text-[#E07040] border-b-2 border-[#E07040]'
                    : 'text-gray-500 hover:text-gray-700')
                }
              >
                Estimer mon projet
              </button>
              <button
                onClick={() => setActiveTab('callback')}
                className={
                  'flex-1 py-2.5 text-sm font-medium transition-colors ' +
                  (activeTab === 'callback'
                    ? 'text-[#E07040] border-b-2 border-[#E07040]'
                    : 'text-gray-500 hover:text-gray-700')
                }
              >
                Demande de rappel
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' ? (
              <ChatPanel
                context={context}
                chat={chat}
                lead={lead}
                prompts={prompts}
              />
            ) : (
              <CallbackPanel
                context={context}
                lead={lead}
              />
            )}

            {/* Footer with privacy link */}
            <div className="border-t border-gray-100 px-4 py-2 text-center shrink-0">
              <p className="text-[11px] text-gray-400">
                Propulsé par{' '}
                <a
                  href="https://servicesartisans.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-500 transition-colors"
                >
                  ServicesArtisans.fr
                </a>
                {' · '}Estimation non contractuelle
                {' · '}
                <a
                  href="/confidentialite"
                  target="_blank"
                  className="hover:text-gray-500"
                >
                  Confidentialité
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
