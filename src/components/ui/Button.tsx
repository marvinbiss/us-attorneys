'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'premium'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center gap-2',
      'font-medium rounded-xl',
      'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'active:scale-[0.98]',
      'touch-manipulation',
    ]

    const variants = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'focus-visible:ring-blue-500',
        'shadow-[0_4px_14px_0_rgba(37,99,235,0.25)]',
        'hover:shadow-[0_8px_25px_0_rgba(37,99,235,0.35)]',
        'hover:-translate-y-[2px]',
      ],
      secondary: [
        'bg-violet-600 text-white',
        'hover:bg-violet-700',
        'focus-visible:ring-violet-500',
        'shadow-[0_4px_14px_0_rgba(139,92,246,0.25)]',
        'hover:shadow-[0_8px_25px_0_rgba(139,92,246,0.35)]',
        'hover:-translate-y-[2px]',
      ],
      outline: [
        'bg-transparent border-2 border-blue-600 text-blue-600',
        'hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700',
        'focus-visible:ring-blue-500',
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100/80',
        'focus-visible:ring-gray-500',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'focus-visible:ring-red-500',
        'shadow-[0_4px_14px_0_rgba(239,68,68,0.25)]',
        'hover:shadow-[0_8px_25px_0_rgba(239,68,68,0.35)]',
        'hover:-translate-y-[2px]',
      ],
      premium: [
        'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold',
        'hover:from-amber-600 hover:via-amber-500 hover:to-amber-600',
        'focus-visible:ring-amber-500',
        'shadow-[0_4px_20px_0_rgba(245,158,11,0.35)]',
        'hover:shadow-[0_10px_35px_0_rgba(245,158,11,0.45)]',
        'hover:-translate-y-[3px]',
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700',
      ],
    }

    const sizes = {
      sm: 'px-3.5 py-2 text-sm min-h-[44px] min-w-[44px]',
      md: 'px-5 py-2.5 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[48px]',
      xl: 'px-8 py-4 text-lg min-h-[52px]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
