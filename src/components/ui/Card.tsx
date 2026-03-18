import { forwardRef, HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'premium'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm',
      outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700 rounded-2xl',
      elevated: 'bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06),0_12px_40px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3),0_12px_40px_-4px_rgba(0,0,0,0.4)]',
      premium: 'bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-blue-950/50 border border-blue-100/50 dark:border-blue-900/50 rounded-2xl shadow-[0_4px_20px_-2px_rgba(37,99,235,0.08),0_12px_40px_-4px_rgba(37,99,235,0.06)]',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={clsx(
          variants[variant],
          paddings[padding],
          'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          hover && 'hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12),0_20px_60px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between', className)} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={clsx('mt-4', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={clsx('mt-6 pt-4 border-t border-gray-100 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  )
}

export default Card
