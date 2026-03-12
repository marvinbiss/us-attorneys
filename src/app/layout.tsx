import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { MobileMenuProvider } from '@/contexts/MobileMenuContext'
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getProviderCount } from '@/lib/data/stats'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: true,
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
  adjustFontFallback: true,
})

// Dynamic imports for performance
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), {
  ssr: false,
})
const ServiceWorkerRegistration = dynamic(
  () => import('@/components/ServiceWorkerRegistration'),
  { ssr: false }
)
const CapacitorInit = dynamic(
  () => import('@/components/CapacitorInit').then(mod => ({ default: mod.CapacitorInit })),
  { ssr: false }
)
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
})
const WebVitals = dynamic(
  () => import('@/components/WebVitals').then(mod => ({ default: mod.WebVitals })),
  { ssr: false }
)
const PageViewTracker = dynamic(() => import('@/components/PageViewTracker'), {
  ssr: false,
})

// Viewport configuration - Primary brand color
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' },
  ],
  colorScheme: 'light',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ServicesArtisans — Annuaire d\'artisans en France',
    template: '%s | ServicesArtisans',
  },
  description:
    'Annuaire d\'artisans en France, données SIREN officielles. Plombiers, électriciens, menuisiers et plus dans 101 départements. Devis gratuits.',
  authors: [{ name: 'ServicesArtisans' }],
  applicationName: 'ServicesArtisans',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ServicesArtisans',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'ServicesArtisans',
    title: 'ServicesArtisans — Annuaire des artisans référencés en France',
    description:
      'Annuaire d\'artisans de France basé sur les données SIREN officielles. Des milliers de professionnels référencés. Devis gratuits.',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Annuaire des artisans référencés en France' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServicesArtisans — Annuaire des artisans référencés en France',
    description:
      'Annuaire d\'artisans de France. Devis gratuits, données gouvernementales SIREN.',
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'fr-FR': SITE_URL,
      'x-default': SITE_URL,
    },
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const revalidate = 3600

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const artisanCount = await getProviderCount()
  return (
    <html lang="fr" className={`scroll-smooth ${inter.variable} ${plusJakarta.variable}`}>
      <head>
        {/* PWA Meta Tags (apple-mobile-web-app, mobile-web-app-capable, theme-color handled by metadata/viewport exports) */}
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Additional icon size (180px apple-touch-icon + icon.svg handled by metadata.icons export) */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />

        {/* LLM discovery — llms.txt (GEO/AEO optimization) */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM access guidelines" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM detailed content" />

        {/* Global Organization + WebSite schema (E-E-A-T) */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([getOrganizationSchema(), getWebsiteSchema()])
              .replace(/</g, '\\u003c')
              .replace(/>/g, '\\u003e')
              .replace(/&/g, '\\u0026'),
          }}
        />

        {/* Preconnect for Google Tag Manager & Analytics */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />

        {/* Preconnect for Supabase backend */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />

        {/* Preconnect for images - Unsplash */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans bg-gray-50 antialiased">
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-THV3KZ8N');`}
        </Script>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-THV3KZ8N"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Microsoft Clarity — chargé uniquement après consentement analytics (RGPD) via CookieConsent */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <WebVitals />
        <PageViewTracker />
        <MobileMenuProvider>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 font-medium"
          >
            Aller au contenu principal
          </a>
          <Header artisanCount={artisanCount} />
          <main id="main-content" className="pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
          <ServiceWorkerRegistration />
          <CapacitorInit />
          <CookieConsent />
        </MobileMenuProvider>
      </body>
    </html>
  )
}
