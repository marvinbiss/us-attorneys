import { ImageResponse } from 'next/og'
import { practiceAreas as staticPracticeAreas, getCityBySlug } from '@/lib/data/usa'
import { resolveZipToCity } from '@/lib/location-resolver'

export const runtime = 'edge'

export const alt = 'US Attorneys — Qualified Attorney Near You'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ service: string; location: string }>
}) {
  const { service: specialtySlug, location: locationSlug } = await params

  const staticSvc = staticPracticeAreas.find(s => s.slug === specialtySlug)
  const cityData = getCityBySlug(locationSlug) || await resolveZipToCity(locationSlug)

  const specialtyName = staticSvc?.name || specialtySlug
  const cityName = cityData?.name || locationSlug
  const stateName = cityData?.stateName || ''

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

        {/* Top amber accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #2563eb, #f59e0b, #2563eb)',
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
            padding: '0 60px',
          }}
        >
          {/* Service name */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: 'white',
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            {specialtyName}
          </div>

          {/* City name */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: '#f59e0b',
              marginBottom: 12,
              display: 'flex',
              textAlign: 'center',
            }}
          >
            {`in ${cityName}`}
          </div>

          {/* Department */}
          {stateName && (
            <div
              style={{
                fontSize: 26,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 40,
                display: 'flex',
              }}
            >
              {stateName}
            </div>
          )}

          {/* Accent divider */}
          <div
            style={{
              width: 120,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #E86B4B, #f59e0b)',
              marginBottom: 40,
              display: 'flex',
            }}
          />

          {/* Brand footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* House icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #E86B4B, #C24B2A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="26"
                height="26"
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
                fontSize: 30,
                fontWeight: 700,
                color: 'white',
                letterSpacing: -0.5,
              }}
            >
              Services
              <span style={{ color: '#f59e0b' }}>Artisans</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>.fr</span>
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
