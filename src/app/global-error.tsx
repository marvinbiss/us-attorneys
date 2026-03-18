'use client'

import { useEffect } from 'react'

/**
 * Next.js App Router root error boundary.
 * Catches errors in the root layout itself.
 * Must render its own <html> and <body> since the root layout is replaced.
 *
 * Uses inline styles only (no Tailwind) because the root layout's CSS may not load.
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error] Root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '480px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              lineHeight: 1,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '0 0 0.75rem',
              letterSpacing: '-0.025em',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: '#64748b',
              margin: '0 0 2rem',
              lineHeight: 1.6,
              fontSize: '1rem',
            }}
          >
            We apologize for the inconvenience. Please try again or return to the home page.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Try again
            </button>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#1e293b',
                textDecoration: 'none',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                transition: 'background-color 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to home
            </a>
          </div>
          {error?.digest && (
            <p
              style={{
                marginTop: '2rem',
                fontSize: '0.8125rem',
                color: '#94a3b8',
              }}
            >
              Error reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
