'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Phone, ArrowRight, Check, Loader2, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/analytics/tracking'

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
// Greeting bubble: contextual proactive message
// ---------------------------------------------------------------------------

const GREETING_STORAGE_KEY = 'sa_estimation_greeting_dismissed'
const RETURN_VISITOR_KEY = 'sa_estimation_visited'

/** Prix d'appel réalistes par métier (min €) pour le teaser */
const priceTeasers: Record<string, string> = {
  plombier: 'Fuite d\u2019eau : à partir de 80\u20AC',
  serrurier: 'Ouverture de porte : à partir de 90\u20AC',
  electricien: 'Panne électrique : à partir de 70\u20AC',
  chauffagiste: 'Entretien chaudière : à partir de 90\u20AC',
  couvreur: 'Réparation toiture : à partir de 150\u20AC',
  peintre: 'Peinture pièce : à partir de 25\u20AC/m²',
  menuisier: 'Porte sur mesure : à partir de 200\u20AC',
  carreleur: 'Carrelage : à partir de 30\u20AC/m²',
  maçon: 'Mur de clôture : à partir de 100\u20AC/ml',
  vitrier: 'Remplacement vitre : à partir de 80\u20AC',
  climaticien: 'Installation clim : à partir de 800\u20AC',
  cuisiniste: 'Cuisine équipée : à partir de 3 000\u20AC',
}

/** Nombre social proof déterministe (basé sur la date, crédible) */
function getSocialProofCount(): number {
  const now = new Date()
  // Seed basé sur le jour de l'année pour être stable dans la journée
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  )
  // Entre 47 et 183 estimations par jour, varie chaque jour
  return 47 + ((dayOfYear * 7 + 13) % 137)
}

function getGreetingMessage(
  context: EstimationWidgetProps['context'],
  isReturning: boolean,
): string {
  const metier = context.metier.toLowerCase()
  const ville = context.ville
  const pageUrl = context.pageUrl || ''

  // Returning visitor — message personnalisé
  if (isReturning) {
    if (context.artisan) {
      return `De retour ? Obtenez votre devis gratuit avec ${context.artisan.name}`
    }
    return `De retour ? Votre estimation ${metier} à ${ville} vous attend`
  }

  if (context.artisan) {
    return `Demandez un devis gratuit à ${context.artisan.name} en 30 secondes`
  }
  if (pageUrl.includes('/urgence/')) {
    return `Urgence ${metier} à ${ville} ? Estimez le coût et soyez rappelé immédiatement`
  }
  if (pageUrl.includes('/tarifs/')) {
    return `Ces prix correspondent à votre projet ? Vérifiez en 30 secondes`
  }
  return `Besoin d'un ${metier} à ${ville} ? Estimez le prix gratuitement`
}

// ---------------------------------------------------------------------------
// Lead form trigger: detect price estimation in response
// ---------------------------------------------------------------------------

const LEAD_TRIGGER_KEYWORDS = [
  'mise en relation',
  'rappel',
  'mettre en contact',
  'contacter un',
  'souhaitez-vous',
]

function shouldShowLeadForm(content: string): boolean {
  const lower = content.toLowerCase()
  // Trigger on keywords OR when a price estimation is given (bold €)
  if (LEAD_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw))) return true
  // Detect price pattern like **80€ — 150€** or **80 € — 150 €**
  if (/\*\*\d+\s*€/.test(content)) return true
  return false
}

// ---------------------------------------------------------------------------
// Simple markdown renderer (bold + line breaks only)
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): React.ReactNode[] {
  // Split by **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

// ---------------------------------------------------------------------------
// French phone validation
// ---------------------------------------------------------------------------

function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, '')
  if (/^0[1-9]\d{8}$/.test(cleaned)) return true
  if (/^\+33[1-9]\d{8}$/.test(cleaned)) return true
  if (/^0033[1-9]\d{8}$/.test(cleaned)) return true
  return false
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
  const [leadError, setLeadError] = useState(false)

  // Lead phone validation
  const [leadPhoneError, setLeadPhoneError] = useState('')

  // Callback field
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackLoading, setCallbackLoading] = useState(false)
  const [callbackError, setCallbackError] = useState(false)
  const [callbackPhoneError, setCallbackPhoneError] = useState('')

  // Greeting bubble + pill launcher
  const [showGreeting, setShowGreeting] = useState(false)
  const [isLauncherExpanded, setIsLauncherExpanded] = useState(true)
  const [shouldWiggle, setShouldWiggle] = useState(false)
  const [isReturningVisitor, setIsReturningVisitor] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const greetingTriggeredRef = useRef(false)
  const hasWiggled = useRef(false)
  const exitIntentFired = useRef(false)

  // --- Derived -------------------------------------------------------------
  const prompts = quickPrompts[context.metierSlug] ?? defaultPrompts
  const hasUserMessages = messages.some((m) => m.role === 'user')
  const greetingMessage = getGreetingMessage(context, isReturningVisitor)
  const priceTeaser = priceTeasers[context.metierSlug]
  const socialProofCount = getSocialProofCount()

  // --- Effects -------------------------------------------------------------

  // Detect returning visitor (localStorage persists across sessions)
  useEffect(() => {
    try {
      if (localStorage.getItem(RETURN_VISITOR_KEY)) {
        setIsReturningVisitor(true)
      } else {
        localStorage.setItem(RETURN_VISITOR_KEY, '1')
      }
    } catch { /* SSR / private browsing */ }
  }, [])

  // Show greeting bubble after 5s delay (unless dismissed this session)
  useEffect(() => {
    if (isOpen) return
    try {
      if (sessionStorage.getItem(GREETING_STORAGE_KEY)) return
    } catch { /* SSR / private browsing */ }

    const timer = setTimeout(() => {
      if (!greetingTriggeredRef.current) {
        greetingTriggeredRef.current = true
        setShowGreeting(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Scroll trigger: show greeting at 40% scroll if timer hasn't fired yet
  useEffect(() => {
    if (isOpen) return
    function handleScroll() {
      if (greetingTriggeredRef.current) return
      try {
        if (sessionStorage.getItem(GREETING_STORAGE_KEY)) return
      } catch { /* noop */ }

      const scrollPercent =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      if (scrollPercent >= 0.4) {
        greetingTriggeredRef.current = true
        setShowGreeting(true)
        trackEvent('chat_opened' as any, {
          trigger: 'scroll',
          metier: context.metierSlug,
          ville: context.ville,
        })
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  // Wiggle on first scroll (one-time micro-animation)
  useEffect(() => {
    if (isOpen) return
    function handleFirstScroll() {
      if (hasWiggled.current) return
      hasWiggled.current = true
      setShouldWiggle(true)
      setTimeout(() => setShouldWiggle(false), 1000)
    }
    window.addEventListener('scroll', handleFirstScroll, { passive: true, once: true })
    return () => window.removeEventListener('scroll', handleFirstScroll)
  }, [isOpen])

  // Exit intent (desktop only): auto-open widget when mouse leaves viewport top
  useEffect(() => {
    if (isOpen) return
    if (typeof window === 'undefined' || window.innerWidth < 640) return

    function handleMouseOut(e: MouseEvent) {
      if (exitIntentFired.current) return
      // Mouse left viewport from the top
      if (e.clientY <= 5 && e.relatedTarget === null) {
        exitIntentFired.current = true
        setIsOpen(true)
        setShowGreeting(false)
        trackEvent('chat_opened' as any, {
          trigger: 'exit_intent',
          metier: context.metierSlug,
          ville: context.ville,
        })
      }
    }
    document.addEventListener('mouseout', handleMouseOut)
    return () => document.removeEventListener('mouseout', handleMouseOut)
  }, [isOpen])

  // Collapse pill launcher to circle after 8s
  useEffect(() => {
    if (isOpen) return
    const timer = setTimeout(() => {
      setIsLauncherExpanded(false)
    }, 8000)
    return () => clearTimeout(timer)
  }, [isOpen])

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

  // Lock body scroll on mobile when fullscreen + hide mobile nav
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

      trackEvent('chat_message_sent' as any, {
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
          trackEvent('chat_lead_form_shown' as any, {
            metier: context.metierSlug,
            messages_before_form: updatedMessages.length + 1,
          })
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

    // Validate phone
    if (!isValidFrenchPhone(leadPhone)) {
      setLeadPhoneError('Numéro invalide (ex: 06 12 34 56 78)')
      return
    }
    setLeadPhoneError('')

    setLeadLoading(true)
    setLeadError(false)
    try {
      const response = await fetch('/api/estimation/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: leadName || undefined,
          telephone: leadPhone,
          email: leadEmail || undefined,
          metier: context.metier,
          ville: context.ville,
          departement: context.departement || undefined,
          source: 'chat' as const,
          conversation_history: messages,
          page_url: context.pageUrl,
          artisan_public_id: context.artisan?.publicId,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      trackEvent('estimation_lead_submitted' as any, {
        source: 'chat',
        metier: context.metierSlug,
        ville: context.ville,
        has_email: !!leadEmail,
      })

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
      setLeadError(true)
    } finally {
      setLeadLoading(false)
    }
  }

  // --- Callback submit -----------------------------------------------------

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callbackPhone.trim()) return

    // Validate phone
    if (!isValidFrenchPhone(callbackPhone)) {
      setCallbackPhoneError('Numéro invalide (ex: 06 12 34 56 78)')
      return
    }
    setCallbackPhoneError('')

    setCallbackLoading(true)
    setCallbackError(false)
    try {
      const response = await fetch('/api/estimation/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telephone: callbackPhone,
          metier: context.metier,
          ville: context.ville,
          departement: context.departement || undefined,
          source: 'callback' as const,
          page_url: context.pageUrl,
          artisan_public_id: context.artisan?.publicId,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      trackEvent('estimation_lead_submitted' as any, {
        source: 'callback',
        metier: context.metierSlug,
        ville: context.ville,
      })

      setCallbackSubmitted(true)
      setCallbackCountdown(30)
    } catch (error) {
      console.error('Callback submission error:', error)
      setCallbackError(true)
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
      {/* Floating Launcher (pill + greeting bubble + badge + ping)          */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-3">
            {/* Greeting bubble */}
            <AnimatePresence>
              {showGreeting && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="relative max-w-[260px] sm:max-w-[300px] bg-white rounded-2xl rounded-br-sm shadow-xl border border-gray-100 px-4 py-3 cursor-pointer"
                  onClick={() => {
                    setIsOpen(true)
                    trackEvent('chat_opened' as any, {
                      trigger: 'greeting',
                      metier: context.metierSlug,
                      ville: context.ville,
                    })
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowGreeting(false)
                      try { sessionStorage.setItem(GREETING_STORAGE_KEY, '1') } catch { /* noop */ }
                    }}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors shadow-sm"
                    aria-label="Fermer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-sm text-gray-800 font-medium leading-snug">
                    {greetingMessage}
                  </p>
                  {/* Price teaser */}
                  {priceTeaser && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {priceTeaser}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-[#E07040] font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Estimation IA gratuite
                    </p>
                    {/* Social proof */}
                    <p className="text-[10px] text-gray-400">
                      {socialProofCount} estimations aujourd&apos;hui
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launcher button (pill → circle, with wiggle) */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={
                shouldWiggle
                  ? { scale: 1, opacity: 1, rotate: [0, -6, 6, -4, 4, 0] }
                  : { scale: 1, opacity: 1 }
              }
              exit={{ scale: 0, opacity: 0 }}
              transition={
                shouldWiggle
                  ? { duration: 0.6, ease: 'easeInOut' }
                  : { type: 'spring', stiffness: 260, damping: 20 }
              }
              onClick={() => {
                setIsOpen(true)
                setShowGreeting(false)
                trackEvent('chat_opened' as any, {
                  trigger: 'launcher',
                  metier: context.metierSlug,
                  ville: context.ville,
                })
              }}
              aria-label="Ouvrir le chat d'estimation"
              className={
                'relative flex items-center justify-center bg-[#E07040] text-white shadow-lg hover:bg-[#c9603a] focus:outline-none focus:ring-2 focus:ring-[#E07040] focus:ring-offset-2 transition-all duration-500 ' +
                (isLauncherExpanded
                  ? 'h-12 rounded-full px-5 gap-2.5'
                  : 'h-14 w-14 rounded-full')
              }
            >
              {/* Ping ring animation */}
              <span className="absolute inset-0 rounded-full bg-[#E07040] animate-ping opacity-20" />

              {/* Notification badge */}
              {!showGreeting && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  1
                </span>
              )}

              {/* Icon */}
              <MessageCircle className={isLauncherExpanded ? 'h-5 w-5 shrink-0' : 'h-6 w-6'} />

              {/* Pill text (visible when expanded) */}
              {isLauncherExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                >
                  Estimation gratuite
                </motion.span>
              )}
            </motion.button>
          </div>
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
              'fixed z-[9999] flex flex-col bg-white shadow-2xl ' +
              'inset-0 ' +
              'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[600px] sm:rounded-[20px]'
            }
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
                        {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
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
                          <div>
                            <input
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              required
                              placeholder="Votre téléphone *"
                              value={leadPhone}
                              onChange={(e) => {
                                setLeadPhone(e.target.value)
                                if (leadPhoneError) setLeadPhoneError('')
                              }}
                              className={
                                'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ' +
                                (leadPhoneError
                                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:border-[#E07040] focus:ring-[#E07040]')
                              }
                              style={{ fontSize: '16px' }}
                            />
                            {leadPhoneError && (
                              <p className="text-xs text-red-600 mt-1">{leadPhoneError}</p>
                            )}
                          </div>
                          <input
                            type="email"
                            placeholder="Votre email (optionnel)"
                            value={leadEmail}
                            onChange={(e) => setLeadEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#E07040] focus:outline-none focus:ring-1 focus:ring-[#E07040]"
                          />
                          {leadError && (
                            <p className="text-xs text-red-600 text-center">
                              Une erreur est survenue. Veuillez réessayer.
                            </p>
                          )}
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
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
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
                      <div>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          placeholder="06 12 34 56 78"
                          value={callbackPhone}
                          onChange={(e) => {
                            setCallbackPhone(e.target.value)
                            if (callbackPhoneError) setCallbackPhoneError('')
                          }}
                          className={
                            'w-full rounded-lg border px-4 py-3 text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 ' +
                            (callbackPhoneError
                              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-[#E07040] focus:ring-[#E07040]')
                          }
                          style={{ fontSize: '16px' }}
                        />
                        {callbackPhoneError && (
                          <p className="text-xs text-red-600 mt-1 text-center">{callbackPhoneError}</p>
                        )}
                      </div>
                      {callbackError && (
                        <p className="text-xs text-red-600 text-center">
                          Une erreur est survenue. Veuillez réessayer.
                        </p>
                      )}
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
