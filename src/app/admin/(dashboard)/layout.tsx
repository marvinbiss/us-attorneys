import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'
import { PageSkeleton } from '@/components/ui/Skeleton'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Verify user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check admin access exclusively from the database — no env-based fallback
  let isAdmin = false

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .single()

  if (!profileError && profile) {
    isAdmin =
      profile.role === 'super_admin' ||
      profile.role === 'admin' ||
      profile.role === 'moderator' ||
      profile.is_admin === true
  }

  if (!isAdmin) {
    redirect('/?error=unauthorized')
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <AdminSidebar />
      <main
        id="main-content"
        className="min-w-0 flex-1 bg-gray-50"
        role="main"
        aria-label="Admin main content"
      >
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
    </div>
  )
}
