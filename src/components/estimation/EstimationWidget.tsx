'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Phone, ArrowRight, Check, Loader2 } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EstimationWidgetProps {
  context: {
    metier: string       // "Plombier"
    metierSlug: string   // "plombier"
    ville: string        // "Lyon"
    departement: string  // "69"
    pageUrl: string      // "/services/plombier/lyon"
    artisan?: {
      name: string       // "Dupont Plomberie"
      slug: string       // "dupont-plomberie"
      publicId: string   // stable_id or slug
    }
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ---------------------------------------------------------------------------
// Quick prompts par metier
// ---------------------------------------------------------------------------

const quickPrompts: Record<string, string[]> = {
  plombier: [
    "J'ai une fuite d'eau",
    'Refaire ma salle de bain',
    'Chauffe-eau en panne',
    'WC suspendu à installer',
  ],
  serrurier: [
    'Enfermé dehors',
    'Serrure cassée',
    'Porte blindée',
    'Changer le cylindre',
  ],
  electricien: [
    'Tableau qui disjoncte',
    'Mise aux normes',
    'Ajouter des prises',
    'Installer une borne de recharge',
  ],
  chauffagiste: [
    'Chaudière en panne',
    'Installer un radiateur',
    'Entretien chaudière',
    'Pompe à chaleur',
  ],
  couvreur: [
    'Fuite toiture',
    'Rénovation toiture',
    'Nettoyage toiture',
    'Gouttières',
  ],
  peintre: [
    'Peindre un appartement',
    'Ravalement de façade',
    'Repeindre une pièce',
    'Traitement humidité murs',
  ],
  menuisier: [
    'Porte sur mesure',
    'Placard intégré',
    'Escalier bois',
    'Fenêtres à changer',
  ],
  carreleur: [
    'Carrelage salle de bain',
    'Carrelage terrasse',
    'Faïence cuisine',
    'Pose de parquet',
  ],
  maçon: [
    'Extension maison',
    'Mur de clôture',
    'Terrasse béton',
    'Ouverture mur porteur',
  ],
  vitrier: [
    'Vitre cassée',
    'Double vitrage',
    'Porte vitrée',
    'Miroir sur mesure',
  ],
}

const defaultPrompts = [
  'Estimer mon projet',
  'Demander un devis',
  'Besoin urgent',
  'Question sur les prix',
]

// ---------------------------------------------------------------------------
// Lead form trigger keywords
// ---------------------------------------------------------------------------

const LEAD_TRIGGER_KEYWORDS = [
  'mise en relation',
  'rappel',
  'mettre en contact',
  'contacter un',
]

function shouldShowLeadForm(content: string): boolean {
  const lower = content.toLowerCase()
  return LEAD_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EstimationWidget({ context }: EstimationWidgetProps) {
  // --- State ---------------------------------------------------------------
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'callback'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [callbackSubmitted, setCallbackSubmitted] = useState(false)
  const [callbackCountdown, setCallbackCountdown] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')

  // Lead form fields
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadLoading, setLeadLoading] = useState(false)

  // Callback field
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackLoading, setCallbackLoading] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)

  // --- Derived -------------------------------------------------------------
  const prompts = quickPrompts[context.metierSlug] ?? defaultPrompts
  const hasUserMessages = messages.some((m) => m.role === 'user')

  // --- Effects -------------------------------------------------------------

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, activeTab])

  // Lock body scroll on mobile when fullscreen
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Callback countdown timer
  useEffect(() => {
    if (callbackCountdown === null || callbackCountdown <= 0) return
    const timer = setInterval(() => {
      setCallbackCountdown((prev) =>
        prev !== null && prev > 0 ? prev - 1 : 0,
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [callbackCountdown])

  // Focus trap on mobile fullscreen
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

  // --- Streaming chat ------------------------------------------------------

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return

      const userMessage: ChatMessage = { role: 'user', content: text.trim() }
      const updatedMessages = [...messages, userMessage]
      setMessages([...updatedMessages, { role: 'assistant', content: '' }])
      setInputValue('')
      setIsStreaming(true)

      try {
        const response = await fetch('/api/estimation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            context,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
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
        }
      } catch (error) {
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
      }
    },
    [messages, isStreaming, context],
  )

  // --- Lead form submit ----------------------------------------------------

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadPhone.trim()) return

    setLeadLoading(true)
    try {
      const response = await fetch('/api/estimation/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName || undefined,
          phone: leadPhone,
          email: leadEmail || undefined,
          context,
          source: 'estimation',
          messages,
          artisan_public_id: context.artisan?.publicId,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      setLeadSubmitted(true)
      setShowLeadForm(false)

      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: context.artisan
            ? `Parfait ! Votre demande a bien été envoyée à ${context.artisan.name}. Il vous recontactera dans les plus brefs délais.`
            : `Parfait ! Votre demande a bien été enregistrée. Un ${context.metier.toLowerCase()} qualifié à ${context.ville} vous recontactera dans les plus brefs délais.`,
        },
      ])
    } catch (error) {
      console.error('Lead submission error:', error)
    } finally {
      setLeadLoading(false)
    }
  }

  // --- Callback submit -----------------------------------------------------

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callbackPhone.trim()) return

    setCallbackLoading(true)
    try {
      const response = await fetch('/api/estimation/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: callbackPhone,
          context,
          source: 'callback',
          artisan_public_id: context.artisan?.publicId,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      setCallbackSubmitted(true)
      setCallbackCountdown(30)
    } catch (error) {
      console.error('Callback submission error:', error)
    } finally {
      setCallbackLoading(false)
    }
  }

  // --- Handle form submit --------------------------------------------------

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  // --- Render --------------------------------------------------------------

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Floating Bubble                                                    */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le chat d'estimation"
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#E07040] text-white shadow-lg hover:bg-[#c9603a] focus:outline-none focus:ring-2 focus:ring-[#E07040] focus:ring-offset-2"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* Widget Panel                                                       */}
      {/* ----------------------------------------------------------------- */}
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
              'fixed z-50 flex flex-col bg-white shadow-2xl ' +
              'inset-0 ' +
              'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[600px] sm:rounded-[20px]'
            }
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* ----------------------------------------------------------- */}
            {/* Header                                                       */}
            {/* ----------------------------------------------------------- */}
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

            {/* ----------------------------------------------------------- */}
            {/* Tabs                                                         */}
            {/* ----------------------------------------------------------- */}
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
                Rappel en 30s
              </button>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* Tab Content                                                   */}
            {/* ----------------------------------------------------------- */}
            {activeTab === 'chat' ? (
              <>
                {/* Chat messages area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {/* Welcome message */}
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-800">
                        {context.artisan ? (
                          <>
                            Bonjour ! Je suis l&apos;assistant estimation de{' '}
                            <strong>{context.artisan.name}</strong>,{' '}
                            {context.metier.toLowerCase()} à{' '}
                            <strong>{context.ville}</strong>. Décrivez votre
                            projet et je vous donnerai une estimation de prix.
                          </>
                        ) : (
                          <>
                            Bonjour ! Je suis votre assistant estimation.
                            Dites-moi quel projet vous avez en tête avec votre{' '}
                            <strong>{context.metier.toLowerCase()}</strong> à{' '}
                            <strong>{context.ville}</strong>, et je vous
                            donnerai une estimation de prix.
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Messages */}
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={
                        'flex ' +
                        (msg.role === 'user'
                          ? 'justify-end'
                          : 'justify-start')
                      }
                    >
                      <div
                        className={
                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ' +
                          (msg.role === 'user'
                            ? 'rounded-tr-sm bg-[#E07040] text-white'
                            : 'rounded-tl-sm bg-gray-100 text-gray-800')
                        }
                      >
                        {msg.content}
                        {/* Streaming cursor */}
                        {msg.role === 'assistant' &&
                          idx === messages.length - 1 &&
                          isStreaming && (
                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-gray-400 animate-pulse rounded-sm align-text-bottom" />
                          )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Quick prompts (before first user message) */}
                  {!hasUserMessages && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap gap-2 pt-1"
                    >
                      {prompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          disabled={isStreaming}
                          className="rounded-full border border-[#E07040]/30 bg-[#E07040]/5 px-3 py-1.5 text-xs font-medium text-[#E07040] hover:bg-[#E07040]/10 transition-colors disabled:opacity-50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Lead form (slide up after trigger) */}
                  <AnimatePresence>
                    {showLeadForm && !leadSubmitted && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                      >
                        <form
                          onSubmit={handleLeadSubmit}
                          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {context.artisan
                              ? `Envoyer ma demande à ${context.artisan.name}`
                              : 'Recevoir mon estimation personnalisée'}
                          </p>
                          <input
                            type="text"
                            placeholder="Votre nom (optionnel)"
                            value={leadName}
                            onChange={(e) => setLeadName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
                          />
                          <input
                            type="tel"
                            required
                            placeholder="Votre téléphone *"
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
                            style={{ fontSize: '16px' }}
                          />
                          <input
                            type="email"
                            placeholder="Votre email (optionnel)"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
                          />
                          <button
                            type="submit"
                            disabled={leadLoading || !leadPhone.trim()}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E07040] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#c9603a] transition-colors disabled:opacity-50"
                          >
                            {leadLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ArrowRight className="h-4 w-4" />
                                {context.artisan
                                  ? `Envoyer à ${context.artisan.name}`
                                  : 'Être mis en relation'}
                              </>
                            )}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* Chat input */}
                <form
                  onSubmit={handleChatSubmit}
                  className="flex items-center gap-2 border-t border-gray-200 px-3 py-2.5 shrink-0"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Décrivez votre besoin..."
                    disabled={isStreaming}
                    className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#E07040] disabled:opacity-50"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !inputValue.trim()}
                    aria-label="Envoyer le message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E07040] text-white hover:bg-[#c9603a] transition-colors disabled:opacity-40"
                  >
                    {isStreaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ---------------------------------------------------------- */
              /* Callback Tab                                                */
              /* ---------------------------------------------------------- */
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                {!callbackSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm text-center space-y-5"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E07040]/10">
                      <Phone className="h-7 w-7 text-[#E07040]" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {context.artisan
                          ? `Être rappelé par ${context.artisan.name}`
                          : 'Rappel express'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {context.artisan ? (
                          <>
                            <strong>{context.artisan.name}</strong> vous
                            rappelle en 30 secondes
                          </>
                        ) : (
                          <>
                            Un{' '}
                            <strong>
                              {context.metier.toLowerCase()}
                            </strong>{' '}
                            vérifié à{' '}
                            <strong>{context.ville}</strong> vous
                            rappelle en 30 secondes
                          </>
                        )}
                      </p>
                    </div>
                    <form
                      onSubmit={handleCallbackSubmit}
                      className="space-y-3"
                    >
                      <input
                        type="tel"
                        required
                        placeholder="06 12 34 56 78"
                        value={callbackPhone}
                        onChange={(e) => setCallbackPhone(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        type="submit"
                        disabled={
                          callbackLoading || !callbackPhone.trim()
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E07040] px-4 py-3 text-sm font-semibold text-white hover:bg-[#c9603a] transition-colors disabled:opacity-50"
                      >
                        {callbackLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Phone className="h-4 w-4" />
                            Me faire rappeler
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-sm text-center space-y-5"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        Demande envoyée !
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {context.artisan
                          ? `${context.artisan.name} va vous rappeler`
                          : `Un ${context.metier.toLowerCase()} à ${context.ville} va vous rappeler`}
                      </p>
                    </div>

                    {/* Countdown circle */}
                    {callbackCountdown !== null &&
                      callbackCountdown > 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative flex h-20 w-20 items-center justify-center">
                            <svg
                              className="absolute h-20 w-20 -rotate-90"
                              viewBox="0 0 80 80"
                            >
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="#E07040"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - callbackCountdown / 30)}`}
                                className="transition-all duration-1000 ease-linear"
                              />
                            </svg>
                            <span className="text-2xl font-bold text-gray-900">
                              {callbackCountdown}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            secondes restantes
                          </p>
                        </div>
                      )}

                    {callbackCountdown === 0 && (
                      <p className="text-sm text-gray-600">
                        L&apos;artisan essaie de vous joindre. Si vous
                        ne recevez pas d&apos;appel, réessayez ou
                        utilisez l&apos;onglet estimation.
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* Footer                                                       */}
            {/* ----------------------------------------------------------- */}
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
                </a>{' '}
                · Estimation non contractuelle
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
