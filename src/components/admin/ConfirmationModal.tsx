'use client'

import { useState, useEffect, useRef } from 'react'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { clsx } from 'clsx'

type ModalVariant = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ModalVariant
  requireConfirmation?: string // Text user must type to confirm
  children?: React.ReactNode
}

const variantConfig: Record<ModalVariant, { icon: typeof AlertTriangle; colors: string; buttonColors: string }> = {
  danger: {
    icon: AlertTriangle,
    colors: 'bg-red-100 text-red-600',
    buttonColors: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    colors: 'bg-amber-100 text-amber-600',
    buttonColors: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  success: {
    icon: CheckCircle,
    colors: 'bg-green-100 text-green-600',
    buttonColors: 'bg-green-600 hover:bg-green-700 text-white',
  },
  info: {
    icon: Info,
    colors: 'bg-blue-100 text-blue-600',
    buttonColors: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requireConfirmation,
  children,
}: ConfirmationModalProps) {
  const [confirmInput, setConfirmInput] = useState('')
  const [loading, setLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Trap focus inside modal: cycle Tab/Shift+Tab, close on Escape
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    modal.addEventListener('keydown', handleKeyDown)
    return () => modal.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const config = variantConfig[variant]
  const Icon = config.icon
  const canConfirm = !requireConfirmation || confirmInput === requireConfirmation

  const handleConfirm = async () => {
    if (!canConfirm) return
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error: unknown) {
      console.error('Confirmation action failed:', error)
    } finally {
      setLoading(false)
      setConfirmInput('')
    }
  }

  const handleClose = () => {
    setConfirmInput('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-modal-title"
          tabIndex={-1}
          className="relative bg-white rounded-xl shadow-xl max-w-[95vw] sm:max-w-md w-full p-6"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center mb-4', config.colors)}>
            <Icon className="w-6 h-6" />
          </div>

          {/* Content */}
          <h3 id="confirmation-modal-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>

          {/* Custom content */}
          {children}

          {/* Confirmation input */}
          {requireConfirmation && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Type <span className="font-mono font-semibold text-gray-900">{requireConfirmation}</span> to confirm
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type to confirm"
                aria-label="Enter confirmation text"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !canConfirm}
              className={clsx(
                'px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                config.buttonColors
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for using confirmation modal
export function useConfirmation() {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: ModalVariant
    confirmText?: string
    requireConfirmation?: string
    onConfirm: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => {},
  })

  const confirm = ({
    title,
    message,
    variant = 'danger',
    confirmText,
    requireConfirmation,
  }: {
    title: string
    message: string
    variant?: ModalVariant
    confirmText?: string
    requireConfirmation?: string
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        variant,
        confirmText,
        requireConfirmation,
        onConfirm: () => {
          resolve(true)
          setModalState((prev) => ({ ...prev, isOpen: false }))
        },
      })
    })
  }

  const close = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  const ConfirmationModalComponent = () => (
    <ConfirmationModal
      isOpen={modalState.isOpen}
      onClose={close}
      onConfirm={modalState.onConfirm}
      title={modalState.title}
      message={modalState.message}
      variant={modalState.variant}
      confirmText={modalState.confirmText}
      requireConfirmation={modalState.requireConfirmation}
    />
  )

  return { confirm, ConfirmationModal: ConfirmationModalComponent }
}
