import type { Metadata } from 'next'
import Link from 'next/link'

export function generateMetadata(): Metadata {
  return {
    title: 'Partner With Us | US Attorneys',
    description:
      'Partner with US Attorneys to grow your legal practice. Learn about our partnership programs for law firms, solo practitioners, and legal service providers.',
    robots: { index: false },
  }
}

export default function PartnersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Partner With Us</h1>
      <p className="mb-10 text-sm text-gray-500">Grow your practice with US Attorneys</p>

      {/* Overview */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Partnership Program Overview</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          US Attorneys partners with law firms, solo practitioners, and legal service providers
          across the United States to connect qualified attorneys with prospective clients. Our
          partnership program is designed to help attorneys expand their reach, increase client
          inquiries, and grow their practice through our national directory platform.
        </p>
        <p className="leading-relaxed text-gray-700">
          Whether you are a solo practitioner looking to increase your online visibility or a
          multi-office firm seeking a scalable client acquisition channel, our partnership program
          offers flexible options to meet your needs.
        </p>
      </section>

      {/* Benefits */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Benefits for Law Firms</h2>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Enhanced Profile Visibility:</strong> Premium placement in search results for
            your practice areas and geographic regions, ensuring prospective clients find you first.
          </li>
          <li>
            <strong>Qualified Lead Generation:</strong> Receive verified client inquiries matched to
            your practice areas, jurisdiction, and availability.
          </li>
          <li>
            <strong>Video Consultations:</strong> Offer paid video consultations directly through
            the platform, expanding your service area beyond your physical office location.
          </li>
          <li>
            <strong>Client Reviews and Reputation:</strong> Build your online reputation with
            verified client reviews displayed on your attorney profile.
          </li>
          <li>
            <strong>Analytics and Insights:</strong> Access detailed analytics on profile views,
            client inquiries, and engagement metrics through your attorney dashboard.
          </li>
          <li>
            <strong>Multi-Attorney Management:</strong> Firms with multiple attorneys can manage all
            profiles from a single account with centralized billing.
          </li>
        </ul>
      </section>

      {/* Who Can Partner */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Who Can Partner With Us</h2>
        <p className="mb-4 leading-relaxed text-gray-700">Our partnership program is open to:</p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Solo Practitioners:</strong> Individual attorneys licensed and in good standing
            with their state bar association.
          </li>
          <li>
            <strong>Law Firms:</strong> Firms of all sizes, from boutique practices to large
            multi-state firms.
          </li>
          <li>
            <strong>Legal Service Providers:</strong> Organizations that provide complementary legal
            services, such as mediation, arbitration, legal technology, or legal process
            outsourcing.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          All attorney partners must hold an active license to practice law in at least one U.S.
          jurisdiction and must be in good standing with their licensing bar association.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">How to Get Started</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Joining our partnership program is straightforward:
        </p>
        <ol className="list-decimal space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Claim Your Profile:</strong> Search for your name on the Platform and claim your
            existing attorney profile by verifying your bar number and state of licensure.
          </li>
          <li>
            <strong>Complete Your Profile:</strong> Add your biography, practice areas, office
            locations, professional headshot, and contact preferences to create a comprehensive
            listing.
          </li>
          <li>
            <strong>Choose a Plan:</strong> Select a subscription plan that fits your practice size
            and goals. We offer flexible plans including free basic listings and premium tiers with
            enhanced visibility and lead generation.
          </li>
          <li>
            <strong>Start Receiving Clients:</strong> Once your profile is active, you will begin
            appearing in relevant search results and receiving client inquiries through the
            platform.
          </li>
        </ol>
      </section>

      {/* Subscription Plans */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Partnership Tiers</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          We offer multiple partnership levels to accommodate different practice needs:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Basic (Free):</strong> Standard directory listing with your name, bar
            information, practice areas, and office location. Available to all verified attorneys.
          </li>
          <li>
            <strong>Pro:</strong> Enhanced profile with priority placement in search results, lead
            notifications, review management, and analytics dashboard access.
          </li>
          <li>
            <strong>Premium:</strong> Maximum visibility with featured placement, video consultation
            capabilities, advanced lead matching, and dedicated support.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          Visit our{' '}
          <Link href="/pricing" className="text-blue-700 underline hover:text-blue-900">
            Pricing page
          </Link>{' '}
          for detailed plan information and current pricing.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Contact Our Partnership Team</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Have questions about our partnership program, need a custom enterprise solution, or want
          to discuss a strategic partnership? We would be glad to hear from you.
        </p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <p className="mb-2 text-gray-700">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:partners@lawtendr.com"
              className="text-blue-700 underline hover:text-blue-900"
            >
              partners@lawtendr.com
            </a>
          </p>
          <p className="text-gray-700">
            <strong>Subject Line:</strong> Partnership Inquiry
          </p>
        </div>
      </section>

      {/* Date */}
      <section>
        <p className="text-sm text-gray-500">This page was last updated in March 2026.</p>
      </section>
    </div>
  )
}
