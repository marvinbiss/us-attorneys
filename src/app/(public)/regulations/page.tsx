import type { Metadata } from "next"
import Link from "next/link"
import { SITE_URL, SITE_NAME } from "@/lib/seo/config"
import JsonLd from "@/components/JsonLd"
import Breadcrumb from "@/components/Breadcrumb"
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
} from "lucide-react"

const PAGE_URL = `${SITE_URL}/regulations`

export const revalidate = REVALIDATE.staticPages

export const metadata: Metadata = {
  title: "Building Codes & Regulations: Essential Standards",
  description:
    "Complete guide to building codes and regulations: electrical codes, plumbing standards, heating requirements, insulation codes, roofing specifications, and accessibility standards.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Building Codes & Regulations: Essential Standards",
    description:
      "All building codes and regulations explained clearly: electrical, plumbing, HVAC, insulation, and accessibility standards by trade.",
    url: PAGE_URL,
    type: "website",
    siteName: SITE_NAME,
  },
}

const categories = [
  {
    title: "Electrical",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-700",
    normes: [
      {
        name: "NEC (National Electrical Code)",
        scope: "Electrical installation standards",
        requirements:
          "Minimum number of outlets per room, GFCI protection required in wet areas, circuit breaker panel requirements, safety zones in bathrooms, dedicated circuits for major appliances (oven, dryer, washer).",
        link: "/guides/normes-electriques",
        linkLabel: "Electrical Code Guide",
        service: "/practice-areas/criminal-defense",
        serviceLabel: "Find an electrician",
      },
    ],
  },
  {
    title: "Plumbing",
    icon: Droplets,
    color: "bg-blue-100 text-blue-700",
    normes: [
      {
        name: "IPC (International Plumbing Code)",
        scope: "Plumbing systems for buildings",
        requirements:
          "Pipe diameters for supply lines, water pressure requirements (40-80 PSI), backflow prevention devices, approved materials (copper, PEX, CPVC), drain-waste-vent system specifications.",
        service: "/practice-areas/personal-injury",
        serviceLabel: "Find a plumber",
      },
      {
        name: "Drain-Waste-Vent Standards",
        scope: "Wastewater and stormwater drainage",
        requirements:
          "Minimum drain pipe slopes (1/4 inch per foot), connection to municipal sewer or septic system, vent stack requirements, minimum drain pipe sizes (3-inch minimum for toilets).",
        service: "/practice-areas/personal-injury",
        serviceLabel: "Find a plumber",
      },
    ],
  },
  {
    title: "HVAC",
    icon: Flame,
    color: "bg-orange-100 text-orange-700",
    normes: [
      {
        name: "IMC (International Mechanical Code)",
        scope: "Heating, ventilation, and air conditioning systems",
        requirements:
          "Combustion air requirements for furnaces, flue and chimney specifications, programmable thermostat requirements, annual maintenance requirements, minimum efficiency ratings by system size.",
        service: "/practice-areas/employment-law",
        serviceLabel: "Find an HVAC contractor",
      },
      {
        name: "Heat Pump Standards",
        scope: "Air-source and ground-source heat pumps",
        requirements:
          "Setback distance from property lines (noise compliance), sizing per Manual J load calculation, approved refrigerants, minimum SEER/HSPF ratings, maintenance intervals for systems over 5 tons.",
        service: "/practice-areas/employment-law",
        serviceLabel: "Find a heat pump installer",
      },
    ],
  },
  {
    title: "Insulation & Energy",
    icon: Home,
    color: "bg-green-100 text-green-700",
    normes: [
      {
        name: "IECC (International Energy Conservation Code)",
        scope: "New construction energy standards",
        requirements:
          "Climate zone-specific R-value requirements for walls, ceilings, and floors. Air sealing and testing requirements (blower door test), HVAC efficiency minimums, and lighting power density limits.",
        service: "/practice-areas/isolation",
        serviceLabel: "Find an insulation contractor",
      },
      {
        name: "Attic Insulation Standards",
        scope: "Attic insulation requirements",
        requirements:
          "Minimum R-value R-38 to R-60 depending on climate zone, vapor barrier installation requirements, proper ventilation with soffit and ridge vents, clearance around electrical fixtures and recessed lighting.",
        service: "/practice-areas/isolation",
        serviceLabel: "Find an insulation contractor",
      },
      {
        name: "Exterior Insulation Standards",
        scope: "Continuous exterior insulation",
        requirements:
          "Substrate preparation requirements, mechanical fastening plus adhesive attachment, minimum R-values for walls by climate zone, thermal bridging mitigation at windows and doors, weather-resistant barrier, cladding attachment over insulation.",
        service: "/practice-areas/isolation",
        serviceLabel: "Find a siding contractor",
      },
    ],
  },
  {
    title: "Roofing",
    icon: Building2,
    color: "bg-slate-100 text-slate-700",
    normes: [
      {
        name: "IRC Chapter 9 / IBC Chapter 15",
        scope: "Roofing by material type",
        requirements:
          "Asphalt shingles: minimum slope, underlayment, and fastening requirements. Metal roofing: gauge thickness, standing seam specifications. Tile roofing: batten spacing, load calculations. All: ice and water shield in cold climates.",
        service: "/practice-areas/real-estate-law",
        serviceLabel: "Find a roofer",
      },
      {
        name: "Flat Roof Standards",
        scope: "Low-slope and flat roof systems",
        requirements:
          "Membrane roofing (TPO, EPDM, or built-up), insulation requirements, vapor barrier placement, drainage specifications (minimum 1/4 inch per foot slope), and waterproofing requirements for occupied roof decks.",
        service: "/practice-areas/etancheur",
        serviceLabel: "Find a waterproofing specialist",
      },
    ],
  },
  {
    title: "Safety & Accessibility",
    icon: Shield,
    color: "bg-red-100 text-red-700",
    normes: [
      {
        name: "Seismic Codes (ASCE 7)",
        scope: "Construction in seismic zones",
        requirements:
          "The US is divided into seismic design categories (A through F). In categories D-F, strict seismic requirements apply: reinforced foundations, continuous load paths, shear walls, hold-down connections, and limitations on cantilevered elements.",
        service: "/practice-areas/business-law",
        serviceLabel: "Find a structural contractor",
      },
      {
        name: "ADA Accessibility Standards",
        scope: "Accessible design for public and residential buildings",
        requirements:
          "Minimum door widths of 32 inches clear, accessible bathroom with 60-inch turning radius, grab bars at toilets and showers, barrier-free shower entry, switch and outlet heights (15-48 inches), maximum threshold height of 1/2 inch.",
        service: "/practice-areas/renovation-interieure",
        serviceLabel: "Find a contractor",
      },
    ],
  },
  {
    title: "Windows & Doors",
    icon: Home,
    color: "bg-indigo-100 text-indigo-700",
    normes: [
      {
        name: "AAMA/WDMA/CSA 101 (NAFS)",
        scope: "Window and door performance standards",
        requirements:
          "Shimming, leveling, and fastening requirements, air and water infiltration resistance, performance grade ratings based on design pressure, installation methods (nail-fin, block frame, or new construction).",
        service: "/practice-areas/estate-planning",
        serviceLabel: "Find a window installer",
      },
      {
        name: "ENERGY STAR Window Standards",
        scope: "Energy performance classification for windows",
        requirements:
          "U-factor and SHGC (Solar Heat Gain Coefficient) requirements by climate zone. Northern zones require U-factor of 0.27 or below. Southern zones focus on low SHGC (0.25 or below) to reduce cooling loads.",
        link: "/guides/renovation-fenetres",
        linkLabel: "Window guide",
        service: "/practice-areas/estate-planning",
        serviceLabel: "Find a window installer",
      },
    ],
  },
]

const breadcrumbItems = [{ label: "Building Codes" }]

export default function RegulationsPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Building Codes",
        item: PAGE_URL,
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-white">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            Codes and regulations
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 font-heading leading-tight">
            {"Building Codes & Regulations: Essential Standards"}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {"Building codes ensure the safety, durability, and performance of construction. Find the main regulations by trade, explained in plain language."}
          </p>
        </section>

        {/* Introduction */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
              Understanding building codes
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                {"Building codes in the United States fall into three main categories:"}
              </p>
              <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Model Codes (ICC)</strong> — the International Building Code (IBC), International Residential Code (IRC), and related codes developed by the International Code Council. These are adopted and enforced at the state and local level.</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Industry Standards</strong> — standards developed by organizations like ASTM, ANSI, NFPA, and UL that define material properties, testing methods, and installation requirements referenced by building codes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <span><strong>Federal Regulations</strong> — legally binding requirements such as the ADA (Americans with Disabilities Act), ENERGY STAR standards, and EPA lead paint rules. These are mandatory, not just recommendations.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Codes by category */}
        {categories.map((cat) => {
          const CatIcon = cat.icon
          return (
            <section key={cat.title} className="max-w-5xl mx-auto px-4 py-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                  <CatIcon className="w-5 h-5" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading">
                  {cat.title}
                </h2>
              </div>
              <div className="space-y-4">
                {cat.normes.map((norme) => (
                  <div key={norme.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{norme.name}</h3>
                        <p className="text-sm text-blue-600 font-medium mb-3">{norme.scope}</p>
                        <p className="text-gray-600 mb-4">{norme.requirements}</p>
                        <div className="flex flex-wrap gap-3">
                          {norme.link && (
                            <Link
                              href={norme.link}
                              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <BookOpen className="w-4 h-4" />
                              {norme.linkLabel}
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          <Link
                            href={norme.service}
                            className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                          >
                            <Search className="w-4 h-4" />
                            {norme.serviceLabel}
                            <ArrowRight className="w-3 h-3" />
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
        <section className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 font-heading">
            Related guides
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/guides/normes-electriques" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Electrical Code Guide"}</h3>
              <p className="text-sm text-gray-500">{"Detailed guide to electrical codes with room-by-room requirements."}</p>
            </Link>
            <Link href="/guides/certified-attorney" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Certified Professionals"}</h3>
              <p className="text-sm text-gray-500">{"Non-compliant work can affect warranties and liability."}</p>
            </Link>
            <Link href="/guides/find-attorney" className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{"Find an Attorney"}</h3>
              <p className="text-sm text-gray-500">{"Building codes applied to your project needs."}</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {"Need a professional who follows the codes?"}
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {"Find qualified and certified professionals near you. They know and apply the current codes and regulations."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                <Search className="w-5 h-5" />
                {"Find an attorney"}
              </Link>
              <Link
                href="/quotes"
                className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-400 transition-colors border border-blue-400"
              >
                <FileCheck className="w-5 h-5" />
                Request a free consultation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
