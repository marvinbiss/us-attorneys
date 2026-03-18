'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toasts, removeToast, success: toastSuccess } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error subscribing')
      }

      setIsSubmitted(true)
      toastSuccess('Subscribed!', 'You will receive our latest updates.')
      setEmail('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error subscribing')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <>
        <div className="flex items-center gap-3 px-5 py-3.5 bg-green-500/20 border border-green-500/30 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-medium">Thank you for subscribing!</span>
        </div>
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full max-w-md gap-3" aria-busy={isLoading}>
      <div className="flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-label="Email address for newsletter"
          required
          disabled={isLoading}
          className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        aria-label="Subscribe to the newsletter"
        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Subscribe"
        )}
      </button>
    </form>
  )
}
