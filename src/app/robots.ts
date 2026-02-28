import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo/config'

const PRIVATE_DISALLOW = [
  // Immutable static assets (1-year cache headers) — no need for Google to crawl
  '/_next/static/',
  // Private/auth routes
  '/admin/',
  '/api/',
  '/auth/',
  '/espace-client/',
  '/espace-artisan/',
  '/booking/',
  // Auth pages (no SEO value)
  '/connexion',
  '/inscription',
  '/inscription-artisan',
  '/mot-de-passe-oublie',
  // Query parameter variations (duplicate content).
  // Pattern /*?*param= covers BOTH first (?param=) and secondary (&param=) occurrences.
  // Google doc example: disallow: /*?*color= (blocks /items?color=x AND /items?cat=y&color=x)
  '/*?*sort=',
  '/*?*page=',
  '/*?*filter=',
  '/*?*q=',
  '/*?*redirect=',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Googlebot: full access, no crawl-delay (Google ignores it)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // Bingbot: full access
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // AdsBot — MUST be named explicitly: the '*' wildcard does NOT cover AdsBot (Google spec).
      // Block private routes to avoid unnecessary ad-serving crawl on auth/admin pages.
      {
        userAgent: ['AdsBot-Google', 'AdsBot-Google-Mobile'],
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // APIs-Google — also ignores '*'. Used for push notification deliveries.
      // We don't use Google push notifications, but block private routes defensively.
      {
        userAgent: 'APIs-Google',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // Mediapartners-Google (AdSense) — also ignores '*' per Google special-crawlers spec.
      // Block private routes defensively even though we don't run AdSense.
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // All other legitimate bots
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_DISALLOW,
      },
      // Google-Extended — opt out of Gemini/Vertex AI training.
      // No impact on rankings. Consistent with blocking Bytespider (TikTok AI) above.
      // The token is separate from Googlebot: disabling it does NOT affect Google Search.
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      // Block aggressive SEO scrapers (consume resources, no SEO benefit)
      {
        userAgent: [
          'AhrefsBot',
          'SemrushBot',
          'MJ12bot',
          'DotBot',
          'BLEXBot',
          'PetalBot',
          'DataForSeoBot',
          'Bytespider',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
