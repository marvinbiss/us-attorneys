/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'servicesartisans.fr' },
      { protocol: 'https', hostname: 'umjmbdbwcsxrvfqktiui.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  staticPageGenerationTimeout: 600,

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'date-fns',
      'zod',
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.anthropic.com https://api.openai.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/accueil', destination: '/', permanent: true },
      // Legacy routes
      { source: '/france', destination: '/services', permanent: true },
      { source: '/carte', destination: '/services', permanent: true },
      { source: '/carte-liste', destination: '/services', permanent: true },
      { source: '/recherche', destination: '/services', permanent: true },
      { source: '/pro/:path*', destination: '/espace-artisan', permanent: true },
      { source: '/services/artisan/:path*', destination: '/services', permanent: true },
      // French legal page aliases (RGPD compliance)
      { source: '/politique-de-confidentialite', destination: '/confidentialite', permanent: true },
      { source: '/conditions-generales', destination: '/cgv', permanent: true },
      // Common alternative slugs
      { source: '/services/peintre', destination: '/services/peintre-en-batiment', permanent: true },
      { source: '/services/peintre/:location', destination: '/services/peintre-en-batiment/:location', permanent: true },
      { source: '/services/peintre/:location/:id', destination: '/services/peintre-en-batiment/:location/:id', permanent: true },
    ]
  },

  async rewrites() {
    return [
      // Next.js 14.2 generateSitemaps() doesn't auto-generate the sitemap index
      { source: '/sitemap.xml', destination: '/api/sitemap-index' },
      // Provider sitemaps served dynamically (DB-dependent, can't pre-render at build time)
      { source: '/sitemap/providers-:id.xml', destination: '/api/sitemap-providers?id=:id' },
    ]
  },

  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://servicesartisans.fr',
  },
}

module.exports = nextConfig
