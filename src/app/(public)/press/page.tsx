import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'Press & Media | US Attorneys',
    description:
      'Press and media resources for US Attorneys. Contact our communications team, access brand assets, and learn about our mission to connect Americans with legal representation.',
    robots: { index: false },
  }
}

export default function PressPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Press &amp; Media</h1>
      <p className="mb-10 text-sm text-gray-500">Media resources and press contact information</p>

      {/* About */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">About US Attorneys</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          US Attorneys is a comprehensive online directory that connects individuals and businesses
          with licensed attorneys across all 50 states, the District of Columbia, and U.S.
          territories. Our platform provides access to detailed attorney profiles spanning 75
          practice areas, enabling users to find qualified legal representation based on location,
          specialty, experience, and peer reviews.
        </p>
        <p className="leading-relaxed text-gray-700">
          Our mission is to make the process of finding legal representation more transparent,
          accessible, and efficient for everyone. We believe that access to quality legal services
          should not depend on personal connections or geographic limitations.
        </p>
      </section>

      {/* Key Facts */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Key Facts</h2>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>Comprehensive directory covering all 50 U.S. states and territories.</li>
          <li>
            Attorney profiles sourced from official state bar associations and public court records.
          </li>
          <li>
            75 practice areas from personal injury and criminal defense to corporate law and
            immigration.
          </li>
          <li>
            Features including attorney search, client reviews, video consultations, and lead
            matching.
          </li>
        </ul>
      </section>

      {/* Press Contact */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Press Contact</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          For press inquiries, interview requests, or media partnerships, please contact our
          communications team:
        </p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <p className="mb-2 text-gray-700">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:press@lawtendr.com"
              className="text-blue-700 underline hover:text-blue-900"
            >
              press@lawtendr.com
            </a>
          </p>
          <p className="text-gray-700">
            <strong>Response Time:</strong> We aim to respond to all media inquiries within one (1)
            business day.
          </p>
        </div>
      </section>

      {/* Media Kit */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Media Kit</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Our media kit includes approved logos, brand marks, screenshots, and executive headshots
          for use in press coverage. To request a copy of our media kit, please email{' '}
          <a
            href="mailto:press@lawtendr.com"
            className="text-blue-700 underline hover:text-blue-900"
          >
            press@lawtendr.com
          </a>{' '}
          with your publication name and intended use.
        </p>
      </section>

      {/* Brand Guidelines */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Brand Guidelines</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          When referencing our platform in editorial or media content, please observe the following
          guidelines:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Name:</strong> Use &ldquo;US Attorneys&rdquo; (two words, no period after
            &ldquo;US&rdquo;). Do not abbreviate to &ldquo;USA&rdquo; or &ldquo;USAT.&rdquo;
          </li>
          <li>
            <strong>Description:</strong> US Attorneys may be described as an &ldquo;attorney
            directory,&rdquo; &ldquo;legal services platform,&rdquo; or &ldquo;lawyer finder.&rdquo;
            It should not be described as a &ldquo;law firm&rdquo; or &ldquo;legal practice.&rdquo;
          </li>
          <li>
            <strong>Logo Usage:</strong> Our logo should not be modified, distorted, or displayed in
            a way that implies endorsement of any product or service not affiliated with US
            Attorneys.
          </li>
        </ul>
      </section>

      {/* Coverage Areas */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Story Ideas</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          We welcome media inquiries on topics including:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>Access to justice and legal representation in underserved areas.</li>
          <li>Technology&apos;s role in modernizing how people find and retain legal counsel.</li>
          <li>Trends in legal practice areas, attorney demographics, and consumer legal needs.</li>
          <li>Data-driven insights from our national attorney database.</li>
        </ul>
      </section>

      {/* Date */}
      <section>
        <p className="text-sm text-gray-500">This page was last updated in March 2026.</p>
      </section>
    </div>
  )
}
