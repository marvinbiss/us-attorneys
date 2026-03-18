import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline — US Attorneys',
  description: 'You are currently offline.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
