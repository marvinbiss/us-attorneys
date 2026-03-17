import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Saved Attorneys',
  description: 'View your saved attorney profiles.',
  robots: { index: false, follow: true },
}

export default function MesFavorisLayout({ children }: { children: React.ReactNode }) {
  return children
}
