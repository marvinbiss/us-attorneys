'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularServicesLinks, PopularCitiesLinks } from '@/components/InternalLinks'

interface FormErrors {
  [key: string]: string
}

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

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
        setGeneralError('Google sign in temporarily unavailable')
      }
    } catch {
      setGeneralError('Google sign in error')
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-400',
    'bg-green-600',
  ]

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    } else if (!/[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          acceptTerms: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.details?.fields) {
          setErrors(data.error.details.fields)
        } else {
          setGeneralError(data.error?.message || 'An error occurred')
        }
        return
      }

      setIsSubmitted(true)
    } catch {
      setGeneralError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Registration Successful!</h1>
          <p className="mb-8 text-gray-600">
            A confirmation email has been sent to <strong>{formData.email}</strong>. Click the link
            to activate your account.
          </p>
          <Link
            href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800"
          >
            Sign In
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-1">
        {/* Left - Image */}
        <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 lg:flex">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative z-10 max-w-md text-center text-white">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-4xl font-bold">UA</span>
            </div>
            <h2 className="mb-6 text-4xl font-bold">Join US Attorneys</h2>
            <p className="mb-10 text-lg text-blue-100">
              Create your free account and find the best attorneys for your legal needs.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-400" />
                <span>Free and unlimited consultation requests</span>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-400" />
                <span>Verified and qualified attorneys</span>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-green-400" />
                <span>Simple and fast online booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[{ label: 'Sign Up' }]}
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
              <h1 className="mb-2 text-3xl font-bold text-white">Create Account</h1>
              <p className="text-gray-400">Sign up for free</p>
            </div>

            {generalError && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`w-full border bg-slate-800 py-3 pl-10 pr-4 ${errors.firstName ? 'border-red-500' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500`}
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`w-full border bg-slate-800 px-4 py-3 ${errors.lastName ? 'border-red-500' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500`}
                    placeholder="Smith"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full border bg-slate-800 py-3 pl-10 pr-4 ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500`}
                    placeholder="john.smith@email.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full border bg-slate-800 py-3 pl-10 pr-12 ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500`}
                    placeholder="8 characters minimum"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="mb-1 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-slate-700'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength:{' '}
                      {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Very weak'}
                    </p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full border bg-slate-800 py-3 pl-10 pr-4 ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} rounded-xl text-white placeholder-gray-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500`}
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">
                  I accept the{' '}
                  <Link href="/terms" className="text-blue-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and the{' '}
                  <Link href="/privacy" className="text-blue-400 hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && <p className="text-sm text-red-400">{errors.terms}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Create My Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Social login */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900 px-4 text-gray-500">Or sign up with</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-white transition-all hover:bg-slate-700 disabled:opacity-50"
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
                  Sign up with Google
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link
                  href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Sign In
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-gray-500">
              Are you an attorney?{' '}
              <Link href="/register-attorney" className="text-blue-400 hover:underline">
                Register your practice
              </Link>
            </p>

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
                <Link href="/quotes" className="text-blue-400 hover:text-blue-300">
                  Request a Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Links Section */}
      <section className="border-t border-slate-700 bg-slate-800/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-lg font-semibold text-white">Discover Our Services</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <PopularServicesLinks className="[&_a:hover]:bg-blue-600 [&_a:hover]:text-white [&_a]:bg-slate-700 [&_a]:text-gray-300 [&_h3]:text-gray-300" />
            <PopularCitiesLinks className="[&_a:hover]:bg-blue-600 [&_a:hover]:text-white [&_a]:bg-slate-700 [&_a]:text-gray-300 [&_h3]:text-gray-300" />
          </div>
        </div>
      </section>
    </div>
  )
}
