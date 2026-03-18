import { ReactNode } from 'react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function GeographicSectionWrapper({ children }: { children: ReactNode }) {
  return (
    <ScrollReveal direction="up" distance={40} duration={0.6}>
      {children}
    </ScrollReveal>
  )
}
