import { Metadata } from "next"
import Link from "next/link"
import { BookOpen, Euro, HelpCircle, ArrowRight, Newspaper, Scale, Zap, FileText, ShieldCheck, Building2, Hammer, Users, ShowerHead, ChefHat, Leaf, Search, ShieldAlert, Calculator, Home, FileCheck } from "lucide-react"
import Breadcrumb from "@/components/Breadcrumb"
import JsonLd from "@/components/JsonLd"
import { getBreadcrumbSchema } from "@/lib/seo/jsonld"
import { SITE_URL } from "@/lib/seo/config"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "Practical Legal Guides | USAttorneys",
  description:
    "Comprehensive legal guides: understanding your rights, choosing an attorney, fee structures, legal procedures, and more. Reliable and up-to-date information.",
  alternates: {
    canonical: `${SITE_URL}/guides`,
  },
  openGraph: {
    title: "Practical Legal Guides",
    description:
      "Comprehensive legal guides: understanding your rights, choosing an attorney, fee structures, and legal procedures.",
    url: `${SITE_URL}/guides`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Practical Legal Guides",
    description:
      "Comprehensive legal guides: understanding your rights, choosing an attorney, fee structures, and legal procedures.",
  },
}

const guides = [
  {
    title: "MaPrimeRénov 2026: Complete Guide",
    description:
      "Everything you need to know about MaPrimeRénov in 2026: amounts, conditions, assisted and per-gesture pathways, income brackets and procedures.",
    href: "/guides/maprimerenov-2026",
    icon: Euro,
    badge: "Popular",
    badgeColor: "bg-green-100 text-green-800",
  },
  {
    title: "Energy Renovation Assistance 2026",
    description:
      "All financial assistance for your energy renovation work: MaPrimeRénov, CEE, eco-PTZ, reduced VAT and local grants.",
    href: "/guides/aides-renovation-2026",
    icon: Building2,
    badge: undefined,
    badgeColor: "",
  },
  {
    title: "RGE Certified Contractor: Verify and Find One",
    description:
      "How to verify RGE certification, why choose an RGE contractor, and where to find a certified professional near you.",
    href: "/guides/certified-attorney",
    icon: ShieldCheck,
    badge: undefined,
    badgeColor: "",
  },
  {
    title: "Building Permits 2026",
    description:
      "When a building permit is required (>20 sq m, >40 sq m in PLU zones), required documents, timelines, and special cases.",
    href: "/guides/permis-construire",
    icon: Scale,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Electrical Standards NF C 15-100",
    description:
      "Guide to NF C 15-100 standard: number of outlets per room, circuit protection, bathroom zones, and bringing up to code.",
    href: "/guides/regulations-electriques",
    icon: Zap,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Prior Declaration of Work",
    description:
      "When a prior declaration is needed, Cerfa 13703 form, one-month review period, and tacit approval.",
    href: "/guides/declaration-prealable-travaux",
    icon: FileText,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Ten-Year Warranty: Full Guide",
    description:
      "Definition, 10-year duration, covered work, exclusions, certificate verification, and claims process.",
    href: "/guides/guarantee-decennale",
    icon: ShieldCheck,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Work Quotes: How to Compare Properly",
    description:
      "Required information, how many quotes to request, how to compare, negotiate, and avoid pitfalls.",
    href: "/guides/quotes-travaux",
    icon: Hammer,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Condo Renovation: Rules and Procedures",
    description:
      "Common vs. private areas, general assembly voting, required majorities, approvals, and mandatory major work.",
    href: "/guides/travaux-copropriete",
    icon: Users,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Builder's Risk Insurance: Is It Required?",
    description:
      "Definition, legal obligation, cost (1-5% of project), how to subscribe, and consequences of not having it.",
    href: "/guides/assurance-dommage-ouvrage",
    icon: ShieldCheck,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "How to Find a Trusted Attorney in 2026",
    description:
      "Bar verification, malpractice insurance, certifications, comparing quotes, credentials, client rights, and recourse. The complete guide to avoiding bad experiences.",
    href: "/guides/find-attorney",
    icon: Search,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Legal Scams: How to Spot and Protect Yourself",
    description:
      "The 10 most common scams, warning signs, verifications, and recourse in case of fraud. Testimonials and consumer protection agencies.",
    href: "/guides/avoid-scams",
    icon: ShieldAlert,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Renovation Budget: How Much Do Your Projects Cost in 2026?",
    description:
      "Cost per sq ft by renovation type, budget by room, financial assistance, and tips for managing your budget.",
    href: "/guides/budget-renovation",
    icon: Calculator,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Bathroom Renovation: Steps, Costs, and Tips 2026",
    description:
      "Complete guide: 7 steps of a bathroom renovation, costs by item (walk-in shower, tile, plumbing), total budget, and common mistakes.",
    href: "/guides/renovation-salle-de-bain",
    icon: ShowerHead,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Kitchen Renovation: Complete Guide to Steps and Costs 2026",
    description:
      "From design to installation: steps, costs by item (cabinets, countertop, appliances), layout types, and material comparisons.",
    href: "/guides/renovation-cuisine",
    icon: ChefHat,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Energy Renovation: Complete Guide for Your Home",
    description:
      "The 4 pillars (insulation, heating, ventilation, windows), optimal work order, all 2026 grants, and return on investment.",
    href: "/guides/renovation-energetique-complete",
    icon: Leaf,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Heat Pump: Complete Guide — Prices, Grants, and Installation 2026",
    description:
      "Types (air-water, air-air, geothermal), purchase and installation costs, COP, grants, maintenance, and profitability.",
    href: "/guides/pompe-a-chaleur",
    icon: Leaf,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Thermal Insulation: Complete Guide — Prices, Materials, and Grants 2026",
    description:
      "Insulation material comparison, cost per sq ft, thermal resistance R, financial assistance, and installation techniques.",
    href: "/guides/isolation-thermique",
    icon: Leaf,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Attic Insulation: Prices, Techniques, and Grants 2026",
    description:
      "Lost and convertible attic insulation: blown-in, panels, sarking, cost per sq ft, grants, and energy savings.",
    href: "/guides/isolation-combles",
    icon: Leaf,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Home Extension: Procedures, Costs, and Tips 2026",
    description:
      "Types of extensions (lateral, raising, conservatory), permits by surface area, cost per sq ft, and materials.",
    href: "/guides/extension-maison",
    icon: Building2,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Property Diagnostics: The Complete Guide",
    description:
      "The 10 mandatory diagnostics (EPC, asbestos, lead, termites, electrical, gas), validity periods, costs, and qualified inspectors.",
    href: "/guides/diagnostics-immobiliers",
    icon: FileCheck,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Roof Renovation: Work and Costs 2026",
    description:
      "Signs of wear, types of covering (tile, slate, zinc, metal), cost per sq ft, insulation, and grants.",
    href: "/guides/renovation-toiture",
    icon: Home,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Window Replacement: Materials, Costs, and Grants 2026",
    description:
      "Materials (PVC, wood, aluminum, hybrid), glazing types, renovation vs. full replacement, costs, and financial assistance.",
    href: "/guides/renovation-fenetres",
    icon: Home,
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-800",
  },
]

const relatedPages = [
  {
    title: "Frequently Asked Questions",
    description: "Answers to the most commonly asked questions about legal services and attorneys.",
    href: "/faq",
    icon: HelpCircle,
  },
  {
    title: "Blog",
    description: "News, tips, and trends in the legal industry.",
    href: "/blog",
    icon: Newspaper,
  },
]

export default function GuidesPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumb items={[{ label: "Guides" }]} />
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-heading">
                Practical Guides
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl">
              {"Browse our comprehensive guides to help you with your legal matters: understanding your rights, choosing an attorney, fee structures, and more."}
            </p>
          </div>
        </div>

        {/* Guides list */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Our guides</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <guide.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {guide.title}
                      </h3>
                      {guide.badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${guide.badgeColor}`}>
                          {guide.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{guide.description}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                      Read the guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Related pages */}
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{"Additional resources"}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {relatedPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <page.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {page.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">{page.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
