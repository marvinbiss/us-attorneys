import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { MobileMenuProvider } from '@/contexts/MobileMenuContext'
import { CompareProviderWrapper } from '@/components/compare/CompareProvider'
import { ThemeProvider } from '@/lib/theme/theme-provider'
import { getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getAttorneyCount } from '@/lib/data/stats'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { PageSkeleton } from '@/components/ui/Skeleton'

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
const ServiceWorkerRegistration = dynamic(() => import('@/components/ServiceWorkerRegistration'), {
  ssr: false,
})
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
})
const WebVitals = dynamic(
  () => import('@/components/WebVitals').then((mod) => ({ default: mod.WebVitals })),
  { ssr: false }
)
const PageViewTracker = dynamic(() => import('@/components/PageViewTracker'), {
  ssr: false,
})
const CompareFloatingButton = dynamic(() => import('@/components/compare/CompareFloatingButton'), {
  ssr: false,
})

// Viewport configuration - Primary brand color
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E86B4B' },
    { media: '(prefers-color-scheme: dark)', color: '#C24B2A' },
  ],
  colorScheme: 'light dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'US Attorneys — Find Lawyers Near You',
    template: '%s | US Attorneys',
  },
  description:
    'Find top-rated attorneys near you. Browse 75+ practice areas across all 50 states. Free consultations available.',
  authors: [{ name: 'US Attorneys' }],
  applicationName: 'US Attorneys',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'US Attorneys',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'US Attorneys',
    title: 'US Attorneys — Find Top-Rated Lawyers Near You',
    description:
      'Find top-rated attorneys across all 50 states. Browse 75+ practice areas, read reviews, and request free consultations.',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'US Attorneys — Find Top-Rated Lawyers Near You',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'US Attorneys — Find Top-Rated Lawyers Near You',
    description: 'Find top-rated attorneys across all 50 states. Free consultations available.',
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
      'en-US': SITE_URL,
      'x-default': SITE_URL,
    },
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const revalidate = 3600

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const attorneyCount = await getAttorneyCount()
  return (
    <html
      lang="en"
      className={`scroll-smooth ${inter.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA Meta Tags (apple-mobile-web-app, mobile-web-app-capable, theme-color handled by metadata/viewport exports) */}
        {/* Anti-FOUC: apply dark class before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('us-attorneys-theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <meta name="msapplication-TileColor" content="#E86B4B" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* OpenSearch — enables browser address bar search */}
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="US Attorneys"
          href="/open_search.xml"
        />

        {/* Additional icon sizes (180px apple-touch-icon + icon.svg handled by metadata.icons export) */}
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />

        {/* LLM discovery — llms.txt (GEO/AEO optimization) */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM access guidelines" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms-full.txt"
          title="LLM detailed content"
        />

        {/* Global Organization + WebSite schema (E-E-A-T) */}
        <script
          type="application/ld+json"
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

        {/* Preconnect for Meta Pixel */}
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* Preconnect for Supabase backend */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL || ''} />

        {/* Preconnect for images - Unsplash */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="bg-gray-50 font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        {/*
          Google Tag Manager — SRI NOT applicable.
          GTM loads via an inline snippet that dynamically creates a <script> element
          pointing to https://www.googletagmanager.com/gtm.js?id=GTM-THV3KZ8N.
          The response is dynamically generated per-request by Google (container config,
          consent state, A/B tests), so its content hash changes on every build/publish.
          Adding an integrity attribute would break GTM on every container update.
        */}
        <Script id="gtm" strategy="lazyOnload">
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
        {/*
          Meta Pixel (fbevents.js) — SRI NOT applicable.
          The inline snippet dynamically creates a <script> element loading
          https://connect.facebook.net/en_US/fbevents.js. Facebook rebuilds this
          file frequently (feature flags, SDK version bumps), so its hash is
          unpredictable. An integrity attribute would cause silent breakage whenever
          Meta ships a new SDK version.
        */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="lazyOnload">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
fbq('track', 'PageView');`}
          </Script>
        )}
        {/*
          Contentsquare UX Analytics — SRI NOT applicable.
          next/script with strategy="lazyOnload" injects the <script> element dynamically
          via JavaScript at runtime (document.createElement('script')). Browsers only
          enforce the `integrity` attribute on static <script> tags present in the
          original HTML markup — dynamically injected scripts silently ignore it.
          Therefore, adding an integrity attribute here would have no security benefit.

          Additionally, Contentsquare may update the SDK payload between version bumps,
          which would cause hash mismatches if SRI were enforced.

          Mitigation: rely on CSP script-src directives (allow-listed origin
          https://t.contentsquare.net) to restrict which external scripts can execute.
        */}
        <Script
          src="https://t.contentsquare.net/uxa/8da7eeef2dab8.js"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        {/* Microsoft Clarity — loaded only after analytics consent via CookieConsent */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <WebVitals />
        <PageViewTracker />
        <ThemeProvider>
          <MobileMenuProvider>
            <CompareProviderWrapper>
              <Header attorneyCount={attorneyCount} />
              <main
                id="main-content"
                tabIndex={-1}
                className="pb-16 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] outline-none md:pb-0"
              >
                <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
              </main>
              <Footer />
              <MobileBottomNav />
              <ServiceWorkerRegistration />
              <CookieConsent />
              <noscript>
                <div
                  style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: '#1e293b',
                    color: 'white',
                    padding: '16px',
                    textAlign: 'center',
                    zIndex: 9999,
                  }}
                >
                  This site uses cookies to improve your experience. By continuing to browse, you
                  consent to our use of cookies.
                  <a href="/privacy" style={{ color: '#60a5fa', marginLeft: '8px' }}>
                    Privacy Policy
                  </a>
                </div>
              </noscript>
              <CompareFloatingButton />
            </CompareProviderWrapper>
          </MobileMenuProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
