import Link from 'next/link'
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Shield,
  CreditCard,
  Award,
  ArrowRight,
  Building2,
} from 'lucide-react'
import { popularServices, popularCities, popularRegions } from '@/lib/constants/navigation'
import NewsletterForm from './NewsletterForm'
import { companyIdentity } from '@/lib/config/company-identity'
import GeoFooterLinks from './seo/GeoFooterLinks'

// Navigation links
const navigationLinks = [
  { name: 'Home', href: '/' },
  { name: 'Practice Areas', href: '/practice-areas' },
  { name: 'Cities', href: '/cities' },
  { name: 'Attorney Map', href: '/attorney-map' },
  { name: 'Search', href: '/search' },
  { name: 'How It Works', href: '/how-it-works' },
]

// Tools links
const toolsLinks = [
  { name: 'Cost Estimator', href: '/tools/calculator' },
  { name: 'Attorney Finder', href: '/tools/diagnostic' },
  { name: 'Attorney Map', href: '/attorney-map' },
  { name: 'Fee Comparison', href: '/pricing' },
  { name: 'Free Consultation', href: '/quotes' },
  { name: 'Emergency Legal Help', href: '/emergency' },
  { name: 'Common Legal Issues', href: '/issues' },
  { name: 'Verify an Attorney', href: '/verify-attorney' },
  { name: 'Attorney Statistics', href: '/attorney-statistics' },
  { name: 'Attorney Widget', href: '/widget' },
]

// Information links
const informationLinks = [
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Blog', href: '/blog' },
  { name: 'Legal Guides', href: '/guides' },
  { name: 'Attorney Reviews', href: '/reviews' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Legal Notice', href: '/legal' },
  { name: 'Privacy Policy', href: '/privacy' },
]

// Legal/non-SEO pages — rel="nofollow" to preserve PageRank for money pages
const nofollowPaths = new Set([
  '/faq',
  '/terms',
  '/legal',
  '/privacy',
  '/accessibility',
  '/review-policy',
  '/mediation',
])

export default function Footer() {
  return (
    <footer className="relative bg-gray-950 text-gray-400" role="contentinfo">
      {/* Top gradient separator */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-gray-900/80 to-transparent" />

      {/* Subtle noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')] opacity-[0.03]"
        aria-hidden="true"
      />

      {/* Newsletter Section Premium */}
      <div className="relative border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-2xl bg-gradient-to-br from-clay-400 to-clay-600 p-8 shadow-2xl shadow-clay-900/30 lg:flex-row lg:p-10">
            {/* Decorative gradient orbs */}
            <div
              className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-clay-300/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-clay-200/15 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative text-center lg:text-left">
              <h3 className="mb-2 font-heading text-2xl font-bold tracking-tight text-white lg:text-3xl">
                Stay Informed
              </h3>
              <p className="text-base text-white/80">Get our latest tips and exclusive offers</p>
            </div>
            <div className="relative w-full lg:w-auto">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges Premium */}
      <div className="relative border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5">
            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors duration-300 group-hover:bg-emerald-500/15">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Bar-Verified Attorneys</p>
                <p className="mt-0.5 text-xs text-gray-500">Verified by State Bar</p>
              </div>
            </div>
            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-clay-400/10 transition-colors duration-300 group-hover:bg-clay-400/15">
                <Building2 className="h-6 w-6 text-clay-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">50 States + DC</p>
                <p className="mt-0.5 text-xs text-gray-500">Nationwide Coverage</p>
              </div>
            </div>
            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10 transition-colors duration-300 group-hover:bg-amber-500/15">
                <Award className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">100% Free</p>
                <p className="mt-0.5 text-xs text-gray-500">No Obligation</p>
              </div>
            </div>
            <div className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-clay-400/10 transition-colors duration-300 group-hover:bg-clay-400/15">
                <CreditCard className="h-6 w-6 text-clay-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Free Consultation</p>
                <p className="mt-0.5 text-xs text-gray-500">No Obligation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Internal Links Section */}
      <nav className="relative border-b border-white/[0.06]" aria-label="Popular links">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {/* Desktop: full grid visible */}
          <div className="hidden gap-8 md:grid md:grid-cols-5 lg:gap-12">
            {/* Popular Practice Areas */}
            <div>
              <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Popular Practice Areas
              </h4>
              <ul className="space-y-3 text-sm">
                {popularServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/practice-areas/${service.slug}`}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href="/practice-areas"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All Practice Areas
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Popular Cities */}
            <div>
              <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Popular Cities
              </h4>
              <ul className="space-y-3 text-sm">
                {popularCities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/cities/${city.slug}`}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                    >
                      {city.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href="/cities"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All Cities
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* By Region */}
            <div>
              <h4 className="mb-5 flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
                <Building2 className="h-3.5 w-3.5 text-gray-500" />
                By Region
              </h4>
              <ul className="space-y-3 text-sm">
                {popularRegions.map((region) => (
                  <li key={region.slug}>
                    <Link
                      href={`/regions/${region.slug}`}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href="/regions"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All Regions
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/states"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All States
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Free Tools */}
            <div>
              <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Free Tools
              </h4>
              <ul className="space-y-3 text-sm">
                {toolsLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Navigation
              </h4>
              <ul className="space-y-3 text-sm">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: collapsible accordions */}
          <div className="space-y-2 md:hidden">
            <details className="group overflow-hidden rounded-xl border border-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/[0.03]">
                Popular Practice Areas
                <ArrowRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 px-5 pb-4 text-sm">
                {popularServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/practice-areas/${service.slug}`}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:text-white"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/practice-areas"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All Practice Areas
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group overflow-hidden rounded-xl border border-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/[0.03]">
                Popular Cities
                <ArrowRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 px-5 pb-4 text-sm">
                {popularCities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/cities/${city.slug}`}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:text-white"
                    >
                      {city.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/cities"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All Cities
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group overflow-hidden rounded-xl border border-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/[0.03]">
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-gray-500" />
                  By Region
                </span>
                <ArrowRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 px-5 pb-4 text-sm">
                {popularRegions.map((region) => (
                  <li key={region.slug}>
                    <Link
                      href={`/regions/${region.slug}`}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:text-white"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/regions"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All Regions
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/states"
                    className="group flex items-center gap-1 py-1.5 text-clay-400 hover:text-clay-300"
                  >
                    All States
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group overflow-hidden rounded-xl border border-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/[0.03]">
                Free Tools
                <ArrowRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 px-5 pb-4 text-sm">
                {toolsLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>

            <details className="group overflow-hidden rounded-xl border border-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white/[0.03]">
                Navigation
                <ArrowRight className="h-4 w-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 px-5 pb-4 text-sm">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </nav>

      {/* Main Footer */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="group mb-4 inline-flex items-center gap-3">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
              >
                <defs>
                  <linearGradient
                    id="footerBg"
                    x1="0"
                    y1="0"
                    x2="48"
                    y2="48"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#E86B4B" />
                    <stop offset="1" stopColor="#C24B2A" />
                  </linearGradient>
                  <radialGradient id="footerShine" cx=".32" cy=".26" r=".65">
                    <stop stopColor="#fff" stopOpacity=".16" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#footerBg)" />
                <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#footerShine)" />
                <path
                  fillRule="evenodd"
                  fill="#fff"
                  fillOpacity="0.95"
                  d="M24 11 L38.5 24 L35 24 L35 37 L13 37 L13 24 L9.5 24Z M21 37 V29 A3 3 0 0 1 27 29 V37Z"
                />
              </svg>
              <span className="font-heading text-2xl font-extrabold tracking-tight text-white transition-colors duration-200 group-hover:text-gray-200">
                US<span className="text-clay-400">Attorneys</span>
              </span>
            </Link>
            <p className="mb-2 text-sm font-medium text-gray-500">
              The trusted platform to find your attorney
            </p>
            <p className="mb-8 text-sm leading-relaxed text-gray-400/80">
              {companyIdentity.description}
            </p>
            <div className="flex gap-2.5">
              <a
                href="https://facebook.com/usattorneys"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] transition-all duration-300 hover:scale-110 hover:border-blue-500 hover:bg-blue-600"
                aria-label="Facebook"
              >
                <Facebook className="h-[18px] w-[18px] text-gray-500 transition-colors duration-300 group-hover:text-white" />
              </a>
              <a
                href="https://twitter.com/usattorneys"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] transition-all duration-300 hover:scale-110 hover:border-sky-400 hover:bg-sky-500"
                aria-label="Twitter"
              >
                <Twitter className="h-[18px] w-[18px] text-gray-500 transition-colors duration-300 group-hover:text-white" />
              </a>
              <a
                href="https://linkedin.com/company/usattorneys"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] transition-all duration-300 hover:scale-110 hover:border-blue-600 hover:bg-blue-700"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-[18px] w-[18px] text-gray-500 transition-colors duration-300 group-hover:text-white" />
              </a>
              <a
                href="https://instagram.com/usattorneys"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] transition-all duration-300 hover:scale-110 hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500"
                aria-label="Instagram"
              >
                <Instagram className="h-[18px] w-[18px] text-gray-500 transition-colors duration-300 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Information */}
          <div>
            <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Information
            </h4>
            <ul className="space-y-3 text-sm">
              {informationLinks.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    {...(nofollowPaths.has(link.href) ? { rel: 'nofollow' } : {})}
                    className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/practice-areas"
                  className="group mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-4 py-2 text-amber-400 transition-all hover:from-amber-500/30 hover:to-amber-600/30"
                >
                  View Practice Areas
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/about"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/register-attorney"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link
                  href="/verification-process"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Verification Process
                </Link>
              </li>
              <li>
                <Link
                  href="/guarantee"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Our Guarantee
                </Link>
              </li>
              <li>
                <Link
                  href="/review-policy"
                  rel="nofollow"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Review Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/mediation"
                  rel="nofollow"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Mediation
                </Link>
              </li>
              <li>
                <Link
                  href="/press"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Press
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-5 font-heading text-xs font-semibold uppercase tracking-[0.15em] text-white">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/legal"
                  rel="nofollow"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Legal Notice
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  rel="nofollow"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  rel="nofollow"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/accessibility"
                  rel="nofollow"
                  className="inline-block py-1.5 text-gray-400 transition-all duration-200 hover:translate-x-1 hover:text-white"
                >
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact section */}
        <div className="mt-16 border-t border-white/[0.06] pt-10">
          <div className="grid gap-6 md:grid-cols-3">
            {companyIdentity.address && (
              <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.05]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-400/10 transition-colors duration-300 group-hover:bg-clay-400/15">
                  <MapPin className="h-5 w-5 text-clay-400" />
                </div>
                <div>
                  <p className="mb-0.5 text-sm font-medium text-white">Address</p>
                  <span className="text-sm text-gray-500">{companyIdentity.address}</span>
                </div>
              </div>
            )}
            {companyIdentity.phone && (
              <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.05]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-400/10 transition-colors duration-300 group-hover:bg-clay-400/15">
                  <Phone className="h-5 w-5 text-clay-400" />
                </div>
                <div>
                  <p className="mb-0.5 text-sm font-medium text-white">Phone</p>
                  <a
                    href={`tel:${companyIdentity.phone}`}
                    className="text-sm text-gray-500 transition-colors duration-200 hover:text-white"
                  >
                    {companyIdentity.phone}
                  </a>
                </div>
              </div>
            )}
            <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.05]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-400/10 transition-colors duration-300 group-hover:bg-clay-400/15">
                <Mail className="h-5 w-5 text-clay-400" />
              </div>
              <div>
                <p className="mb-0.5 text-sm font-medium text-white">Email</p>
                <a
                  href={`mailto:${companyIdentity.email}`}
                  className="text-sm text-gray-500 transition-colors duration-200 hover:text-white"
                >
                  {companyIdentity.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Geographic + Practice Area Internal Links */}
      <GeoFooterLinks />

      {/* Horizontal separator before copyright */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* Bottom Bar Premium */}
      <div className="relative bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()}{' '}
              <span className="font-medium text-gray-400">USAttorneys</span>. All rights reserved.
              <span className="hidden sm:inline">
                {' '}
                &mdash; Data updated in {new Date().getFullYear()}
              </span>
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-500">
              <Link
                href="/legal"
                rel="nofollow"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                Legal Notice
              </Link>
              <Link
                href="/privacy"
                rel="nofollow"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                rel="nofollow"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                Terms of Service
              </Link>
              <Link
                href="/accessibility"
                rel="nofollow"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                Accessibility
              </Link>
              <Link
                href="/faq"
                rel="nofollow"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                FAQ
              </Link>
              <Link
                href="/contact"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                Contact
              </Link>
              <Link
                href="/sitemap-page"
                className="py-1.5 transition-colors duration-200 hover:text-white"
              >
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
