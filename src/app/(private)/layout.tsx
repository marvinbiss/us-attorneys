import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageSkeleton } from '@/components/ui/Skeleton'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  )
}
