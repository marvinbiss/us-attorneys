import { Metadata } from 'next'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { WidgetCopyButton } from './WidgetCopyButton'

const EMBED_CODE = `<div id="sa-widget" data-service="attorney" data-ville="new-york" data-name="My Firm"></div>
<script src="${SITE_URL}/api/widget" async></script>`

export const metadata: Metadata = {
  title: `Widget ${SITE_NAME} | US Attorneys`,
  robots: { index: false },
  alternates: { canonical: `${SITE_URL}/widget` },
}

export default function WidgetPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Widget</h1>
      <div className="bg-gray-900 rounded-xl p-6 relative mt-8">
        <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
          {EMBED_CODE}
        </pre>
        <WidgetCopyButton code={EMBED_CODE} />
      </div>
    </div>
  )
}
