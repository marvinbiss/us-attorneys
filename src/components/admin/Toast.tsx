'use client'
import { useEffect } from 'react'

interface ToastProps {
  toast: { type: 'success' | 'error'; message: string } | null
  onClose: () => void
  duration?: number
}

export function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const t = setTimeout(onClose, duration)
      return () => clearTimeout(t)
    }
  }, [toast, onClose, duration])

  if (!toast) return null

  return (
    <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{toast.message}</span>
        <button onClick={onClose} className="text-current opacity-50 hover:opacity-100" aria-label="Close">×</button>
      </div>
    </div>
  )
}
