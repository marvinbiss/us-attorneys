'use client'

import Link from 'next/link'
import { clsx } from 'clsx'

export interface LogoProps {
  variant?: 'full' | 'icon' | 'text'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'light' | 'dark' | 'auto'
  href?: string
  className?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-xl' },
  lg: { icon: 44, text: 'text-2xl' },
  xl: { icon: 52, text: 'text-3xl' },
}

export default function Logo({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  href = '/',
  className,
}: LogoProps) {
  const { icon: iconSize, text: textSize } = sizes[size]

  const textColor = theme === 'dark'
    ? 'text-white'
    : theme === 'light'
    ? 'text-gray-900'
    : 'text-gray-900 dark:text-white'

  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logoGradient)" />

      {/* House roof — clean proportions */}
      <path
        d="M24 10L9 22.5H13.5V36H34.5V22.5H39L24 10Z"
        fill="white"
        fillOpacity="0.95"
      />

      {/* Wrench — simplified, bolder */}
      <path
        d="M21.5 24.5C21.5 22.57 23.07 21 25 21C26.38 21 27.56 21.82 28.1 22.99L31.5 20.5L32.5 21.5L29.1 24.01C29.37 24.48 29.5 25.02 29.5 25.5C29.5 27.43 27.93 29 26 29C24.62 29 23.44 28.18 22.9 27.01L19.5 29.5L18.5 28.5L21.9 25.99C21.63 25.52 21.5 24.98 21.5 24.5Z"
        fill="#2563eb"
      />

      {/* Door */}
      <rect x="21.5" y="29.5" width="5" height="6.5" rx="1.5" fill="#2563eb" fillOpacity="0.25" />

      {/* Amber quality mark */}
      <circle cx="39" cy="9" r="5" fill="url(#logoAccent)" />
      <path
        d="M37.5 9L38.5 10L40.5 8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )

  const LogoText = () => (
    <span className={clsx('font-heading font-extrabold tracking-tight', textSize, textColor)}>
      US<span className="text-blue-600">Attorneys</span>
    </span>
  )

  const content = (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {(variant === 'full' || variant === 'icon') && <LogoIcon />}
      {(variant === 'full' || variant === 'text') && <LogoText />}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
        {content}
      </Link>
    )
  }

  return content
}

// Tagline component
export function Tagline({ className }: { className?: string }) {
  return (
    <p className={clsx('text-gray-600 dark:text-gray-400', className)}>
      Find qualified attorneys near you
    </p>
  )
}

// Full brand header with logo and tagline
export function BrandHeader({
  size = 'lg',
  centered = false,
  className,
}: {
  size?: LogoProps['size']
  centered?: boolean
  className?: string
}) {
  return (
    <div className={clsx(centered && 'text-center', className)}>
      <Logo size={size} variant="full" className={centered ? 'justify-center' : ''} />
      <Tagline className={clsx('mt-1', size === 'sm' && 'text-sm', size === 'xl' && 'text-lg')} />
    </div>
  )
}
