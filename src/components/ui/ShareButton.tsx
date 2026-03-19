'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Link2, Mail, X } from 'lucide-react'
import { clsx } from 'clsx'

interface ShareButtonProps {
  url: string
  title: string
  description?: string
  className?: string
  variant?: 'icon' | 'button'
}

interface ShareOption {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color: string
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

export function ShareButton({
  url: urlProp,
  title,
  description,
  className,
  variant = 'button',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(urlProp)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Resolve URL on client side if empty (avoids SSR hydration issues)
  useEffect(() => {
    if (!currentUrl && typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [currentUrl])

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text: description || title,
        url: currentUrl,
      })
    } catch {
      // User cancelled or error — fall through
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = currentUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClick = () => {
    // Use native Web Share API on mobile if available
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      handleNativeShare()
    } else {
      setIsOpen((prev) => !prev)
    }
  }

  const encodedUrl = encodeURIComponent(currentUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description || title)

  const shareOptions: ShareOption[] = [
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="h-4 w-4" />,
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodedDesc}%20${encodedUrl}`,
          '_blank',
          'noopener,noreferrer'
        )
        setIsOpen(false)
      },
      color: 'text-green-600 hover:bg-green-50',
    },
    {
      label: 'Facebook',
      icon: <FacebookIcon className="h-4 w-4" />,
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          '_blank',
          'noopener,noreferrer'
        )
        setIsOpen(false)
      },
      color: 'text-blue-600 hover:bg-blue-50',
    },
    {
      label: 'X (Twitter)',
      icon: <XIcon className="h-4 w-4" />,
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
          '_blank',
          'noopener,noreferrer'
        )
        setIsOpen(false)
      },
      color: 'text-gray-900 hover:bg-gray-100',
    },
    {
      label: 'Email',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`
        setIsOpen(false)
      },
      color: 'text-gray-600 hover:bg-gray-100',
    },
    {
      label: copied ? 'Link copied!' : 'Copy link',
      icon: <Link2 className="h-4 w-4" />,
      onClick: () => {
        handleCopyLink()
      },
      color: copied ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-gray-100',
    },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleClick}
          className={clsx(
            'rounded-full border border-gray-100 bg-gray-50 p-2.5 transition-all duration-200 hover:bg-gray-100',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            className
          )}
          aria-label="Share"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Share2 className="w-4.5 h-4.5 text-slate-600" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2',
            'bg-white text-sm font-medium text-gray-700',
            'transition-all duration-200 hover:border-gray-300 hover:bg-gray-50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            className
          )}
          aria-label="Share"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      )}

      {/* Dropdown menu (desktop fallback) */}
      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg',
            'py-1'
          )}
          role="menu"
          aria-label="Share options"
        >
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Share via</p>
          </div>
          {shareOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={option.onClick}
              className={clsx(
                'flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                option.color
              )}
              role="menuitem"
            >
              {option.icon}
              <span className="font-medium">{option.label}</span>
            </button>
          ))}
          <div className="mt-1 border-t border-gray-100 px-3 pb-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-1.5 py-2.5 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShareButton
