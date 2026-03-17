/**
 * Avatar / AvatarGroup Components — Unit Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar, { AvatarGroup } from '@/components/ui/Avatar'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, width, height, className }: {
    src: string; alt: string; width: number; height: number; className?: string
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  User: ({ className }: { className?: string }) => (
    <span data-testid="icon-User" className={className} />
  ),
}))

describe('Avatar', () => {
  it('renders image when src is provided', () => {
    render(<Avatar src="/photo.jpg" name="John Doe" />)
    const img = screen.getByAltText('John Doe')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/photo.jpg')
  })

  it('renders initials when name is provided but no src', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders single initial for single name', () => {
    render(<Avatar name="John" />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders max 2 initials for long names', () => {
    render(<Avatar name="John Michael Doe" />)
    expect(screen.getByText('JM')).toBeInTheDocument()
  })

  it('renders User icon when no src and no name', () => {
    render(<Avatar />)
    expect(screen.getByTestId('icon-User')).toBeInTheDocument()
  })

  it('applies correct size classes for sm', () => {
    const { container } = render(<Avatar name="AB" size="sm" />)
    const inner = container.querySelector('.w-8')
    expect(inner).toBeInTheDocument()
  })

  it('applies correct size classes for lg', () => {
    const { container } = render(<Avatar name="AB" size="lg" />)
    const inner = container.querySelector('.w-14')
    expect(inner).toBeInTheDocument()
  })

  it('renders status indicator when status is provided', () => {
    render(<Avatar name="John" status="online" />)
    const statusDot = screen.getByLabelText('Status: online')
    expect(statusDot).toBeInTheDocument()
    expect(statusDot.className).toContain('bg-green-500')
  })

  it('renders offline status correctly', () => {
    render(<Avatar name="John" status="offline" />)
    const statusDot = screen.getByLabelText('Status: offline')
    expect(statusDot.className).toContain('bg-gray-400')
  })

  it('renders busy status correctly', () => {
    render(<Avatar name="John" status="busy" />)
    const statusDot = screen.getByLabelText('Status: busy')
    expect(statusDot.className).toContain('bg-red-500')
  })

  it('renders away status correctly', () => {
    render(<Avatar name="John" status="away" />)
    const statusDot = screen.getByLabelText('Status: away')
    expect(statusDot.className).toContain('bg-amber-500')
  })

  it('does not render status indicator when not provided', () => {
    render(<Avatar name="John" />)
    expect(screen.queryByLabelText(/Status:/)).not.toBeInTheDocument()
  })

  it('uses alt prop for image alt text', () => {
    render(<Avatar src="/photo.jpg" alt="Profile picture" />)
    expect(screen.getByAltText('Profile picture')).toBeInTheDocument()
  })

  it('falls back to "Avatar" alt when no name or alt', () => {
    render(<Avatar src="/photo.jpg" />)
    expect(screen.getByAltText('Avatar')).toBeInTheDocument()
  })
})

describe('AvatarGroup', () => {
  const avatars = [
    { name: 'Alice' },
    { name: 'Bob' },
    { name: 'Charlie' },
    { name: 'Diana' },
    { name: 'Eve' },
    { name: 'Frank' },
  ]

  it('renders up to max avatars', () => {
    render(<AvatarGroup avatars={avatars} max={4} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('D')).toBeInTheDocument()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })

  it('shows remaining count when avatars exceed max', () => {
    render(<AvatarGroup avatars={avatars} max={4} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show remaining count when all fit', () => {
    render(<AvatarGroup avatars={avatars.slice(0, 3)} max={4} />)
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
  })

  it('defaults to max=4', () => {
    render(<AvatarGroup avatars={avatars} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
