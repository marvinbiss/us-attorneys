'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError('You must accept the terms of service')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      setSuccess(true)
    } catch (_err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📧</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check your email
        </h3>
        <p className="text-gray-600">
          A confirmation link has been sent to <strong>{formData.email}</strong>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Professional email
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@company.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="8 characters minimum"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          At least 8 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm password
        </label>
        <Input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="••••••••"
          required
        />
      </div>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={formData.acceptTerms}
          onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
          className="rounded border-gray-300 mt-1"
        />
        <span className="text-sm text-gray-600">
          I accept the{' '}
          <a href="/terms" className="text-blue-600 underline">
            terms of service
          </a>{' '}
          and the{' '}
          <a href="/privacy" className="text-blue-600 underline">
            privacy policy
          </a>
        </span>
      </label>

      <Button type="submit" disabled={isLoading} fullWidth>
        {isLoading ? 'Creating...' : 'Create my account'}
      </Button>
    </form>
  )
}
