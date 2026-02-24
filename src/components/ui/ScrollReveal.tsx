'use client'

import { useRef, useEffect, useState, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
  distance?: number
  /** Whether the element should be a section (for semantic HTML) */
  as?: 'div' | 'section'
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  distance = 24,
  as = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Start visible (SSR-safe) — animation only kicks in after hydration
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // After hydration, hide elements that are below the fold so they can animate in
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    if (!mq.matches) {
      const el = ref.current
      if (el) {
        const rect = el.getBoundingClientRect()
        // Only hide elements that are below the current viewport (not yet scrolled to)
        if (rect.top > window.innerHeight) {
          setIsVisible(false)
        }
      }
    }

    setMounted(true)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!mounted || prefersReducedMotion || isVisible) return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { rootMargin: '0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [mounted, prefersReducedMotion, isVisible])

  const directions: Record<string, string> = {
    up: `translateY(${distance}px)`,
    down: `translateY(-${distance}px)`,
    left: `translateX(${distance}px)`,
    right: `translateX(-${distance}px)`,
    none: 'none',
  }

  const Component = as === 'section' ? 'section' : 'div'

  const shouldAnimate = mounted && !prefersReducedMotion && !isVisible

  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: shouldAnimate ? 0 : 1,
        transform: shouldAnimate ? directions[direction] : 'none',
        transition: mounted && !prefersReducedMotion
          ? `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
          : 'none',
      }}
    >
      {children}
    </Component>
  )
}
