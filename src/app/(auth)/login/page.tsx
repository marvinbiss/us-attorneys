'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Wrench,
  User,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [userType, setUserType] = useState<'client' | 'attorney'>('client')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || 'Sign in failed')
        return
      }

      // Store session
      if (data.data?.session) {
        localStorage.setItem('accessToken', data.data.session.accessToken)
        if (rememberMe) {
          localStorage.setItem('refreshToken', data.data.session.refreshToken)
        }
      }

      // Redirect: honor ?redirect= param, else default to dashboard
      if (redirectTo) {
        router.push(redirectTo)
      } else if (data.data?.user?.isAttorney) {
        router.push('/attorney-dashboard')
      } else {
        router.push('/client-dashboard')
      }
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', ...(redirectTo ? { next: redirectTo } : {}) }),
      })
      const data = await response.json()
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        setError('Google sign in temporarily unavailable')
      }
    } catch {
      setError('Google sign in error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-1">
        {/* Left - Form */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[{ label: 'Sign In' }]}
              className="mb-6 text-gray-400 [&_a:hover]:text-white [&_a]:text-gray-400 [&_svg]:text-gray-500"
            />

            <div className="mb-8 text-center">
              <Link href="/" className="mb-6 inline-flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg">
                  <span className="text-xl font-bold text-white">UA</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  US<span className="text-blue-400">Attorneys</span>
                </span>
              </Link>
              <h1 className="mb-2 text-3xl font-bold text-white">Sign In</h1>
              <p className="text-gray-400">Access your personal account</p>
            </div>

            {/* User type toggle */}
            <div className="mb-8 flex rounded-2xl border border-slate-700 bg-slate-800/50 p-1.5">
              <button
                onClick={() => setUserType('client')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-medium transition-all ${
                  userType === 'client'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="h-4 w-4" />
                Client
              </button>
              <button
                onClick={() => setUserType('attorney')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-medium transition-all ${
                  userType === 'attorney'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Wrench className="h-4 w-4" />
                Attorney
              </button>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-10 pr-12 text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  userType === 'attorney'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-600/30 hover:from-blue-700 hover:to-blue-800'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link
                  href={`${userType === 'attorney' ? '/register-attorney' : '/register'}${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                  className={`font-medium ${userType === 'attorney' ? 'text-amber-400 hover:text-amber-300' : 'text-blue-400 hover:text-blue-300'}`}
                >
                  Create Account
                </Link>
              </p>
            </div>

            {/* Social login */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900 px-4 text-gray-500">Or continue with</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-white transition-all hover:bg-slate-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>

            {/* Contextual Links */}
            <div className="mt-8 border-t border-slate-700 pt-8">
              <p className="mb-3 text-sm text-gray-400">Useful links:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/how-it-works" className="text-blue-400 hover:text-blue-300">
                  How It Works
                </Link>
                <Link href="/faq" className="text-blue-400 hover:text-blue-300">
                  FAQ
                </Link>
                <Link href="/contact" className="text-blue-400 hover:text-blue-300">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Image */}
        <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 lg:flex">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative z-10 max-w-md text-center text-white">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 shadow-2xl backdrop-blur-sm">
              <Wrench className="h-12 w-12" />
            </div>
            <h2 className="mb-6 text-4xl font-bold">Welcome to US Attorneys</h2>
            <p className="mb-8 text-lg text-blue-100">
              Sign in to access your personal dashboard, track your cases, and manage your account.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">2500+</div>
                <div className="text-sm text-blue-200">Attorneys</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-blue-200">Clients</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-sm text-blue-200">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links Section */}
      <section className="border-t border-slate-700 bg-slate-800/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-lg font-semibold text-white">Explore Our Services</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <PopularServicesLinks className="[&_a:hover]:bg-blue-600 [&_a:hover]:text-white [&_a]:bg-slate-700 [&_a]:text-gray-300 [&_h3]:text-gray-300" />
            <PopularCitiesLinks className="[&_a:hover]:bg-blue-600 [&_a:hover]:text-white [&_a]:bg-slate-700 [&_a]:text-gray-300 [&_h3]:text-gray-300" />
          </div>
        </div>
      </section>
    </div>
  )
}
