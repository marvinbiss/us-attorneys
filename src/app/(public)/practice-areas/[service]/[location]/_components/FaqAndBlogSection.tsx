import Link from 'next/link'
import type { Service, Location as LocationType } from '@/types'

interface FaqItem {
  question: string
  answer: string
}

interface Props {
  combinedFaq: FaqItem[]
  service: Service
  location: LocationType
  specialtySlug: string
}

export default function FaqAndBlogSection({ combinedFaq, service, location }: Props) {
  return (
    <>
      {/* FAQ accordion */}
      {combinedFaq.length > 0 && (
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-amber-500 pl-4">
                Frequently Asked Questions — {service.name.toLowerCase()} in {location.name}
              </h2>
              <div className="space-y-3">
                {combinedFaq.map((item, i) => (
                  <details
                    key={i}
                    className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden transition-shadow duration-300 hover:shadow-sm"
                  >
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left hover:bg-gray-100/80 transition-colors duration-200 [&::-webkit-details-marker]:hidden list-none">
                      <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
                      <svg className="w-5 h-5 text-amber-500 shrink-0 group-open:rotate-180 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed text-sm animate-fade-in">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog articles */}
      <section className="py-12 bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-l-4 border-amber-500 pl-4">
            <svg className="w-5 h-5 text-clay-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Guides and Resources
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <BlogLink href="/guides/find-attorney" emoji="&#9878;" title="How to Choose the Right Attorney" desc="Essential criteria for finding a reliable and competent attorney." />
            <BlogLink href="/guides/legal-quotes" emoji="&#128176;" title="Understanding Legal Fees in 2026" desc="Hourly rates, flat fees, contingency — all fee structures explained." />
          </div>
        </div>
      </section>
    </>
  )
}

function BlogLink({ href, emoji, title, desc }: { href: string; emoji: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-clay-200 hover:shadow-sm transition-all group"
    >
      <span className="text-2xl shrink-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: emoji }} />
      <div>
        <span className="font-semibold text-gray-900 group-hover:text-clay-600 transition-colors">{title}</span>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
    </Link>
  )
}
