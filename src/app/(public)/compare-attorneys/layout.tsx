import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Attorneys Side by Side',
  description: 'Compare up to 4 attorneys side by side. Compare ratings, experience, fees, practice areas, and more to make an informed decision.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CompareAttorneysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
