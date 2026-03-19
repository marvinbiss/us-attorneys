import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: 'Careers — Join Our Team',
  description:
    'Discover career opportunities at US Attorneys. Join a passionate team building the leading attorney directory in the United States based on public bar records.',
  alternates: {
    canonical: `${SITE_URL}/careers`,
  },
  openGraph: {
    title: 'Careers — Join Our Team',
    description:
      'Discover career opportunities at US Attorneys. Join a passionate team building the leading attorney directory in the United States based on public bar records.',
    url: `${SITE_URL}/careers`,
    siteName: 'US Attorneys',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Careers — Join Our Team',
    description:
      'Discover career opportunities at US Attorneys. Join a passionate team building the leading attorney directory in the United States based on public bar records.',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default async function CareersPage() {
  const cmsPage = await getPageContent('careers', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd
          data={getBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Careers', url: '/careers' },
          ])}
        />
        <section className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Careers' }]} className="mb-4" />
            <h1 className="font-heading text-3xl font-bold text-gray-900">{cmsPage.title}</h1>
          </div>
        </section>
        <section className="py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl bg-white p-8 shadow-sm">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0f1e] text-white">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 md:pb-36 md:pt-14 lg:px-8">
          <Breadcrumb
            items={[{ label: 'Careers' }]}
            className="mb-6 text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-400 [&_svg]:text-slate-600"
          />
          <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-[-0.025em]">Careers</h1>
          <p className="max-w-3xl text-xl text-slate-400">
            Join a passionate team building the leading attorney directory in the United States
            based on official public bar records.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900">
            No open positions at this time
          </h2>
          <p className="mb-6 text-gray-600">
            We don&apos;t have any open positions right now, but we&apos;re always looking for
            talented people. Feel free to send us a spontaneous application.
          </p>
          <p className="mb-8 text-gray-500">
            For spontaneous applications, contact us at{' '}
            <a
              href="mailto:careers@lawtendr.com"
              className="font-medium text-blue-600 hover:underline"
            >
              careers@lawtendr.com
            </a>
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
          >
            Learn more about US Attorneys
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
