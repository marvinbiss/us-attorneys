import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import JsonLd from '@/components/JsonLd'
import Breadcrumb from '@/components/Breadcrumb'
import { REVALIDATE } from '@/lib/cache'
import {
  BookOpen,
  Zap,
  Droplets,
  Flame,
  Home,
  Shield,
  ArrowRight,
  Building2,
  FileCheck,
  Search,
} from 'lucide-react'

const PAGE_URL = `${SITE_URL}/regulations`

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: 'Building Codes & Regulations: Essential Standards',
  description:
    'Complete guide to building codes and regulations: electrical codes, plumbing standards, heating requirements, insulation codes, roofing specifications, and accessibility standards.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Building Codes & Regulations: Essential Standards',
    description:
      'All building codes and regulations explained clearly: electrical, plumbing, HVAC, insulation, and accessibility standards by trade.',
    url: PAGE_URL,
    type: 'website',
    siteName: SITE_NAME,
  },
}

const categories = [
  {
    title: 'Electrical',
    icon: Zap,
    color: 'bg-yellow-100 text-yellow-700',
    normes: [
      {
        name: 'NEC (National Electrical Code)',
        scope: 'Electrical installation standards',
        requirements:
          'Minimum number of outlets per room, GFCI protection required in wet areas, circuit breaker panel requirements, safety zones in bathrooms, dedicated circuits for major appliances (oven, dryer, washer).',
        link: '/guides/normes-electriques',
        linkLabel: 'Electrical Code Guide',
        service: '/practice-areas/criminal-defense',
        serviceLabel: 'Find an electrician',
      },
    ],
  },
  {
    title: 'Plumbing',
    icon: Droplets,
    color: 'bg-blue-100 text-blue-700',
    normes: [
      {
        name: 'IPC (International Plumbing Code)',
        scope: 'Plumbing systems for buildings',
        requirements:
          'Pipe diameters for supply lines, water pressure requirements (40-80 PSI), backflow prevention devices, approved materials (copper, PEX, CPVC), drain-waste-vent system specifications.',
        service: '/practice-areas/personal-injury',
        serviceLabel: 'Find a plumber',
      },
      {
        name: 'Drain-Waste-Vent Standards',
        scope: 'Wastewater and stormwater drainage',
        requirements:
          'Minimum drain pipe slopes (1/4 inch per foot), connection to municipal sewer or septic system, vent stack requirements, minimum drain pipe sizes (3-inch minimum for toilets).',
        service: '/practice-areas/personal-injury',
        serviceLabel: 'Find a plumber',
      },
    ],
  },
  {
    title: 'HVAC',
    icon: Flame,
    color: 'bg-orange-100 text-orange-700',
    normes: [
      {
        name: 'IMC (International Mechanical Code)',
        scope: 'Heating, ventilation, and air conditioning systems',
        requirements:
          'Combustion air requirements for furnaces, flue and chimney specifications, programmable thermostat requirements, annual maintenance requirements, minimum efficiency ratings by system size.',
        service: '/practice-areas/employment-law',
        serviceLabel: 'Find an HVAC contractor',
      },
      {
        name: 'Heat Pump Standards',
        scope: 'Air-source and ground-source heat pumps',
        requirements:
          'Setback distance from property lines (noise compliance), sizing per Manual J load calculation, approved refrigerants, minimum SEER/HSPF ratings, maintenance intervals for systems over 5 tons.',
        service: '/practice-areas/employment-law',
        serviceLabel: 'Find a heat pump installer',
      },
    ],
  },
  {
    title: 'Insulation & Energy',
    icon: Home,
    color: 'bg-green-100 text-green-700',
    normes: [
      {
        name: 'IECC (International Energy Conservation Code)',
        scope: 'New construction energy standards',
        requirements:
          'Climate zone-specific R-value requirements for walls, ceilings, and floors. Air sealing and testing requirements (blower door test), HVAC efficiency minimums, and lighting power density limits.',
        service: '/practice-areas/isolation',
        serviceLabel: 'Find an insulation contractor',
      },
      {
        name: 'Attic Insulation Standards',
        scope: 'Attic insulation requirements',
        requirements:
          'Minimum R-value R-38 to R-60 depending on climate zone, vapor barrier installation requirements, proper ventilation with soffit and ridge vents, clearance around electrical fixtures and recessed lighting.',
        service: '/practice-areas/isolation',
        serviceLabel: 'Find an insulation contractor',
      },
      {
        name: 'Exterior Insulation Standards',
        scope: 'Continuous exterior insulation',
        requirements:
          'Substrate preparation requirements, mechanical fastening plus adhesive attachment, minimum R-values for walls by climate zone, thermal bridging mitigation at windows and doors, weather-resistant barrier, cladding attachment over insulation.',
        service: '/practice-areas/isolation',
        serviceLabel: 'Find a siding contractor',
      },
    ],
  },
  {
    title: 'Roofing',
    icon: Building2,
    color: 'bg-slate-100 text-slate-700',
    normes: [
      {
        name: 'IRC Chapter 9 / IBC Chapter 15',
        scope: 'Roofing by material type',
        requirements:
          'Asphalt shingles: minimum slope, underlayment, and fastening requirements. Metal roofing: gauge thickness, standing seam specifications. Tile roofing: batten spacing, load calculations. All: ice and water shield in cold climates.',
        service: '/practice-areas/real-estate-law',
        serviceLabel: 'Find a roofer',
      },
      {
        name: 'Flat Roof Standards',
        scope: 'Low-slope and flat roof systems',
        requirements:
          'Membrane roofing (TPO, EPDM, or built-up), insulation requirements, vapor barrier placement, drainage specifications (minimum 1/4 inch per foot slope), and waterproofing requirements for occupied roof decks.',
        service: '/practice-areas/etancheur',
        serviceLabel: 'Find a waterproofing specialist',
      },
    ],
  },
  {
    title: 'Safety & Accessibility',
    icon: Shield,
    color: 'bg-red-100 text-red-700',
    normes: [
      {
        name: 'Seismic Codes (ASCE 7)',
        scope: 'Construction in seismic zones',
        requirements:
          'The US is divided into seismic design categories (A through F). In categories D-F, strict seismic requirements apply: reinforced foundations, continuous load paths, shear walls, hold-down connections, and limitations on cantilevered elements.',
        service: '/practice-areas/business-law',
        serviceLabel: 'Find a structural contractor',
      },
      {
        name: 'ADA Accessibility Standards',
        scope: 'Accessible design for public and residential buildings',
        requirements:
          'Minimum door widths of 32 inches clear, accessible bathroom with 60-inch turning radius, grab bars at toilets and showers, barrier-free shower entry, switch and outlet heights (15-48 inches), maximum threshold height of 1/2 inch.',
        service: '/practice-areas/renovation-interieure',
        serviceLabel: 'Find a contractor',
      },
    ],
  },
  {
    title: 'Windows & Doors',
    icon: Home,
    color: 'bg-indigo-100 text-indigo-700',
    normes: [
      {
        name: 'AAMA/WDMA/CSA 101 (NAFS)',
        scope: 'Window and door performance standards',
        requirements:
          'Shimming, leveling, and fastening requirements, air and water infiltration resistance, performance grade ratings based on design pressure, installation methods (nail-fin, block frame, or new construction).',
        service: '/practice-areas/estate-planning',
        serviceLabel: 'Find a window installer',
      },
      {
        name: 'ENERGY STAR Window Standards',
        scope: 'Energy performance classification for windows',
        requirements:
          'U-factor and SHGC (Solar Heat Gain Coefficient) requirements by climate zone. Northern zones require U-factor of 0.27 or below. Southern zones focus on low SHGC (0.25 or below) to reduce cooling loads.',
        link: '/guides/renovation-fenetres',
        linkLabel: 'Window guide',
        service: '/practice-areas/estate-planning',
        serviceLabel: 'Find a window installer',
      },
    ],
  },
]

const breadcrumbItems = [{ label: 'Building Codes' }]

export default function RegulationsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Building Codes',
        item: PAGE_URL,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-white">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-5xl px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-12 text-center md:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
            <BookOpen className="h-4 w-4" />
            Codes and regulations
          </div>
          <h1 className="mb-6 font-heading text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl lg:text-5xl">
            {'Building Codes & Regulations: Essential Standards'}
          </h1>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600 md:text-xl">
            {
              'Building codes ensure the safety, durability, and performance of construction. Find the main regulations by trade, explained in plain language.'
            }
          </p>
        </section>

        {/* Introduction */}
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
              Understanding building codes
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>{'Building codes in the United States fall into three main categories:'}</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start gap-3">
                  <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span>
                    <strong>Model Codes (ICC)</strong> — the International Building Code (IBC),
                    International Residential Code (IRC), and related codes developed by the
                    International Code Council. These are adopted and enforced at the state and
                    local level.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span>
                    <strong>Industry Standards</strong> — standards developed by organizations like
                    ASTM, ANSI, NFPA, and UL that define material properties, testing methods, and
                    installation requirements referenced by building codes.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <span>
                    <strong>Federal Regulations</strong> — legally binding requirements such as the
                    ADA (Americans with Disabilities Act), ENERGY STAR standards, and EPA lead paint
                    rules. These are mandatory, not just recommendations.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Codes by category */}
        {categories.map((cat) => {
          const CatIcon = cat.icon
          return (
            <section key={cat.title} className="mx-auto max-w-5xl px-4 py-10">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${cat.color}`}
                >
                  <CatIcon className="h-5 w-5" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-gray-900 md:text-3xl">
                  {cat.title}
                </h2>
              </div>
              <div className="space-y-4">
                {cat.normes.map((norme) => (
                  <div
                    key={norme.name}
                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-lg font-bold text-gray-900">{norme.name}</h3>
                        <p className="mb-3 text-sm font-medium text-blue-600">{norme.scope}</p>
                        <p className="mb-4 text-gray-600">{norme.requirements}</p>
                        <div className="flex flex-wrap gap-3">
                          {norme.link && (
                            <Link
                              href={norme.link}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800"
                            >
                              <BookOpen className="h-4 w-4" />
                              {norme.linkLabel}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                          <Link
                            href={norme.service}
                            className="inline-flex items-center gap-1 text-sm font-medium text-green-600 transition-colors hover:text-green-800"
                          >
                            <Search className="h-4 w-4" />
                            {norme.serviceLabel}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Related guides */}
        <section className="mx-auto max-w-5xl px-4 py-10">
          <h2 className="mb-6 font-heading text-2xl font-bold text-gray-900 md:text-3xl">
            Related guides
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/guides/normes-electriques"
              className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <h3 className="mb-1 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                {'Electrical Code Guide'}
              </h3>
              <p className="text-sm text-gray-500">
                {'Detailed guide to electrical codes with room-by-room requirements.'}
              </p>
            </Link>
            <Link
              href="/guides/certified-attorney"
              className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <h3 className="mb-1 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                {'Certified Professionals'}
              </h3>
              <p className="text-sm text-gray-500">
                {'Non-compliant work can affect warranties and liability.'}
              </p>
            </Link>
            <Link
              href="/guides/find-attorney"
              className="group rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <h3 className="mb-1 font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                {'Find an Attorney'}
              </h3>
              <p className="text-sm text-gray-500">
                {'Building codes applied to your project needs.'}
              </p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center text-white md:p-12">
            <h2 className="mb-4 font-heading text-2xl font-bold md:text-3xl">
              {'Need a professional who follows the codes?'}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
              {
                'Find qualified and certified professionals near you. They know and apply the current codes and regulations.'
              }
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/practice-areas"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-blue-700 transition-colors hover:bg-blue-50"
              >
                <Search className="h-5 w-5" />
                {'Find an attorney'}
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-400 bg-blue-500 px-8 py-3.5 font-bold text-white transition-colors hover:bg-blue-400"
              >
                <FileCheck className="h-5 w-5" />
                Request a free consultation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
