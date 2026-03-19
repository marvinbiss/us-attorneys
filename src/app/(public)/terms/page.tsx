import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'Terms of Service | US Attorneys',
    description:
      'Terms of Service governing the use of US Attorneys, an online attorney directory and legal services platform.',
    robots: { index: false },
  }
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mb-10 text-sm text-gray-500">Effective date: March 2026</p>

      {/* Acceptance */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          By accessing or using the US Attorneys website (the &ldquo;Platform&rdquo;), you agree to
          be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to all of
          these Terms, you may not access or use the Platform. We reserve the right to update or
          modify these Terms at any time, and your continued use of the Platform following any
          changes constitutes your acceptance of the revised Terms.
        </p>
        <p className="leading-relaxed text-gray-700">
          These Terms apply to all visitors, users, attorneys, and others who access or use the
          Platform, whether registered or unregistered.
        </p>
      </section>

      {/* Service Description */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">2. Description of Service</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          US Attorneys is an online directory and platform that connects individuals seeking legal
          services with licensed attorneys across the United States. The Platform provides attorney
          listings, practice area information, location-based search, attorney profiles, client
          reviews, video consultations, and related informational content.
        </p>
        <p className="leading-relaxed text-gray-700">
          US Attorneys is not a law firm and does not provide legal advice, legal representation, or
          legal services of any kind. The Platform serves solely as an informational and referral
          resource.
        </p>
      </section>

      {/* User Accounts */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">3. User Accounts</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Certain features of the Platform require you to create an account. When you create an
          account, you agree to:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            Provide accurate, current, and complete information during the registration process.
          </li>
          <li>
            Maintain and promptly update your account information to keep it accurate, current, and
            complete.
          </li>
          <li>
            Maintain the security and confidentiality of your login credentials and promptly notify
            us of any unauthorized use of your account.
          </li>
          <li>Accept responsibility for all activities that occur under your account.</li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          We reserve the right to suspend or terminate your account at our sole discretion, without
          notice, for conduct that we determine violates these Terms or is harmful to other users,
          the Platform, or third parties, or for any other reason.
        </p>
      </section>

      {/* Attorney Listings */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          4. Attorney Listings and Profiles
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Attorney profiles displayed on the Platform are compiled from publicly available data
          sources, including state bar associations, court records, and publicly accessible
          directories. Attorneys may claim and manage their profiles by verifying their identity
          through our bar number verification process.
        </p>
        <p className="mb-4 leading-relaxed text-gray-700">
          Attorneys who claim their profiles agree to:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>
            Provide truthful and accurate information regarding their qualifications, bar
            admissions, practice areas, and professional experience.
          </li>
          <li>
            Maintain an active and valid license to practice law in the jurisdictions represented on
            their profile.
          </li>
          <li>
            Comply with all applicable rules of professional conduct and advertising regulations
            established by their licensing jurisdictions.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          US Attorneys does not independently verify every detail of attorney profiles and makes no
          warranty as to the accuracy, completeness, or currency of attorney information displayed
          on the Platform.
        </p>
      </section>

      {/* User Conduct */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">5. User Conduct</h2>
        <p className="mb-4 leading-relaxed text-gray-700">You agree not to use the Platform to:</p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>Violate any applicable federal, state, local, or international law or regulation.</li>
          <li>
            Impersonate any person or entity, or falsely state or otherwise misrepresent your
            affiliation with a person or entity.
          </li>
          <li>
            Upload, post, or transmit any content that is defamatory, obscene, fraudulent, or
            otherwise objectionable.
          </li>
          <li>
            Engage in any activity that interferes with or disrupts the Platform or its servers and
            networks.
          </li>
          <li>
            Attempt to gain unauthorized access to any portion of the Platform, other accounts, or
            computer systems or networks connected to the Platform.
          </li>
          <li>Scrape, harvest, or collect information about other users without their consent.</li>
        </ul>
      </section>

      {/* Reviews */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">6. Reviews and User Content</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Users may submit reviews, ratings, and other content (&ldquo;User Content&rdquo;)
          regarding attorneys listed on the Platform. By submitting User Content, you represent that
          your submissions are truthful, based on your genuine experience, and do not violate any
          third-party rights.
        </p>
        <p className="leading-relaxed text-gray-700">
          We reserve the right to remove, edit, or refuse to publish any User Content at our sole
          discretion, including content that we determine to be false, defamatory, harassing, or
          otherwise in violation of these Terms.
        </p>
      </section>

      {/* Payments */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">7. Payments and Subscriptions</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Certain features of the Platform, including premium attorney profiles, video
          consultations, and lead generation services, require payment. All payments are processed
          securely through Stripe, our third-party payment processor.
        </p>
        <p className="mb-4 leading-relaxed text-gray-700">
          Subscription plans automatically renew at the end of each billing period unless cancelled
          before the renewal date. You may cancel your subscription at any time through your account
          settings or the Stripe billing portal.
        </p>
        <p className="leading-relaxed text-gray-700">
          All fees are non-refundable except as required by applicable law or as expressly stated in
          a separate refund policy.
        </p>
      </section>

      {/* Intellectual Property */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">8. Intellectual Property</h2>
        <p className="leading-relaxed text-gray-700">
          All content, features, and functionality of the Platform, including but not limited to
          text, graphics, logos, icons, images, software, and compilations of data, are the
          exclusive property of US Attorneys or its licensors and are protected by United States and
          international copyright, trademark, and other intellectual property laws. You may not
          reproduce, distribute, modify, create derivative works of, publicly display, or otherwise
          exploit any Platform content without our prior written consent.
        </p>
      </section>

      {/* Disclaimers */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">9. Disclaimers</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          THE PLATFORM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS,
          WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
        <p className="mb-4 leading-relaxed text-gray-700">
          US Attorneys does not warrant that the Platform will be uninterrupted, error-free, or free
          of viruses or other harmful components. We do not warrant or make any representations
          regarding the accuracy, reliability, or completeness of any content on the Platform.
        </p>
        <p className="leading-relaxed text-gray-700">
          US Attorneys does not endorse, recommend, or guarantee any attorney listed on the
          Platform. Any decision to retain an attorney is made solely at your own risk and
          discretion.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">10. Limitation of Liability</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL US ATTORNEYS, ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
          REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR
          OTHER INTANGIBLE LOSSES, RESULTING FROM:
        </p>
        <ul className="list-disc space-y-3 pl-6 text-gray-700">
          <li>Your access to, use of, or inability to access or use the Platform.</li>
          <li>Any conduct or content of any third party on the Platform.</li>
          <li>Any content obtained from the Platform.</li>
          <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
        </ul>
        <p className="mt-4 leading-relaxed text-gray-700">
          In no event shall our aggregate liability exceed the greater of one hundred dollars
          ($100.00) or the amount you paid us, if any, in the six (6) months preceding the claim.
        </p>
      </section>

      {/* Indemnification */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">11. Indemnification</h2>
        <p className="leading-relaxed text-gray-700">
          You agree to indemnify, defend, and hold harmless US Attorneys, its officers, directors,
          employees, agents, and affiliates from and against any and all claims, liabilities,
          damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising
          out of or relating to your use of the Platform, your violation of these Terms, or your
          violation of any rights of another party.
        </p>
      </section>

      {/* Governing Law */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          12. Governing Law and Dispute Resolution
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Delaware, without regard to its conflict of law provisions. Any dispute arising out of or
          relating to these Terms or the Platform shall be resolved exclusively in the state or
          federal courts located in Delaware, and you consent to the personal jurisdiction of such
          courts.
        </p>
        <p className="leading-relaxed text-gray-700">
          Any claim or cause of action arising out of or related to the Platform must be filed
          within one (1) year after the cause of action arose, or the claim shall be permanently
          barred.
        </p>
      </section>

      {/* Termination */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">13. Termination</h2>
        <p className="leading-relaxed text-gray-700">
          We may terminate or suspend your access to the Platform immediately, without prior notice
          or liability, for any reason, including if you breach these Terms. Upon termination, your
          right to use the Platform will immediately cease. All provisions of these Terms that by
          their nature should survive termination shall survive, including ownership provisions,
          warranty disclaimers, indemnification, and limitations of liability.
        </p>
      </section>

      {/* Changes */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">14. Changes to Terms</h2>
        <p className="leading-relaxed text-gray-700">
          We reserve the right to modify these Terms at any time. We will provide notice of material
          changes by posting the updated Terms on this page and updating the &ldquo;Effective
          date&rdquo; above. Your continued use of the Platform after any such changes constitutes
          your acceptance of the new Terms. We encourage you to review these Terms periodically.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">15. Contact Information</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          If you have any questions about these Terms, please contact us:
        </p>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <p className="mb-2 text-gray-700">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:legal@lawtendr.com"
              className="text-blue-700 underline hover:text-blue-900"
            >
              legal@lawtendr.com
            </a>
          </p>
          <p className="text-gray-700">
            <strong>Subject Line:</strong> Terms of Service Inquiry
          </p>
        </div>
      </section>

      {/* Date */}
      <section>
        <p className="text-sm text-gray-500">These Terms were last updated in March 2026.</p>
      </section>
    </div>
  )
}
