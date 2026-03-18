import Link from 'next/link'
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram, Shield, CreditCard, Award, ArrowRight, Building2 } from 'lucide-react'
import { popularServices, popularCities, popularRegions } from '@/lib/constants/navigation'
import NewsletterForm from './NewsletterForm'
import { companyIdentity } from '@/lib/config/company-identity'
import GeoFooterLinks from './seo/GeoFooterLinks'

// Navigation links
const navigationLinks = [
  { name: 'Home', href: '/' },
  { name: 'Practice Areas', href: '/services' },
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
  '/faq', '/terms', '/legal', '/privacy',
  '/accessibility', '/review-policy', '/mediation',
])

export default function Footer() {
  return (
    <footer className="relative bg-gray-950 text-gray-400" role="contentinfo">
      {/* Top gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none" />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" aria-hidden="true" />

      {/* Newsletter Section Premium */}
      <div className="relative border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8 bg-gradient-to-br from-clay-400 to-clay-600 rounded-2xl p-8 lg:p-10 overflow-hidden shadow-2xl shadow-clay-900/30">
            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-clay-300/20 rounded-full blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-clay-200/15 rounded-full blur-3xl" aria-hidden="true" />
            <div className="relative text-center lg:text-left">
              <h3 className="font-heading text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">Stay Informed</h3>
              <p className="text-white/80 text-base">Get our latest tips and exclusive offers</p>
            </div>
            <div className="relative w-full lg:w-auto">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges Premium */}
      <div className="relative border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
            <div className="group flex items-center gap-3.5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-white/[0.12] p-5 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-500/10 group-hover:bg-emerald-500/15 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Bar-Verified Attorneys</p>
                <p className="text-gray-500 text-xs mt-0.5">Verified by State Bar</p>
              </div>
            </div>
            <div className="group flex items-center gap-3.5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-white/[0.12] p-5 transition-all duration-300">
              <div className="w-12 h-12 bg-clay-400/10 group-hover:bg-clay-400/15 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                <Building2 className="w-6 h-6 text-clay-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">50 States + DC</p>
                <p className="text-gray-500 text-xs mt-0.5">Nationwide Coverage</p>
              </div>
            </div>
            <div className="group flex items-center gap-3.5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-white/[0.12] p-5 transition-all duration-300">
              <div className="w-12 h-12 bg-amber-500/10 group-hover:bg-amber-500/15 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">100% Free</p>
                <p className="text-gray-500 text-xs mt-0.5">No Obligation</p>
              </div>
            </div>
            <div className="group flex items-center gap-3.5 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/[0.06] hover:border-white/[0.12] p-5 transition-all duration-300">
              <div className="w-12 h-12 bg-clay-400/10 group-hover:bg-clay-400/15 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                <CreditCard className="w-6 h-6 text-clay-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Free Consultation</p>
                <p className="text-gray-500 text-xs mt-0.5">No Obligation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Internal Links Section */}
      <nav className="relative border-b border-white/[0.06]" aria-label="Popular links">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Desktop: full grid visible */}
          <div className="hidden md:grid md:grid-cols-5 gap-8 lg:gap-12">
            {/* Popular Practice Areas */}
            <div>
              <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Popular Practice Areas</h4>
              <ul className="space-y-3 text-sm">
                {popularServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/practice-areas/${service.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/services" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All Practice Areas
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Popular Cities */}
            <div>
              <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Popular Cities</h4>
              <ul className="space-y-3 text-sm">
                {popularCities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/cities/${city.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5"
                    >
                      {city.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/cities" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All Cities
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* By Region */}
            <div>
              <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                By Region
              </h4>
              <ul className="space-y-3 text-sm">
                {popularRegions.map((region) => (
                  <li key={region.slug}>
                    <Link
                      href={`/regions/${region.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/regions" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All Regions
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
                <li>
                  <Link href="/states" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All States
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Free Tools */}
            <div>
              <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Free Tools</h4>
              <ul className="space-y-3 text-sm">
                {toolsLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Navigation</h4>
              <ul className="space-y-3 text-sm">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: collapsible accordions */}
          <div className="md:hidden space-y-2">
            <details className="group border border-white/[0.06] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                Popular Practice Areas
                <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 text-sm px-5 pb-4">
                {popularServices.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={`/practice-areas/${service.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 inline-block py-1.5"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link href="/services" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All Practice Areas
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group border border-white/[0.06] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                Popular Cities
                <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 text-sm px-5 pb-4">
                {popularCities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/cities/${city.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 inline-block py-1.5"
                    >
                      {city.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link href="/cities" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All Cities
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group border border-white/[0.06] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-gray-500" />
                  By Region
                </span>
                <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 text-sm px-5 pb-4">
                {popularRegions.map((region) => (
                  <li key={region.slug}>
                    <Link
                      href={`/regions/${region.slug}`}
                      className="text-gray-400 hover:text-white transition-all duration-200 inline-block py-1.5"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link href="/regions" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All Regions
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
                <li>
                  <Link href="/states" className="text-clay-400 hover:text-clay-300 flex items-center gap-1 group py-1.5">
                    All States
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group border border-white/[0.06] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                Free Tools
                <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 text-sm px-5 pb-4">
                {toolsLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-200 inline-block py-1.5"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>

            <details className="group border border-white/[0.06] rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-white font-heading font-semibold text-xs uppercase tracking-[0.15em] hover:bg-white/[0.03] transition-colors">
                Navigation
                <ArrowRight className="w-4 h-4 text-gray-500 transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <ul className="space-y-1 text-sm px-5 pb-4">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-all duration-200 inline-block py-1.5"
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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
              >
                <defs>
                  <linearGradient id="footerBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
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
                <path fillRule="evenodd" fill="#fff" fillOpacity="0.95" d="M24 11 L38.5 24 L35 24 L35 37 L13 37 L13 24 L9.5 24Z M21 37 V29 A3 3 0 0 1 27 29 V37Z" />
              </svg>
              <span className="text-2xl font-heading font-extrabold tracking-tight text-white group-hover:text-gray-200 transition-colors duration-200">
                US<span className="text-clay-400">Attorneys</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 mb-2 font-medium">The trusted platform to find your attorney</p>
            <p className="text-sm leading-relaxed mb-8 text-gray-400/80">
              {companyIdentity.description}
            </p>
            <div className="flex gap-2.5">
              <a href="https://facebook.com/usattorneys" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center hover:bg-blue-600 hover:scale-110 border border-white/[0.06] hover:border-blue-500 transition-all duration-300 group" aria-label="Facebook">
                <Facebook className="w-[18px] h-[18px] text-gray-500 group-hover:text-white transition-colors duration-300" />
              </a>
              <a href="https://twitter.com/usattorneys" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center hover:bg-sky-500 hover:scale-110 border border-white/[0.06] hover:border-sky-400 transition-all duration-300 group" aria-label="Twitter">
                <Twitter className="w-[18px] h-[18px] text-gray-500 group-hover:text-white transition-colors duration-300" />
              </a>
              <a href="https://linkedin.com/company/usattorneys" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 border border-white/[0.06] hover:border-blue-600 transition-all duration-300 group" aria-label="LinkedIn">
                <Linkedin className="w-[18px] h-[18px] text-gray-500 group-hover:text-white transition-colors duration-300" />
              </a>
              <a href="https://instagram.com/usattorneys" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:scale-110 border border-white/[0.06] hover:border-purple-400 transition-all duration-300 group" aria-label="Instagram">
                <Instagram className="w-[18px] h-[18px] text-gray-500 group-hover:text-white transition-colors duration-300" />
              </a>
            </div>
          </div>

          {/* Information */}
          <div>
            <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Information</h4>
            <ul className="space-y-3 text-sm">
              {informationLinks.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} {...(nofollowPaths.has(link.href) ? { rel: 'nofollow' } : {})} className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 rounded-lg hover:from-amber-500/30 hover:to-amber-600/30 transition-all mt-2 group">
                  View Practice Areas
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/register-attorney" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link href="/verification-process" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Verification Process
                </Link>
              </li>
              <li>
                <Link href="/guarantee" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Our Guarantee
                </Link>
              </li>
              <li>
                <Link href="/review-policy" rel="nofollow" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Review Policy
                </Link>
              </li>
              <li>
                <Link href="/mediation" rel="nofollow" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Mediation
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Press
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-heading font-semibold mb-5 text-xs uppercase tracking-[0.15em]">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/legal" rel="nofollow" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Legal Notice
                </Link>
              </li>
              <li>
                <Link href="/terms" rel="nofollow" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" rel="nofollow" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/accessibility" rel="nofollow" className="text-gray-400 hover:text-white transition-all duration-200 hover:translate-x-1 inline-block py-1.5">
                  Accessibility
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact section */}
        <div className="mt-16 pt-10 border-t border-white/[0.06]">
          <div className="grid md:grid-cols-3 gap-6">
            {companyIdentity.address && (
              <div className="group flex items-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                <div className="w-12 h-12 bg-clay-400/10 group-hover:bg-clay-400/15 rounded-xl flex items-center justify-center transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-clay-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-0.5">Address</p>
                  <span className="text-sm text-gray-500">{companyIdentity.address}</span>
                </div>
              </div>
            )}
            {companyIdentity.phone && (
              <div className="group flex items-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                <div className="w-12 h-12 bg-clay-400/10 group-hover:bg-clay-400/15 rounded-xl flex items-center justify-center transition-colors duration-300">
                  <Phone className="w-5 h-5 text-clay-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-0.5">Phone</p>
                  <a href={`tel:${companyIdentity.phone}`} className="text-sm text-gray-500 hover:text-white transition-colors duration-200">{companyIdentity.phone}</a>
                </div>
              </div>
            )}
            <div className="group flex items-center gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
              <div className="w-12 h-12 bg-clay-400/10 group-hover:bg-clay-400/15 rounded-xl flex items-center justify-center transition-colors duration-300">
                <Mail className="w-5 h-5 text-clay-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm mb-0.5">Email</p>
                <a href={`mailto:${companyIdentity.email}`} className="text-sm text-gray-500 hover:text-white transition-colors duration-200">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* Bottom Bar Premium */}
      <div className="relative bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} <span className="text-gray-400 font-medium">USAttorneys</span>. All rights reserved.
              <span className="hidden sm:inline"> &mdash; Data updated in {new Date().getFullYear()}</span>
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-500">
              <Link href="/legal" rel="nofollow" className="hover:text-white transition-colors duration-200 py-1.5">
                Legal Notice
              </Link>
              <Link href="/privacy" rel="nofollow" className="hover:text-white transition-colors duration-200 py-1.5">
                Privacy Policy
              </Link>
              <Link href="/terms" rel="nofollow" className="hover:text-white transition-colors duration-200 py-1.5">
                Terms of Service
              </Link>
              <Link href="/accessibility" rel="nofollow" className="hover:text-white transition-colors duration-200 py-1.5">
                Accessibility
              </Link>
              <Link href="/faq" rel="nofollow" className="hover:text-white transition-colors duration-200 py-1.5">
                FAQ
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors duration-200 py-1.5">
                Contact
              </Link>
              <Link href="/sitemap-page" className="hover:text-white transition-colors duration-200 py-1.5">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
