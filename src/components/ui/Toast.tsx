'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { clsx } from 'clsx'
import type { Toast as ToastType, ToastType as ToastTypeEnum } from '@/hooks/useToast'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const icons: Record<ToastTypeEnum, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles: Record<ToastTypeEnum, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const iconStyles: Record<ToastTypeEnum, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = icons[toast.type]

  useEffect(() => {
    // Trigger enter animation
    const frameId = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => cancelAnimationFrame(frameId)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(toast.id), 150)
  }

  return (
    <div
      className={clsx(
        'flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        'transition-all duration-150 ease-out',
        styles[toast.type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      <Icon className={clsx('mt-0.5 h-5 w-5 flex-shrink-0', iconStyles[toast.type])} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex min-h-[44px] min-w-[44px] flex-shrink-0 touch-manipulation items-center justify-center rounded-lg p-2.5 transition-colors hover:bg-black/10"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastType[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export default Toast
