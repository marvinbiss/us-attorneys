import { Metadata } from 'next'
import Link from 'next/link'
import {
  Scale, Gavel, Heart, Shield, Users, Building, Briefcase, FileText,
  Car, HardHat, Landmark, Globe, DollarSign, Home, Leaf, ShieldCheck,
  ArrowRight, TrendingUp, Award, MapPin, Sparkles, BookOpen, Grip,
  UserCheck, ClipboardCheck, AlertTriangle, Banknote, Baby
} from 'lucide-react'
import JsonLd from '@/components/JsonLd'
import { getOrganizationSchema, getBreadcrumbSchema, getItemListSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { REVALIDATE } from '@/lib/cache'
import Breadcrumb from '@/components/Breadcrumb'
import { PopularCitiesLinks, GeographicNavigation } from '@/components/InternalLinks'
import { practiceAreas as staticPracticeAreas } from '@/lib/data/usa'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

// Set of valid service slugs that have dedicated pages
const validServiceSlugs = new Set(staticPracticeAreas.map(s => s.slug))

// ISR: Revalidate every hour
export const revalidate = REVALIDATE.services

export const metadata: Metadata = {
  title: 'Practice Areas | US Attorneys',
  description: 'Browse attorneys by legal practice area. Personal injury, family law, criminal defense, and more. Find verified attorneys across all 50 states. Free consultations.',
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
  openGraph: {
    title: 'Practice Areas | US Attorneys',
    description: 'Browse attorneys by legal practice area. Personal injury, family law, criminal defense, and more. Find verified attorneys across all 50 states.',
    url: `${SITE_URL}/services`,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'US Attorneys — All Practice Areas' }],
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Practice Areas | US Attorneys',
    description: 'Browse attorneys by legal practice area. Personal injury, family law, criminal defense, and more. Find verified attorneys across all 50 states. Free consultations.',
  },
}

const allServices = [
  {
    category: 'Personal Injury & Accidents',
    icon: Scale,
    color: 'blue',
    services: [
      { name: 'Personal Injury', slug: 'personal-injury', icon: Scale, description: 'Car accidents, slip and fall, medical malpractice claims' },
      { name: 'Car Accident', slug: 'car-accident', icon: Car, description: 'Auto collision claims, insurance disputes, hit-and-run cases' },
      { name: 'Medical Malpractice', slug: 'medical-malpractice', icon: Heart, description: 'Hospital negligence, surgical errors, misdiagnosis' },
      { name: 'Workers Compensation', slug: 'workers-compensation', icon: HardHat, description: 'Workplace injuries, occupational illness, disability benefits' },
      { name: 'Wrongful Death', slug: 'wrongful-death', icon: AlertTriangle, description: 'Fatal accident claims, survivor benefits, estate recovery' },
      { name: 'Product Liability', slug: 'product-liability', icon: ShieldCheck, description: 'Defective products, recalls, manufacturer negligence' },
    ]
  },
  {
    category: 'Criminal Defense',
    icon: Gavel,
    color: 'amber',
    services: [
      { name: 'Criminal Defense', slug: 'criminal-defense', icon: Gavel, description: 'Felony and misdemeanor charges, trial defense' },
      { name: 'DUI / DWI', slug: 'dui-dwi', icon: AlertTriangle, description: 'Drunk driving charges, license suspension, field sobriety tests' },
      { name: 'Drug Crimes', slug: 'drug-crimes', icon: Shield, description: 'Possession, trafficking, manufacturing charges' },
      { name: 'White Collar Crime', slug: 'white-collar-crime', icon: Briefcase, description: 'Fraud, embezzlement, insider trading defense' },
      { name: 'Juvenile Law', slug: 'juvenile-law', icon: Baby, description: 'Minor offenses, juvenile court, rehabilitation programs' },
    ]
  },
  {
    category: 'Family Law',
    icon: Heart,
    color: 'pink',
    services: [
      { name: 'Family Law', slug: 'family-law', icon: Heart, description: 'Divorce, custody, support, and domestic relations' },
      { name: 'Divorce', slug: 'divorce', icon: FileText, description: 'Contested and uncontested divorce, property division' },
      { name: 'Child Custody', slug: 'child-custody', icon: Users, description: 'Custody arrangements, visitation rights, modifications' },
      { name: 'Child Support', slug: 'child-support', icon: DollarSign, description: 'Support calculations, enforcement, modification petitions' },
      { name: 'Adoption', slug: 'adoption', icon: Baby, description: 'Domestic, international, and stepparent adoption' },
      { name: 'Domestic Violence', slug: 'domestic-violence', icon: Shield, description: 'Protective orders, restraining orders, victim advocacy' },
    ]
  },
  {
    category: 'Business & Corporate',
    icon: Building,
    color: 'slate',
    services: [
      { name: 'Business Law', slug: 'business-law', icon: Building, description: 'Formation, contracts, compliance, and corporate governance' },
      { name: 'Corporate Law', slug: 'corporate-law', icon: Landmark, description: 'Mergers, acquisitions, shareholder disputes' },
      { name: 'Contracts', slug: 'contracts', icon: FileText, description: 'Drafting, review, negotiation, and breach of contract' },
      { name: 'Intellectual Property', slug: 'intellectual-property', icon: BookOpen, description: 'Patents, trademarks, copyrights, trade secrets' },
      { name: 'Employment Law', slug: 'employment-law', icon: Briefcase, description: 'Wrongful termination, discrimination, wage disputes' },
    ]
  },
  {
    category: 'Real Estate & Property',
    icon: Home,
    color: 'green',
    services: [
      { name: 'Real Estate', slug: 'real-estate', icon: Home, description: 'Transactions, closings, title disputes, zoning' },
      { name: 'Landlord-Tenant', slug: 'landlord-tenant', icon: Building, description: 'Evictions, lease disputes, security deposits' },
      { name: 'Construction Law', slug: 'construction-law', icon: HardHat, description: 'Contractor disputes, liens, building defects' },
      { name: 'Property Disputes', slug: 'property-disputes', icon: ClipboardCheck, description: 'Boundary disputes, easements, adverse possession' },
    ]
  },
  {
    category: 'Estate Planning & Probate',
    icon: FileText,
    color: 'violet',
    services: [
      { name: 'Estate Planning', slug: 'estate-planning', icon: FileText, description: 'Wills, trusts, powers of attorney, advance directives' },
      { name: 'Probate', slug: 'probate', icon: Gavel, description: 'Estate administration, will contests, asset distribution' },
      { name: 'Elder Law', slug: 'elder-law', icon: UserCheck, description: 'Medicaid planning, guardianship, nursing home issues' },
      { name: 'Trust Law', slug: 'trust-law', icon: Shield, description: 'Revocable trusts, irrevocable trusts, trust litigation' },
    ]
  },
  {
    category: 'Immigration',
    icon: Globe,
    color: 'emerald',
    services: [
      { name: 'Immigration', slug: 'immigration', icon: Globe, description: 'Visas, green cards, naturalization, work permits' },
      { name: 'Deportation Defense', slug: 'deportation-defense', icon: Shield, description: 'Removal proceedings, asylum, cancellation of removal' },
      { name: 'Asylum', slug: 'asylum', icon: Grip, description: 'Political asylum, refugee status, withholding of removal' },
    ]
  },
  {
    category: 'Financial & Tax',
    icon: Banknote,
    color: 'orange',
    services: [
      { name: 'Bankruptcy', slug: 'bankruptcy', icon: Banknote, description: 'Chapter 7, Chapter 13, debt relief, fresh start' },
      { name: 'Tax Law', slug: 'tax-law', icon: DollarSign, description: 'IRS disputes, tax planning, audits, back taxes' },
      { name: 'Debt Relief', slug: 'debt-relief', icon: Sparkles, description: 'Debt negotiation, settlement, creditor harassment' },
      { name: 'Foreclosure Defense', slug: 'foreclosure-defense', icon: Home, description: 'Loan modifications, short sales, foreclosure prevention' },
    ]
  },
  {
    category: 'Civil Rights & Government',
    icon: Landmark,
    color: 'blue',
    services: [
      { name: 'Civil Rights', slug: 'civil-rights', icon: Scale, description: 'Discrimination, police misconduct, constitutional violations' },
      { name: 'Environmental Law', slug: 'environmental-law', icon: Leaf, description: 'Regulatory compliance, toxic torts, land use' },
      { name: 'Government Law', slug: 'government-law', icon: Landmark, description: 'Administrative proceedings, government contracts, FOIA' },
    ]
  },
]

const colorClasses: Record<string, { bg: string; icon: string; hover: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', hover: 'group-hover:bg-blue-100' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', hover: 'group-hover:bg-amber-100' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', hover: 'group-hover:bg-green-100' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', hover: 'group-hover:bg-orange-100' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', hover: 'group-hover:bg-violet-100' },
  pink: { bg: 'bg-pink-50', icon: 'text-pink-600', hover: 'group-hover:bg-pink-100' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', hover: 'group-hover:bg-emerald-100' },
  slate: { bg: 'bg-slate-50', icon: 'text-slate-600', hover: 'group-hover:bg-slate-100' },
}

export default async function ServicesPage() {
  const cmsPage = await getPageContent('services', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            <CmsContent html={cmsPage.content_html} />
          </div>
        </section>
      </div>
    )
  }

  // JSON-LD structured data
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Practice Areas', url: '/services' },
  ])

  const organizationSchema = getOrganizationSchema()

  // ItemList schema: flat list of all services with their URLs
  const allServiceItems = allServices.flatMap((category) =>
    category.services.filter((s) => validServiceSlugs.has(s.slug))
  )
  const itemListSchema = getItemListSchema({
    name: 'All legal practice areas',
    description: `${allServiceItems.length} practice areas. Find verified attorneys across all 50 states.`,
    url: '/services',
    items: allServiceItems.map((s, index) => ({
      name: s.name,
      url: `/practice-areas/${s.slug}`,
      position: index + 1,
    })),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD */}
      <JsonLd data={[breadcrumbSchema, organizationSchema, itemListSchema]} />

      {/* Premium Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white/90">{staticPracticeAreas.length} practice areas</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            All{' '}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              practice
            </span>{' '}
            areas
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Find the right attorney for your legal needs.
            Verified lawyers, free consultations.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <div className="text-2xl font-bold text-white">2h</div>
                <div className="text-xs text-slate-400">Response time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb + Navigation */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={[{ label: 'Practice Areas' }]} className="mb-4" />
          <GeographicNavigation />
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {allServices.map((category) => {
            const CategoryIcon = category.icon
            const colors = colorClasses[category.color]

            return (
              <div key={category.category} className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center shadow-sm`}>
                    <CategoryIcon className={`w-7 h-7 ${colors.icon}`} />
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-gray-900 tracking-tight">
                      {category.category}
                    </h2>
                    <p className="text-sm text-gray-500">{category.services.length} services available</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {category.services.map((service) => {
                    const Icon = service.icon
                    const hasPage = validServiceSlugs.has(service.slug)

                    if (hasPage) {
                      return (
                        <Link
                          key={service.slug}
                          href={`/practice-areas/${service.slug}`}
                          className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4 ${colors.hover} transition-colors`}>
                              <Icon className={`w-6 h-6 ${colors.icon}`} />
                            </div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                              {service.description}
                            </p>
                          </div>
                          <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </Link>
                      )
                    }

                    return (
                      <div
                        key={service.slug}
                        className="relative bg-white rounded-2xl border border-gray-100 p-6 opacity-75"
                      >
                        <div className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          Coming soon
                        </div>
                        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Internal links: Popular cities */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 tracking-tight">
              <MapPin className="w-6 h-6 text-blue-600" />
              Find an attorney by city
            </h2>
            <PopularCitiesLinks showTitle={false} limit={10} />
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Free consultation in a few clicks</span>
          </div>

          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Can&apos;t find your practice area?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-xl mx-auto">
            Contact us and we&apos;ll help you find the right attorney for your legal needs.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 transition-all shadow-xl shadow-amber-500/30 hover:shadow-amber-500/40 hover:-translate-y-0.5"
          >
            Contact us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
