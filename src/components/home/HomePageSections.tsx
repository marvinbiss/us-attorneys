import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  Wrench, Zap, Key, Flame, PaintBucket, Hammer, HardHat, Home, TreeDeciduous, Sparkles,
  Search, ClipboardList, CheckCircle, ArrowRight, Star,
  TrendingUp,
  Database, Shield, FileCheck, Banknote, Globe, BadgeCheck
} from 'lucide-react'
import { getServiceImage, testimonialImages, beforeAfterPairs, BLUR_PLACEHOLDER } from '@/lib/data/images'
import { getAvatarColor, getInitials } from '@/lib/utils'
import { practiceAreas as allServices } from '@/lib/data/usa'

// ─── SERVICES SHOWCASE → BENTO GRID ─────────────────────────────

const services = [
  { name: 'Personal Injury', slug: 'personal-injury', icon: Wrench, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600', desc: 'Car accidents, slip & fall, medical malpractice' },
  { name: 'Criminal Defense', slug: 'criminal-defense', icon: Zap, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600', desc: 'DUI, felony, misdemeanor, white collar' },
  { name: 'Family Law', slug: 'family-law', icon: Key, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-100', text: 'text-slate-600', desc: 'Divorce, custody, child support' },
  { name: 'Immigration', slug: 'immigration', icon: Flame, color: 'from-blue-600 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600', desc: 'Visas, green cards, citizenship, deportation defense' },
  { name: 'Estate Planning', slug: 'estate-planning', icon: PaintBucket, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-100', text: 'text-slate-600', desc: 'Wills, trusts, probate, power of attorney' },
  { name: 'Real Estate', slug: 'real-estate', icon: Hammer, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600', desc: 'Closings, disputes, landlord-tenant' },
  { name: 'Business Law', slug: 'business-law', icon: Sparkles, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', text: 'text-blue-600', desc: 'Formation, contracts, compliance' },
  { name: 'Employment Law', slug: 'employment-law', icon: Home, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600', desc: 'Wrongful termination, discrimination, wage disputes' },
  { name: 'Bankruptcy', slug: 'bankruptcy', icon: HardHat, color: 'from-slate-600 to-slate-700', bg: 'bg-slate-100', text: 'text-slate-600', desc: 'Chapter 7, Chapter 13, debt relief' },
  { name: 'Tax Law', slug: 'tax-law', icon: TreeDeciduous, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600', desc: 'IRS disputes, audits, tax planning' },
  { name: 'Intellectual Property', slug: 'intellectual-property', icon: Flame, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600', desc: 'Patents, trademarks, copyrights, trade secrets' },
  { name: 'Civil Litigation', slug: 'civil-litigation', icon: Shield, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-600', desc: 'Contract disputes, class actions, appeals' },
]

export function ServicesShowcase() {
  // Bento layout: first 2 large, next 4 medium, remaining 4 in 3-col grid (last row)
  const featured = services.slice(0, 2)
  const medium = services.slice(2, 6)
  const compact = services.slice(6)

  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-5">
            <Wrench className="w-3.5 h-3.5" />
            {allServices.length} practice areas available
          </div>
          <h2 className="font-heading text-3xl md:text-[2.5rem] font-bold text-slate-900 mb-4 tracking-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-3 mb-1" />
            All practice areas
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Find the right attorney for every legal need, from urgent matters to complex litigation.
          </p>
        </div>

        {/* Bento grid */}
        <div
          className="space-y-4"
        >
          {/* Row 1: 2 featured large cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {featured.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.slug}>
                  <Link
                    href={`/practice-areas/${service.slug}`}
                    className="group relative flex items-center gap-6 p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100/80 hover:border-amber-200/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${service.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                          {service.name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{service.desc}</p>
                    </div>
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 hidden md:block">
                      <Image
                        src={getServiceImage(service.slug).src}
                        alt={getServiceImage(service.slug).alt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="96px"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                      />
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Row 2: 4 medium cards — horizontal scroll on mobile, grid on desktop */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-2 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {medium.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.slug} className="snap-start flex-shrink-0 w-[75vw] sm:w-[45vw] md:w-auto">
                  <Link
                    href={`/practice-areas/${service.slug}`}
                    className="group relative flex flex-col items-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100/80 hover:border-amber-200/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${service.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 text-center mb-1">
                      {service.name}
                    </span>
                    <span className="text-xs text-slate-400 mb-3">{service.desc}</span>
                    <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Row 3: remaining compact cards in a row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {compact.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.slug}>
                  <Link
                    href={`/practice-areas/${service.slug}`}
                    className="group flex items-center gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100/80 hover:border-amber-200/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${service.color} shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors duration-300 block">
                        {service.name}
                      </span>
                      <span className="text-xs text-slate-400">{service.desc}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-200 opacity-40 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-400 transition-all duration-300 shrink-0" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="text-center mt-12"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group transition-colors"
          >
            View all practice areas
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── HOW IT WORKS → VISUAL STEPS ────────────────────────────────

const steps = [
  {
    step: '1',
    title: 'Search',
    description: 'Enter the type of legal help you need and your location. Our engine finds available attorneys near you.',
    icon: Search,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    gradient: 'from-blue-500/20 to-blue-600/20',
  },
  {
    step: '2',
    title: 'Compare',
    description: 'View detailed profiles, credentials, and fees. Choose the attorney that matches your needs.',
    icon: ClipboardList,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    gradient: 'from-amber-500/20 to-amber-600/20',
  },
  {
    step: '3',
    title: 'Contact',
    description: 'Request a free consultation with no obligation. The attorney contacts you to provide a detailed proposal.',
    icon: CheckCircle,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    gradient: 'from-emerald-500/20 to-emerald-600/20',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium mb-5">
            <CheckCircle className="w-3.5 h-3.5" />
            Simple and fast
          </div>
          <h2 className="font-heading text-3xl md:text-[2.5rem] font-bold text-slate-900 mb-4 tracking-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-3 mb-1" />
            How does it work?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            In 3 simple steps, find the ideal attorney for your case.
          </p>
        </div>

        <div
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-[5.5rem] left-[20%] right-[20%] z-0">
            <div className="h-0.5 bg-gradient-to-r from-blue-200 via-amber-200 to-emerald-200 rounded-full" />
          </div>

          {steps.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="relative text-center"
              >
                {/* Large step number background */}
                <div className="relative z-10 mx-auto mb-8">
                  <div className="relative">
                    {/* Background number */}
                    <span className={`absolute -top-4 -left-2 font-heading text-[5rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-br ${item.gradient} select-none leading-none opacity-60`}>
                      {item.step}
                    </span>
                    {/* Icon */}
                    <div className={`relative w-20 h-20 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center shadow-lg mx-auto`}>
                      <Icon className="w-9 h-9 text-white" />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-slate-700">0{item.step}</span>
                  </div>
                </div>

                <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            )
          })}
        </div>

        <div
          className="text-center mt-14"
        >
          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
          >
            Request a Free Consultation <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── ATTORNEY CTA → PREMIUM DESIGN ──────────────────────────────

const attorneyBenefits = [
  { icon: TrendingUp, text: 'Visibility to thousands of clients' },
  { icon: Users, text: 'Receive qualified consultation requests' },
  { icon: Banknote, text: 'Free registration, no obligation' },
]

export function ArtisanCTASection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Premium dark background with radial accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0a0f1e]">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 50% 80% at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 50%, rgba(59,130,246,0.06) 0%, transparent 50%)',
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm text-amber-300 rounded-full text-sm font-medium mb-6 border border-white/10">
            <Users className="w-3.5 h-3.5" />
            Join verified attorneys on our platform
          </div>

          <h2 className="font-heading text-3xl md:text-[2.75rem] lg:text-5xl font-bold mb-5 tracking-tight leading-tight">
            Are you an attorney?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
              Get listed today
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your practice may already be in our database from official records.
            Claim your profile and receive qualified consultation requests.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            {attorneyBenefits.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-white/[0.08] backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                  <b.icon className="w-5 h-5 text-amber-300" />
                </div>
                <span className="text-sm text-slate-300 text-left">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register-attorney"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.5)] hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
            >
              Register my practice <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white font-medium px-6 py-4 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── TRUST SECTION (merged Guarantee + Why Us) ──────────────────

const trustPoints = [
  {
    icon: Database,
    title: 'Official Bar Records',
    description: 'Every attorney is sourced from official state bar records. No fake profiles, no duplicates.',
    stat: '100%',
    statLabel: 'official data',
  },
  {
    icon: Shield,
    title: 'Active Licensed Attorneys',
    description: 'Only attorneys with active bar licenses are listed. Suspended or disbarred attorneys are automatically excluded.',
    stat: '350k+',
    statLabel: 'active attorneys',
  },
  {
    icon: FileCheck,
    title: 'Free Consultations, No Obligation',
    description: 'Request as many consultations as you want. No fees, no hidden commissions. Neither for clients nor for attorneys.',
    stat: '$0',
    statLabel: 'always free',
  },
  {
    icon: Globe,
    title: 'Complete National Coverage',
    description: 'Every state is covered from coast to coast. The largest attorney database in the US across all practice areas.',
    stat: '50+',
    statLabel: 'states covered',
  },
]

export function TrustSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-5">
            <Shield className="w-3.5 h-3.5" />
            Why US Attorneys?
          </div>
          <h2 className="font-heading text-3xl md:text-[2.5rem] font-bold text-slate-900 mb-4 tracking-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-3 mb-1" />
            Data you can{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              verify
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Unlike traditional directories, our data comes directly
            from official state bar records. Transparency and reliability guaranteed.
          </p>
        </div>

        <div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {trustPoints.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="group relative bg-gradient-to-b from-slate-50/90 to-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100/80 hover:border-amber-200/50 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 ease-out"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-heading text-2xl font-extrabold text-slate-900 mb-0.5">
                  {item.stat}
                </div>
                <div className="text-xs text-blue-600 font-medium mb-3">{item.statLabel}</div>
                <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>

        {/* Source attribution */}
        <div
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-full border border-slate-100">
            <BadgeCheck className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-slate-600">
              Source: <strong className="text-slate-900">State Bar Associations</strong> — verified official records
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── TESTIMONIALS SECTION ────────────────────────────────────────

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-sm font-medium mb-5">
            <Star className="w-3.5 h-3.5" />
            Client reviews
          </div>
          <h2 className="font-heading text-3xl md:text-[2.5rem] font-bold text-slate-900 mb-4 tracking-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-3 mb-1" />
            They trust us
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Thousands of clients find the right attorney every day on US Attorneys.
          </p>
        </div>

        <div
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonialImages.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(t.name)} flex items-center justify-center shrink-0`}>
                  <span className="text-lg font-bold text-white">{getInitials(t.name)}</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.city}</div>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── BEFORE/AFTER SHOWCASE ───────────────────────────────────────

export function BeforeAfterShowcase() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Case Results
          </div>
          <h2 className="font-heading text-3xl md:text-[2.5rem] font-bold text-slate-900 mb-4 tracking-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-3 mb-1" />
            Before / After
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Discover the outcomes achieved by our verified attorneys.
          </p>
        </div>

        <div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {beforeAfterPairs.slice(0, 6).map((pair, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="grid grid-cols-2 h-48">
                <div className="relative">
                  <Image src={pair.before} alt={`Before — ${pair.alt}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} />
                  <div className="absolute top-2 left-2 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded">
                    BEFORE
                  </div>
                </div>
                <div className="relative">
                  <Image src={pair.after} alt={`After — ${pair.alt}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} />
                  <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-xs font-bold px-2 py-1 rounded">
                    AFTER
                  </div>
                </div>
              </div>
              <div className="p-4">
                <span className="text-sm font-semibold text-slate-900">{pair.category}</span>
                <span className="text-xs text-slate-500 ml-2">{pair.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
