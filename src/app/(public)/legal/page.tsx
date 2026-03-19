import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'Legal Disclaimers | US Attorneys',
    description:
      'Legal disclaimers for US Attorneys. Important information about the nature of our directory service, the absence of attorney-client relationships, and limitations on the information provided.',
    robots: { index: false },
  }
}

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Legal Disclaimers</h1>
      <p className="mb-10 text-sm text-gray-500">Last reviewed: March 2026</p>

      {/* Not a Law Firm */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">US Attorneys Is Not a Law Firm</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          US Attorneys is an online directory and information platform. We are not a law firm, do
          not employ attorneys to provide legal services, and do not practice law in any
          jurisdiction. The Platform exists solely to help users locate licensed attorneys and
          access general legal information.
        </p>
        <p className="leading-relaxed text-gray-700">
          Our role is limited to providing a technology platform that connects prospective clients
          with attorneys. We do not participate in, supervise, or have any control over the legal
          services provided by attorneys listed on the Platform.
        </p>
      </section>

      {/* No Attorney-Client Relationship */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          No Attorney-Client Relationship
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Your use of the Platform, including browsing attorney profiles, submitting contact forms,
          scheduling consultations, or engaging in any other interaction through the Platform, does
          not create an attorney-client relationship between you and US Attorneys, or between you
          and any attorney listed on the Platform, unless and until you and an attorney have
          mutually agreed to establish such a relationship in accordance with the applicable rules
          of professional conduct.
        </p>
        <p className="leading-relaxed text-gray-700">
          Any information you submit through the Platform prior to establishing a formal
          attorney-client relationship may not be protected by attorney-client privilege. Do not
          submit sensitive or confidential information through the Platform unless you have
          confirmed a formal engagement with a specific attorney.
        </p>
      </section>

      {/* Informational Purposes Only */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Informational Purposes Only</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          All content on the Platform, including attorney profiles, practice area descriptions,
          legal guides, frequently asked questions, statute of limitations data, cost estimates, and
          other informational content, is provided for general informational purposes only. This
          content does not constitute legal advice and should not be relied upon as a substitute for
          consultation with a qualified attorney.
        </p>
        <p className="leading-relaxed text-gray-700">
          Legal matters are highly fact-specific and vary by jurisdiction. The information on the
          Platform may not reflect the most current legal developments, may not apply to your
          specific situation, and may not be accurate or complete. Always consult a licensed
          attorney in your jurisdiction for advice regarding your particular legal circumstances.
        </p>
      </section>

      {/* No Legal Advice */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">No Legal Advice</h2>
        <p className="leading-relaxed text-gray-700">
          Nothing on the Platform should be construed as legal advice. US Attorneys does not provide
          legal opinions, legal counsel, or recommendations regarding any legal matter. We do not
          evaluate the merits of your case, recommend specific legal strategies, or advise you on
          your legal rights or obligations. Any communication through the Platform is for the
          purpose of facilitating connections with attorneys and providing general information only.
        </p>
      </section>

      {/* Attorney Information Accuracy */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Accuracy of Attorney Information
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          Attorney information displayed on the Platform is compiled from publicly available
          sources, including state bar association records, court filings, and government databases.
          While we make reasonable efforts to ensure the accuracy of this information, we do not
          independently verify every detail and cannot guarantee that all information is current,
          complete, or error-free.
        </p>
        <p className="leading-relaxed text-gray-700">
          You should independently verify an attorney&apos;s credentials, licensure status, and
          disciplinary record through the relevant state bar association before retaining their
          services.
        </p>
      </section>

      {/* Bar Association Disclaimers */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Bar Association and Licensing Disclaimers
        </h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          The inclusion of an attorney on the Platform does not constitute an endorsement,
          certification, or recommendation by any state bar association, court, or regulatory body.
          Attorney licensure status, bar admission data, and disciplinary history are sourced from
          public records and may not reflect real-time changes.
        </p>
        <p className="leading-relaxed text-gray-700">
          US Attorneys is not affiliated with, endorsed by, or sponsored by any state bar
          association, the American Bar Association, or any federal or state court system.
          References to bar associations or court systems are made solely for informational
          purposes.
        </p>
      </section>

      {/* No Endorsement */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">No Endorsement of Attorneys</h2>
        <p className="leading-relaxed text-gray-700">
          The listing, ranking, or display of attorneys on the Platform does not imply endorsement,
          recommendation, or certification of any attorney&apos;s qualifications, competence, or
          suitability for your legal matter. Search results and attorney rankings may be influenced
          by factors including geographic proximity, profile completeness, subscription level, and
          user reviews. The decision to retain an attorney is solely your responsibility, and you
          should conduct your own due diligence before engaging any attorney&apos;s services.
        </p>
      </section>

      {/* Third-Party Links */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Third-Party Links and Content</h2>
        <p className="leading-relaxed text-gray-700">
          The Platform may contain links to third-party websites, resources, or services. These
          links are provided for convenience only, and we do not endorse, control, or assume
          responsibility for the content, accuracy, privacy policies, or practices of any
          third-party websites. Your interactions with third-party websites are governed by the
          terms and policies of those websites.
        </p>
      </section>

      {/* Limitation of Liability */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Limitation of Liability</h2>
        <p className="leading-relaxed text-gray-700">
          US Attorneys shall not be held liable for any damages, losses, or expenses arising from
          your use of the Platform, your reliance on information provided through the Platform, or
          your interactions with attorneys listed on the Platform. This includes, without
          limitation, any damages resulting from the legal services provided (or not provided) by
          any attorney found through the Platform. Please refer to our Terms of Service for complete
          details regarding limitation of liability.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Contact Information</h2>
        <p className="mb-4 leading-relaxed text-gray-700">
          If you have questions about these legal disclaimers, please contact us:
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
            <strong>Subject Line:</strong> Legal Disclaimer Inquiry
          </p>
        </div>
      </section>

      {/* Date */}
      <section>
        <p className="text-sm text-gray-500">
          These legal disclaimers were last reviewed and updated in March 2026.
        </p>
      </section>
    </div>
  )
}
