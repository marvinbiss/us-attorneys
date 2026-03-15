import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'US Attorneys — Find Licensed Attorneys Near You'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0f1e',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(37, 99, 235, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(245, 158, 11, 0.15) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo area */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
            }}
          >
            {/* House icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #E86B4B, #C24B2A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: 'white',
                letterSpacing: -1,
              }}
            >
              Services
              <span style={{ color: '#f59e0b' }}>Artisans</span>
            </span>
          </div>

          {/* Main tagline */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: 'white',
              marginBottom: 16,
              display: 'flex',
            }}
          >
            Licensed Attorneys Nationwide — Bar Verified
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
            }}
          >
            US Attorney Directory — Verified Legal Professionals
          </div>

          {/* Bottom accent bar */}
          <div
            style={{
              width: 120,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #E86B4B, #f59e0b)',
              marginTop: 40,
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
