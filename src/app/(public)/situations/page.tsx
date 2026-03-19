import { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'

export const revalidate = REVALIDATE.serviceLocation

export function generateMetadata(): Metadata {
  const title = 'Legal Situations — Find the Right Attorney for Your Case'
  const description =
    'Browse common legal situations to find the right attorney. From car accidents and DUI charges to divorce, custody disputes, and workplace injuries. Get legal help now.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_US',
    },
    alternates: {
      canonical: `${SITE_URL}/situations`,
    },
  }
}

// Top 50 situations grouped by category
const situationsByCategory: Record<string, { slug: string; name: string; description: string }[]> =
  {
    'Auto Accidents': [
      {
        slug: 'rear-end-collision',
        name: 'Rear End Collision',
        description: 'Injured in a rear-end collision? Learn your rights and find an attorney.',
      },
      {
        slug: 'hit-and-run',
        name: 'Hit and Run',
        description: 'Victim of a hit-and-run accident? Get legal help now.',
      },
      {
        slug: 'drunk-driver-accident',
        name: 'Drunk Driver Accident',
        description: 'Hit by a drunk driver? You may be entitled to punitive damages.',
      },
      {
        slug: 'uber-lyft-accident',
        name: 'Uber/Lyft Accident',
        description: 'Injured in a rideshare accident? Insurance coverage can be complex.',
      },
      {
        slug: 'uninsured-motorist',
        name: 'Uninsured Motorist',
        description: 'Hit by an uninsured driver? You still have options.',
      },
      {
        slug: '18-wheeler-accident',
        name: '18-Wheeler Accident',
        description: 'Involved in a truck accident? Multiple parties may share liability.',
      },
      {
        slug: 'motorcycle-crash',
        name: 'Motorcycle Crash',
        description: 'Injured in a motorcycle crash? Bikers often face biased investigations.',
      },
    ],
    'Personal Injury': [
      {
        slug: 'pedestrian-accident',
        name: 'Pedestrian Accident',
        description: 'Struck as a pedestrian? Drivers owe a duty of care.',
      },
      {
        slug: 'bicycle-accident',
        name: 'Bicycle Accident',
        description: 'Injured while cycling? Get compensation for your injuries.',
      },
      {
        slug: 'whiplash-injury',
        name: 'Whiplash Injury',
        description: 'Suffering whiplash after an accident? Document and protect your claim.',
      },
      {
        slug: 'dog-bite',
        name: 'Dog Bite',
        description: 'Bitten by a dog? Most states hold owners strictly liable.',
      },
      {
        slug: 'slip-in-store',
        name: 'Slip in Store',
        description: 'Slipped and fell in a store? The property owner may be liable.',
      },
      {
        slug: 'defective-product-injury',
        name: 'Defective Product Injury',
        description: 'Injured by a defective product? Manufacturers can be held strictly liable.',
      },
    ],
    Medical: [
      {
        slug: 'medical-misdiagnosis',
        name: 'Medical Misdiagnosis',
        description: 'Misdiagnosed by a doctor? This can constitute medical malpractice.',
      },
      {
        slug: 'surgical-error',
        name: 'Surgical Error',
        description: 'Suffered from a surgical mistake? Explore your legal options.',
      },
      {
        slug: 'birth-injury',
        name: 'Birth Injury',
        description: 'Child injured during birth? Hospital negligence claims may apply.',
      },
      {
        slug: 'nursing-home-neglect',
        name: 'Nursing Home Neglect',
        description: 'Is a loved one being neglected in a facility? Take action now.',
      },
    ],
    Workplace: [
      {
        slug: 'workplace-injury',
        name: 'Workplace Injury',
        description: 'Hurt on the job? Workers comp may cover your medical bills and lost wages.',
      },
      {
        slug: 'construction-accident',
        name: 'Construction Accident',
        description: 'Injured on a construction site? Multiple parties may be liable.',
      },
      {
        slug: 'wrongful-termination-retaliation',
        name: 'Wrongful Termination',
        description: 'Fired for whistleblowing or filing a complaint? That may be illegal.',
      },
      {
        slug: 'workplace-harassment',
        name: 'Workplace Harassment',
        description: 'Experiencing harassment at work? You have legal protections.',
      },
      {
        slug: 'discrimination-at-work',
        name: 'Discrimination at Work',
        description: 'Facing workplace discrimination? Federal and state laws protect you.',
      },
      {
        slug: 'unpaid-wages',
        name: 'Unpaid Wages',
        description: 'Not getting paid what you are owed? You can recover unpaid wages.',
      },
    ],
    'Criminal Defense': [
      {
        slug: 'dui-first-offense',
        name: 'DUI First Offense',
        description: 'Charged with a first DUI? Consequences vary by state.',
      },
      {
        slug: 'arrested-for-assault',
        name: 'Arrested for Assault',
        description: 'Facing assault charges? A criminal defense attorney can help.',
      },
      {
        slug: 'drug-possession-charge',
        name: 'Drug Possession',
        description: 'Charged with possession? Penalties depend on substance and amount.',
      },
      {
        slug: 'domestic-violence-accusation',
        name: 'Domestic Violence Accusation',
        description: 'Accused of domestic violence? Get legal representation immediately.',
      },
      {
        slug: 'false-arrest',
        name: 'False Arrest',
        description: 'Wrongfully arrested? You may have a civil rights claim.',
      },
      {
        slug: 'police-brutality',
        name: 'Police Brutality',
        description: 'Victim of police brutality? File a complaint and explore legal action.',
      },
      {
        slug: 'federal-investigation',
        name: 'Federal Investigation',
        description: 'Under federal investigation? Get an attorney before speaking to agents.',
      },
    ],
    'Family Law': [
      {
        slug: 'filing-for-divorce',
        name: 'Filing for Divorce',
        description: 'Ready to file for divorce? Understand the process and your rights.',
      },
      {
        slug: 'custody-dispute',
        name: 'Custody Dispute',
        description: 'Fighting for custody? Courts prioritize the best interest of the child.',
      },
      {
        slug: 'child-support-modification',
        name: 'Child Support Modification',
        description: 'Need to modify child support? Changed circumstances may qualify.',
      },
    ],
    'Housing & Property': [
      {
        slug: 'eviction-notice',
        name: 'Eviction Notice',
        description: 'Received an eviction notice? Know your rights as a tenant.',
      },
      {
        slug: 'foreclosure-notice',
        name: 'Foreclosure Notice',
        description: 'Facing foreclosure? There may be options to save your home.',
      },
    ],
    'Financial & Business': [
      {
        slug: 'denied-insurance-claim',
        name: 'Denied Insurance Claim',
        description: 'Insurance claim denied? Bad faith practices may give you grounds to sue.',
      },
      {
        slug: 'business-partnership-dispute',
        name: 'Business Partnership Dispute',
        description: 'Partner dispute? Legal intervention may be needed.',
      },
      {
        slug: 'contract-breach',
        name: 'Contract Breach',
        description: 'Other party broke the contract? You may be entitled to damages.',
      },
      {
        slug: 'filing-bankruptcy',
        name: 'Filing Bankruptcy',
        description:
          'Considering bankruptcy? Chapter 7 and 13 offer different paths to debt relief.',
      },
      {
        slug: 'wage-garnishment',
        name: 'Wage Garnishment',
        description: 'Wages being garnished? Legal options may reduce or stop garnishments.',
      },
      {
        slug: 'irs-audit',
        name: 'IRS Audit',
        description: 'Being audited by the IRS? A tax attorney can protect your rights.',
      },
      {
        slug: 'social-security-denied',
        name: 'Social Security Denied',
        description:
          'SSDI claim denied? Most initial applications are denied — appeal with an attorney.',
      },
    ],
    Immigration: [
      {
        slug: 'green-card-denied',
        name: 'Green Card Denied',
        description: 'Green card application denied? An immigration attorney can help appeal.',
      },
      {
        slug: 'deportation-order',
        name: 'Deportation Order',
        description: 'Facing deportation? Time-sensitive legal options may be available.',
      },
      {
        slug: 'asylum-application',
        name: 'Asylum Application',
        description: 'Seeking asylum in the US? An immigration attorney can guide the process.',
      },
    ],
    Other: [
      {
        slug: 'will-contest',
        name: 'Will Contest',
        description: 'Disputing a will? Undue influence or incapacity claims require proof.',
      },
      {
        slug: 'trademark-infringement',
        name: 'Trademark Infringement',
        description: 'Someone using your trademark? Act quickly to protect your brand.',
      },
      {
        slug: 'patent-infringement',
        name: 'Patent Infringement',
        description: 'Patent being infringed? Enforce your intellectual property rights.',
      },
      {
        slug: 'elder-financial-abuse',
        name: 'Elder Financial Abuse',
        description: 'Elderly family member being financially exploited? Legal remedies exist.',
      },
      {
        slug: 'class-action-lawsuit',
        name: 'Class Action Lawsuit',
        description: 'Part of a class action? Understand your rights and potential compensation.',
      },
    ],
  }

export default function SituationsIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-red-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">
            Legal Situations
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-600">
            Dealing with a legal issue? Browse common situations below to understand your rights and
            find a qualified attorney near you. Each situation page provides step-by-step guidance
            and connects you with experienced lawyers in your area.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {Object.entries(situationsByCategory).map(([category, situations]) => (
            <div key={category} className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-gray-900">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {situations.map((sit) => (
                  <Link
                    key={sit.slug}
                    href={`/situations/${sit.slug}/new-york`}
                    className="rounded-lg border border-gray-200 p-4 transition-all hover:border-red-300 hover:shadow-sm"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">{sit.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{sit.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
