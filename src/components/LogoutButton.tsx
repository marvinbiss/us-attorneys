'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      await supabase.auth.signOut()

      // Clear any stored tokens
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')

      // Redirect to login page
      router.push('/login')
      router.refresh()
    } catch (error: unknown) {
      console.error('Logout error:', error)
      // Still redirect even on error
      router.push('/login')
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <LogOut className="w-5 h-5" />
      )}
      {isLoading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
