'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
              width: '64px',
              height: '64px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: '0 0 0.5rem',
            }}
          >
            An error occurred
          </h1>
          <p
            style={{
              color: '#64748b',
              margin: '0 0 2rem',
              lineHeight: 1.6,
            }}
          >
            We are sorry, something did not go as expected.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#2563eb',
                textDecoration: 'none',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
