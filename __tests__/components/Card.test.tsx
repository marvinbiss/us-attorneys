/**
 * Card / CardHeader / CardContent / CardFooter Components — Unit Tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card, { CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    const { container } = render(<Card>Default</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('bg-white')
    expect(card.className).toContain('border')
    expect(card.className).toContain('shadow-sm')
  })

  it('applies outlined variant', () => {
    const { container } = render(<Card variant="outlined">Outlined</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('bg-transparent')
    expect(card.className).toContain('border-2')
  })

  it('applies elevated variant', () => {
    const { container } = render(<Card variant="elevated">Elevated</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('bg-white')
    expect(card.className).toContain('shadow-')
  })

  it('applies premium variant with gradient', () => {
    const { container } = render(<Card variant="premium">Premium</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('bg-gradient-to-br')
  })

  it('applies padding none', () => {
    const { container } = render(<Card padding="none">No pad</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).not.toContain('p-4')
    expect(card.className).not.toContain('p-6')
    expect(card.className).not.toContain('p-8')
  })

  it('applies padding sm', () => {
    const { container } = render(<Card padding="sm">Small pad</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('p-4')
  })

  it('applies padding lg', () => {
    const { container } = render(<Card padding="lg">Large pad</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('p-8')
  })

  it('applies hover styles when hover=true', () => {
    const { container } = render(<Card hover>Hover</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('cursor-pointer')
    expect(card.className).toContain('hover:-translate-y-1')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="my-card">Custom</Card>)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('my-card')
  })

  it('forwards ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Card ref={ref}>Ref</Card>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

describe('CardHeader', () => {
  it('renders title', () => {
    render(<CardHeader title="Header Title" />)
    expect(screen.getByText('Header Title')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />)
    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('renders action slot when provided', () => {
    render(<CardHeader title="Title" action={<button>Edit</button>} />)
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    const { container } = render(<CardHeader title="Only Title" />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })
})

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content area</CardContent>)
    expect(screen.getByText('Content area')).toBeInTheDocument()
  })

  it('applies mt-4 by default', () => {
    const { container } = render(<CardContent>Content</CardContent>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('mt-4')
  })
})

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer area</CardFooter>)
    expect(screen.getByText('Footer area')).toBeInTheDocument()
  })

  it('applies border-t styling', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain('border-t')
  })
})
