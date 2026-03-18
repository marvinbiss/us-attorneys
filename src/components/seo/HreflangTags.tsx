import { getAlternateLanguages } from '@/lib/seo/hreflang'

/**
 * Server component that generates hreflang alternate language metadata.
 *
 * Usage in generateMetadata():
 *   const hreflang = getHreflangMetadata('/abogados/lesiones-personales/miami')
 *   return { ...metadata, alternates: { ...metadata.alternates, languages: hreflang } }
 *
 * Or use the component directly in a page for rendering link tags in <head>:
 *   <HreflangTags path="/abogados/lesiones-personales/miami" />
 *
 * Note: Next.js 14 App Router handles hreflang via metadata.alternates.languages,
 * which is the preferred approach. This component provides an alternative for cases
 * where direct metadata control is needed.
 */

interface HreflangTagsProps {
  /** Current page path (e.g. "/abogados/lesiones-personales/miami") */
  path: string
  /** Current locale: 'en' or 'es' */
  currentLocale?: 'en' | 'es'
}

/**
 * Get hreflang metadata for use in generateMetadata() — preferred approach.
 * Returns a languages record for metadata.alternates.languages.
 */
export function getHreflangMetadata(path: string): Record<string, string> {
  return getAlternateLanguages(path)
}

/**
 * Server component that renders hreflang <link> tags.
 * Use this when you need explicit control over hreflang rendering.
 */
export default function HreflangTags({ path, currentLocale }: HreflangTagsProps) {
  const languages = getAlternateLanguages(path)

  if (Object.keys(languages).length === 0) return null

  return (
    <>
      {Object.entries(languages).map(([lang, url]) => (
        <link
          key={`hreflang-${lang}`}
          rel="alternate"
          hrefLang={lang}
          href={url}
        />
      ))}
      {/* Self-referencing canonical for the current locale */}
      {currentLocale && languages[currentLocale] && (
        <link rel="canonical" href={languages[currentLocale]} />
      )}
    </>
  )
}
