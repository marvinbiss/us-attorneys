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
      'framer-motion',
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
          // CSP also defined in middleware.ts (takes precedence for non-static routes)
          // This CSP serves as fallback for static assets not processed by middleware
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.anthropic.com https://api.openai.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
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
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Cache-Control for programmatic public pages (CDN caching)
      {
        source: '/services/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/devis/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/tarifs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/avis/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/villes/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/departements/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/regions/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/problemes/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/urgence/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/barometre/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/blog/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // Static public pages — long cache
      {
        source: '/faq',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/contact',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/comment-ca-marche',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/comparaison/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/artisans',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/carte-artisans',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/a-propos',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/garantie',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/cgv',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/confidentialite',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/accessibilite',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/avant-apres',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/calendrier-travaux',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/badge-artisan',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/carrieres',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
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
      // Blog cannibalisation fixes — 301 redirects to canonical articles
      // Isolation: canonical = isolation-maison-guide-complet-materiaux-prix-aides
      { source: '/blog/isolation-thermique-guide', destination: '/blog/isolation-maison-guide-complet-materiaux-prix-aides', permanent: true },
      { source: '/blog/isolation-thermique-meilleures-solutions-2026', destination: '/blog/isolation-maison-guide-complet-materiaux-prix-aides', permanent: true },
      // Toiture/prix: canonical = prix-toiture-2026-refection-reparation-materiaux
      { source: '/blog/prix-couvreur-2026-cout-refection-toiture', destination: '/blog/prix-toiture-2026-refection-reparation-materiaux', permanent: true },
      { source: '/blog/refaire-toiture-guide-proprietaire', destination: '/blog/prix-toiture-2026-refection-reparation-materiaux', permanent: true },
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
