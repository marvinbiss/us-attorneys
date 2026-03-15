import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'

// Admin email whitelist from environment variable
// Set ADMIN_EMAILS in .env.local as comma-separated list
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(email => email.trim().length > 0)

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check admin access: first try profiles table, then fall back to email whitelist
  let isAdmin = false

  // Try profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .single()

  if (!profileError && profile) {
    isAdmin = profile.role === 'super_admin' ||
              profile.role === 'admin' ||
              profile.role === 'moderator' ||
              profile.is_admin === true
  }

  // Fallback: check email whitelist
  if (!isAdmin && user.email && ADMIN_EMAILS.includes(user.email)) {
    isAdmin = true
  }

  if (!isAdmin) {
    redirect('/?error=unauthorized')
  }

  return (
    <div className="flex min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded">
        Aller au contenu principal
      </a>
      <AdminSidebar />
      <main id="main-content" className="flex-1 bg-gray-50 min-w-0" role="main" aria-label="Contenu principal de l'administration">
        {children}
      </main>
    </div>
  )
}
