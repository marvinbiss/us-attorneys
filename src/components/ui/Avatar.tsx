import { forwardRef, ImgHTMLAttributes } from 'react'
import { User } from 'lucide-react'
import { clsx } from 'clsx'
import Image from 'next/image'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'busy' | 'away'
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
}

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
}

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, name, size = 'md', status, className, alt }, ref) => {
    const hasImage = Boolean(src)
    const initials = name ? getInitials(name) : null
    const bgColor = name ? getColorFromName(name) : 'bg-gray-200'

    return (
      <div
        ref={ref}
        className={clsx('relative inline-flex flex-shrink-0', className)}
      >
        {hasImage ? (
          <Image
            src={src!}
            alt={alt || name || 'Avatar'}
            width={sizePx[size]}
            height={sizePx[size]}
            sizes={`${sizePx[size]}px`}
            className={clsx(
              'rounded-full object-cover',
              sizes[size]
            )}
          />
        ) : (
          <div
            className={clsx(
              'rounded-full flex items-center justify-center font-medium text-white',
              sizes[size],
              bgColor
            )}
          >
            {initials || <User className={iconSizes[size]} />}
          </div>
        )}

        {status && (
          <span
            className={clsx(
              'absolute bottom-0 right-0 rounded-full border-2 border-white',
              statusSizes[size],
              statusColors[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string }>
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center font-medium bg-gray-100 text-gray-600 ring-2 ring-white',
            sizes[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default Avatar
