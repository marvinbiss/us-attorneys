import type { Metadata } from 'next'

export function generateMetadata(): Metadata {
  return {
    title: 'Accessibility Statement | US Attorneys',
    description:
      'US Attorneys is committed to ensuring digital accessibility for people with disabilities. Learn about our WCAG 2.1 AA conformance efforts, accessibility features, and how to report issues.',
    robots: { index: false },
  }
}

export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Accessibility Statement
      </h1>
      <p className="text-sm text-gray-500 mb-10">
        Last reviewed: March 2026
      </p>

      {/* Commitment */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Our Commitment to Accessibility
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          US Attorneys is committed to ensuring that our website is accessible to
          all users, including people with disabilities. We believe that every
          person deserves equal access to information about legal representation,
          and we strive to provide an inclusive digital experience that conforms
          to established accessibility standards.
        </p>
        <p className="text-gray-700 leading-relaxed">
          We are actively working to increase the accessibility and usability of
          our website in alignment with the{' '}
          <strong>
            Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
          </strong>{' '}
          standards, as published by the World Wide Web Consortium (W3C). These
          guidelines define how to make web content more accessible to people
          with a wide range of disabilities, including visual, auditory,
          physical, speech, cognitive, language, learning, and neurological
          disabilities.
        </p>
      </section>

      {/* Conformance Status */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Conformance Status
        </h2>
        <p className="text-gray-700 leading-relaxed">
          We aim for WCAG 2.1 Level AA conformance across all pages of our
          website. Our conformance status is{' '}
          <strong>partially conformant</strong>, meaning that some portions of
          the content may not yet fully conform to every WCAG 2.1 Level AA
          success criterion. We are continuously auditing and remediating issues
          to improve conformance over time.
        </p>
      </section>

      {/* Accessibility Features */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Accessibility Features
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We have implemented the following features to support accessibility:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-gray-700">
          <li>
            <strong>Keyboard Navigation:</strong> All interactive elements,
            including links, buttons, forms, and menus, are operable via keyboard
            input. Focus indicators are visible to help users track their
            position on the page.
          </li>
          <li>
            <strong>Screen Reader Compatibility:</strong> We use semantic HTML
            elements, ARIA landmarks, and descriptive labels to ensure that
            assistive technologies such as screen readers can accurately interpret
            and convey page content.
          </li>
          <li>
            <strong>Color Contrast:</strong> Text and interactive elements are
            designed to meet or exceed WCAG 2.1 Level AA minimum contrast ratios
            (4.5:1 for normal text, 3:1 for large text) to ensure readability for
            users with low vision or color vision deficiencies.
          </li>
          <li>
            <strong>Responsive Design:</strong> Our website is built with a
            responsive layout that adapts to various screen sizes and
            orientations, supporting users who rely on magnification, mobile
            devices, or alternative display configurations.
          </li>
          <li>
            <strong>Text Alternatives:</strong> Images and non-text content
            include descriptive alt text to convey meaning to users who cannot
            perceive visual content.
          </li>
          <li>
            <strong>Consistent Navigation:</strong> Navigation menus and page
            structures are consistent across the site to help users predict where
            to find information and how to interact with the interface.
          </li>
          <li>
            <strong>Form Accessibility:</strong> Form fields include visible
            labels and, where applicable, provide clear error messages and
            instructions to assist users in completing submissions.
          </li>
        </ul>
      </section>

      {/* Known Limitations */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Known Limitations
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Despite our efforts, some areas of the website may not yet be fully
          accessible. We are aware of the following limitations and are actively
          working to resolve them:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-gray-700">
          <li>
            <strong>Interactive Maps:</strong> Our embedded map components may
            not be fully operable via keyboard or screen reader. We provide
            text-based alternatives (address listings) wherever maps appear.
          </li>
          <li>
            <strong>Dynamically Generated Content:</strong> Some
            programmatically generated pages (such as attorney listings filtered
            by location or practice area) may have inconsistent heading
            hierarchies or incomplete ARIA attributes. These pages are being
            audited on a rolling basis.
          </li>
          <li>
            <strong>PDF and Downloadable Documents:</strong> Certain documents
            available for download may not yet be formatted for full screen reader
            compatibility. We are working to remediate these files.
          </li>
          <li>
            <strong>Third-Party Components:</strong> Some interactive widgets
            (e.g., payment forms, video consultation interfaces) are provided by
            third-party services and may not meet every WCAG 2.1 AA criterion.
            We actively engage with these vendors to advocate for improved
            accessibility.
          </li>
        </ul>
      </section>

      {/* Third-Party Content */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Third-Party Content
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Our website includes content and functionality provided by third-party
          services, including payment processing (Stripe), video conferencing
          (Daily.co), analytics (Google Analytics), and embedded maps (Leaflet).
          While we strive to select partners with strong accessibility practices,
          we cannot guarantee that all third-party content fully conforms to WCAG
          2.1 Level AA. If you encounter an accessibility barrier on a
          third-party component, please contact us so that we can work with the
          provider to address the issue or offer you an alternative means of
          access.
        </p>
      </section>

      {/* Feedback and Contact */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Feedback and Contact Information
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          We welcome feedback on the accessibility of our website. If you
          encounter any barriers, have difficulty accessing content, or have
          suggestions for improvement, please contact us:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
          <p className="text-gray-700 mb-2">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:accessibility@us-attorneys.com"
              className="text-blue-700 underline hover:text-blue-900"
            >
              accessibility@us-attorneys.com
            </a>
          </p>
          <p className="text-gray-700">
            <strong>Subject Line:</strong> Accessibility Feedback
          </p>
        </div>
        <p className="text-gray-700 leading-relaxed">
          When reporting an accessibility issue, please include the following
          details to help us investigate and respond effectively:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-3">
          <li>The URL or page where you encountered the issue</li>
          <li>A description of the problem and the expected behavior</li>
          <li>
            The assistive technology or browser you were using (e.g., JAWS with
            Chrome, VoiceOver with Safari)
          </li>
          <li>Your operating system and device type</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-4">
          We aim to acknowledge accessibility feedback within two (2) business
          days and to provide a substantive response, including a proposed
          resolution or timeline, within ten (10) business days.
        </p>
      </section>

      {/* Ongoing Efforts */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Ongoing Improvement
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Accessibility is an ongoing effort, not a one-time project. We are
          committed to the following practices to maintain and improve
          accessibility across our platform:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-gray-700">
          <li>
            Conducting periodic accessibility audits using both automated tools
            and manual testing with assistive technologies
          </li>
          <li>
            Incorporating accessibility requirements into our development
            process and quality assurance testing
          </li>
          <li>
            Training our team members on accessibility best practices and WCAG
            guidelines
          </li>
          <li>
            Engaging with users who have disabilities to understand their
            experience and identify areas for improvement
          </li>
          <li>
            Monitoring accessibility standards and regulations to ensure our
            practices remain current
          </li>
        </ul>
      </section>

      {/* Legal */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Applicable Standards and Regulations
        </h2>
        <p className="text-gray-700 leading-relaxed">
          This accessibility statement has been prepared with reference to the
          Web Content Accessibility Guidelines (WCAG) 2.1 published by the W3C
          Web Accessibility Initiative (WAI). We also recognize our obligations
          under applicable federal and state laws, including the Americans with
          Disabilities Act (ADA), Section 508 of the Rehabilitation Act, and
          relevant state digital accessibility requirements. This statement does
          not constitute a legal guarantee of full conformance but reflects our
          good-faith commitment to making our website as accessible as
          reasonably practicable.
        </p>
      </section>

      {/* Date */}
      <section>
        <p className="text-sm text-gray-500">
          This statement was last reviewed and updated in March 2026.
        </p>
      </section>
    </div>
  )
}
