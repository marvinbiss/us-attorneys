import { clsx } from 'clsx'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
  color?: 'primary' | 'white' | 'gray'
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const colors = {
  primary: 'border-blue-600',
  white: 'border-white',
  gray: 'border-gray-600',
}

export function Loading({ size = 'md', variant = 'spinner', className, color = 'primary' }: LoadingProps) {
  if (variant === 'dots') {
    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    }
    const dotColors = {
      primary: 'bg-blue-600',
      white: 'bg-white',
      gray: 'bg-gray-600',
    }
    return (
      <div className={clsx('flex items-center gap-1', className)} role="status" aria-label="Loading">
        <span className={clsx(dotSizes[size], dotColors[color], 'rounded-full animate-[bounce_1.4s_ease-in-out_infinite]')} style={{ animationDelay: '0ms' }} />
        <span className={clsx(dotSizes[size], dotColors[color], 'rounded-full animate-[bounce_1.4s_ease-in-out_infinite]')} style={{ animationDelay: '160ms' }} />
        <span className={clsx(dotSizes[size], dotColors[color], 'rounded-full animate-[bounce_1.4s_ease-in-out_infinite]')} style={{ animationDelay: '320ms' }} />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={clsx(sizes[size], 'relative', className)} role="status" aria-label="Loading">
        <div className={clsx('absolute inset-0 rounded-full bg-blue-600/30 animate-ping')} />
        <div className={clsx('absolute inset-2 rounded-full bg-blue-600')} />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full border-[3px] border-gray-200/60',
        colors[color].replace('border-', 'border-t-'),
        sizes[size],
        className
      )}
      style={{
        animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loading size="lg" />
      <p className="text-gray-500 text-sm animate-pulse">Loading...</p>
    </div>
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-600/20 animate-ping" />
        <Loading size="xl" />
      </div>
      {message && (
        <p className="text-gray-700 font-medium animate-pulse">{message}</p>
      )}
    </div>
  )
}

export function LoadingButton() {
  return <Loading size="sm" color="white" />
}

export function LoadingInline({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-gray-500">
      <Loading size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}

export default Loading
