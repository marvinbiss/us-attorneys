import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'Privacy Policy | US Attorneys',
    description:
      'Privacy Policy for US Attorneys. Learn how we collect, use, and protect your personal information, including your rights under CCPA and other applicable US privacy laws.',
    robots: { index: false },
  }
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mb-10 text-sm text-gray-500">Effective date: March 2026</p>

      {/* Introduction */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Introduction</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          US Attorneys (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the
          website at us-attorneys.com (the &ldquo;Platform&rdquo;). This Privacy Policy explains how
          we collect, use, disclose, and safeguard your personal information when you visit or use
          the Platform.
        </p>
        <p className="leading-relaxed text-gray-700">
          By using the Platform, you consent to the data practices described in this Privacy Policy.
          If you do not agree with the terms of this Privacy Policy, please do not access or use the
          Platform.
        </p>
      </section>

      {/* Data Collection */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Information We Collect</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          We collect information in the following ways:
        </p>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          2.1 Information You Provide Directly
        </h3>
        <ul className="mb-6 list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Account Registration:</strong> Name, email address, password, and account type
            (client or attorney) when you create an account.
          </li>
          <li>
            <strong>Attorney Profile Claims:</strong> Bar number, state of licensure, firm name,
            practice areas, office address, phone number, and professional biography when attorneys
            claim or update their profiles.
          </li>
          <li>
            <strong>Contact Forms and Inquiries:</strong> Name, email address, phone number, and
            message content when you submit a contact form or lead request.
          </li>
          <li>
            <strong>Reviews:</strong> Ratings, review text, and associated attorney information when
            you submit a review.
          </li>
          <li>
            <strong>Payment Information:</strong> Billing details provided during subscription or
            consultation payment (processed by Stripe; we do not store full payment card numbers).
          </li>
        </ul>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          2.2 Information Collected Automatically
        </h3>
        <ul className="mb-6 list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Device and Browser Data:</strong> IP address, browser type and version,
            operating system, device type, and screen resolution.
          </li>
          <li>
            <strong>Usage Data:</strong> Pages visited, time spent on pages, referring URLs, click
            patterns, and search queries.
          </li>
          <li>
            <strong>Location Data:</strong> Approximate geographic location inferred from your IP
            address to provide location-relevant attorney results.
          </li>
        </ul>
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          2.3 Information from Public Sources
        </h3>
        <p className="leading-relaxed text-gray-700">
          Attorney profile information displayed on the Platform may be compiled from publicly
          available sources, including state bar association directories, court records, government
          databases, and publicly accessible professional listings.
        </p>
      </section>

      {/* Use of Information */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
        <p className="mb-4 leading-relaxed text-gray-700">We use the information we collect to:</p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>Provide, operate, and maintain the Platform and its features.</li>
          <li>Create and manage user accounts and authenticate users.</li>
          <li>
            Process transactions, including subscription payments and video consultation bookings.
          </li>
          <li>
            Facilitate connections between clients and attorneys through search results, lead
            requests, and messaging.
          </li>
          <li>
            Send transactional emails such as booking confirmations, review requests, password
            resets, and account notifications.
          </li>
          <li>
            Improve the Platform, including analyzing usage patterns and optimizing search
            functionality.
          </li>
          <li>
            Detect, prevent, and respond to fraud, abuse, security incidents, and technical issues.
          </li>
          <li>Comply with applicable legal obligations and enforce our Terms of Service.</li>
        </ul>
      </section>

      {/* Cookies */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          4. Cookies and Tracking Technologies
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          We use cookies and similar tracking technologies to collect usage data and improve your
          experience on the Platform. The types of cookies we use include:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Essential Cookies:</strong> Required for authentication, session management, and
            core Platform functionality. These cannot be disabled.
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Used to understand how visitors interact with the
            Platform, including page views, session duration, and navigation patterns. We use Google
            Analytics for this purpose.
          </li>
          <li>
            <strong>Preference Cookies:</strong> Store your preferences such as location settings
            and search filters to improve your experience.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          You can control cookies through your browser settings. Disabling certain cookies may limit
          your ability to use some features of the Platform.
        </p>
      </section>

      {/* Third Parties */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          5. Third-Party Service Providers
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          We share personal information with third-party service providers who assist us in
          operating the Platform. These providers are contractually obligated to use your
          information only for the purposes of providing services to us:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Supabase:</strong> Database hosting, user authentication, and data storage.
          </li>
          <li>
            <strong>Stripe:</strong> Payment processing for subscriptions and consultation fees.
            Stripe&apos;s privacy policy governs its handling of payment data.
          </li>
          <li>
            <strong>Daily.co:</strong> Video conferencing infrastructure for attorney- client video
            consultations.
          </li>
          <li>
            <strong>Resend:</strong> Transactional email delivery (booking confirmations, password
            resets, notifications).
          </li>
          <li>
            <strong>Google Analytics:</strong> Website analytics and usage tracking.
          </li>
          <li>
            <strong>Vercel:</strong> Website hosting and content delivery.
          </li>
          <li>
            <strong>Sentry:</strong> Error monitoring and application performance tracking.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          We do not sell your personal information to third parties.
        </p>
      </section>

      {/* Data Retention */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Data Retention</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          We retain your personal information for as long as your account is active or as needed to
          provide you with our services. We may also retain and use your information as necessary
          to:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>Comply with legal obligations.</li>
          <li>Resolve disputes and enforce our agreements.</li>
          <li>Maintain security and prevent fraud.</li>
          <li>
            Fulfill legitimate business purposes, such as maintaining attorney profile data compiled
            from public records.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          When personal information is no longer needed for the purposes for which it was collected,
          we will delete or anonymize it in accordance with applicable law.
        </p>
      </section>

      {/* Data Security */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Data Security</h2>
        <p className="leading-relaxed text-gray-700">
          We implement reasonable administrative, technical, and physical safeguards to protect your
          personal information against unauthorized access, alteration, disclosure, or destruction.
          These measures include encryption of data in transit (TLS/SSL), row-level security
          policies on our database, secure authentication mechanisms, and regular security reviews.
          However, no method of transmission over the Internet or electronic storage is 100% secure,
          and we cannot guarantee absolute security.
        </p>
      </section>

      {/* User Rights (CCPA) */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Your Privacy Rights</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Depending on your state of residence, you may have certain rights regarding your personal
          information under applicable privacy laws, including the California Consumer Privacy Act
          (CCPA) and similar state privacy statutes. These rights may include:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            <strong>Right to Know:</strong> The right to request information about the categories
            and specific pieces of personal information we have collected about you.
          </li>
          <li>
            <strong>Right to Delete:</strong> The right to request deletion of personal information
            we have collected from you, subject to certain exceptions.
          </li>
          <li>
            <strong>Right to Correct:</strong> The right to request correction of inaccurate
            personal information.
          </li>
          <li>
            <strong>Right to Opt-Out:</strong> The right to opt out of the sale or sharing of your
            personal information. We do not sell personal information.
          </li>
          <li>
            <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for
            exercising any of your privacy rights.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          To exercise any of these rights, please contact us using the information provided below.
          We will respond to verifiable consumer requests within the timeframes required by
          applicable law (generally within 45 days).
        </p>
      </section>

      {/* Children */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">9. Children&apos;s Privacy</h2>
        <p className="leading-relaxed text-gray-700">
          The Platform is not intended for use by individuals under the age of 18. We do not
          knowingly collect personal information from children under 18. If we learn that we have
          collected personal information from a child under 18, we will take steps to delete such
          information promptly.
        </p>
      </section>

      {/* Changes */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          10. Changes to This Privacy Policy
        </h2>
        <p className="leading-relaxed text-gray-700">
          We may update this Privacy Policy from time to time to reflect changes in our practices,
          technologies, legal requirements, or other factors. We will post the updated Privacy
          Policy on this page and update the &ldquo;Effective date&rdquo; above. We encourage you to
          review this Privacy Policy periodically. Your continued use of the Platform after any
          changes constitutes your acceptance of the updated Privacy Policy.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">11. Contact Information</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          If you have questions about this Privacy Policy, wish to exercise your privacy rights, or
          have concerns about how your information is handled, please contact us:
        </p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <p className="mb-2 text-gray-700">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:privacy@lawtendr.com"
              className="text-blue-700 underline hover:text-blue-900"
            >
              privacy@lawtendr.com
            </a>
          </p>
          <p className="text-gray-700">
            <strong>Subject Line:</strong> Privacy Inquiry
          </p>
        </div>
      </section>

      {/* Date */}
      <section>
        <p className="text-sm text-gray-500">This Privacy Policy was last updated in March 2026.</p>
      </section>
    </div>
  )
}
