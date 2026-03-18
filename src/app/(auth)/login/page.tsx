'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Wrench, User } from 'lucide-react'
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
    } catch (_err: unknown) {
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
      if (data.url) {
        window.location.href = data.url
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="flex flex-1">
        {/* Left - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[{ label: 'Sign In' }]}
              className="mb-6 text-gray-400 [&_a]:text-gray-400 [&_a:hover]:text-white [&_svg]:text-gray-500"
            />

            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">UA</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  US<span className="text-blue-400">Attorneys</span>
                </span>
              </Link>
              <h1 className="text-3xl font-bold text-white mb-2">
                Sign In
              </h1>
              <p className="text-gray-400">
                Access your personal account
              </p>
            </div>

            {/* User type toggle */}
            <div className="bg-slate-800/50 rounded-2xl p-1.5 flex mb-8 border border-slate-700">
              <button
                onClick={() => setUserType('client')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'client'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Client
              </button>
              <button
                onClick={() => setUserType('attorney')}
                className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  userType === 'attorney'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Attorney
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
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
                className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  userType === 'attorney'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/30'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
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
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 py-3 rounded-xl hover:bg-slate-700 transition-all text-white"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>

            {/* Contextual Links */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <p className="text-gray-400 text-sm mb-3">Useful links:</p>
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
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
          </div>
          <div className="max-w-md text-white text-center relative z-10">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Wrench className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Welcome to US Attorneys
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Sign in to access your personal dashboard, track your cases, and manage your account.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">2500+</div>
                <div className="text-sm text-blue-200">Attorneys</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm text-blue-200">Clients</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-sm text-blue-200">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links Section */}
      <section className="bg-slate-800/50 py-10 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            Explore Our Services
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <PopularServicesLinks className="[&_h3]:text-gray-300 [&_a]:bg-slate-700 [&_a]:text-gray-300 [&_a:hover]:bg-blue-600 [&_a:hover]:text-white" />
            <PopularCitiesLinks className="[&_h3]:text-gray-300 [&_a]:bg-slate-700 [&_a]:text-gray-300 [&_a:hover]:bg-blue-600 [&_a:hover]:text-white" />
          </div>
        </div>
      </section>
    </div>
  )
}
