import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  Wrench,
  Zap,
  Key,
  Flame,
  PaintBucket,
  Hammer,
  HardHat,
  Home,
  TreeDeciduous,
  Sparkles,
  Search,
  ClipboardList,
  CheckCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Database,
  Shield,
  FileCheck,
  Banknote,
  Globe,
  BadgeCheck,
} from 'lucide-react'
import {
  getServiceImage,
  testimonialImages,
  beforeAfterPairs,
  BLUR_PLACEHOLDER,
} from '@/lib/data/images'
import { getAvatarColor, getInitials } from '@/lib/utils'
import { practiceAreas as allServices } from '@/lib/data/usa'

// ─── SERVICES SHOWCASE → BENTO GRID ─────────────────────────────

const services = [
  {
    name: 'Personal Injury',
    slug: 'personal-injury',
    icon: Wrench,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    desc: 'Car accidents, slip & fall, medical malpractice',
  },
  {
    name: 'Criminal Defense',
    slug: 'criminal-defense',
    icon: Zap,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    desc: 'DUI, felony, misdemeanor, white collar',
  },
  {
    name: 'Family Law',
    slug: 'family-law',
    icon: Key,
    color: 'from-slate-500 to-slate-600',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    desc: 'Divorce, custody, child support',
  },
  {
    name: 'Immigration',
    slug: 'immigration',
    icon: Flame,
    color: 'from-blue-600 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    desc: 'Visas, green cards, citizenship, deportation defense',
  },
  {
    name: 'Estate Planning',
    slug: 'estate-planning',
    icon: PaintBucket,
    color: 'from-slate-500 to-slate-600',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    desc: 'Wills, trusts, probate, power of attorney',
  },
  {
    name: 'Real Estate',
    slug: 'real-estate',
    icon: Hammer,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    desc: 'Closings, disputes, landlord-tenant',
  },
  {
    name: 'Business Law',
    slug: 'business-law',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    desc: 'Formation, contracts, compliance',
  },
  {
    name: 'Employment Law',
    slug: 'employment-law',
    icon: Home,
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    desc: 'Wrongful termination, discrimination, wage disputes',
  },
  {
    name: 'Bankruptcy',
    slug: 'bankruptcy',
    icon: HardHat,
    color: 'from-slate-600 to-slate-700',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    desc: 'Chapter 7, Chapter 13, debt relief',
  },
  {
    name: 'Tax Law',
    slug: 'tax-law',
    icon: TreeDeciduous,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    desc: 'IRS disputes, audits, tax planning',
  },
  {
    name: 'Intellectual Property',
    slug: 'intellectual-property',
    icon: Flame,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    desc: 'Patents, trademarks, copyrights, trade secrets',
  },
  {
    name: 'Civil Litigation',
    slug: 'civil-litigation',
    icon: Shield,
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    desc: 'Contract disputes, class actions, appeals',
  },
]

export function ServicesShowcase() {
  // Bento layout: first 2 large, next 4 medium, remaining 4 in 3-col grid (last row)
  const featured = services.slice(0, 2)
  const medium = services.slice(2, 6)
  const compact = services.slice(6)

  return (
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
            <Wrench className="h-3.5 w-3.5" />
            {allServices.length} practice areas available
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.5rem]">
            <span className="mb-1 mr-3 inline-block h-2 w-2 rounded-full bg-amber-400" />
            All practice areas
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Find the right attorney for every legal need, from urgent matters to complex litigation.
          </p>
        </div>

        {/* Bento grid */}
        <div className="space-y-4">
          {/* Row 1: 2 featured large cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.slug}>
                  <Link
                    href={`/practice-areas/${service.slug}`}
                    className="group relative flex items-center gap-6 rounded-2xl border border-gray-100/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-200/50 hover:shadow-xl"
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-3 group-hover:scale-110`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-heading text-xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-blue-600">
                          {service.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-400" />
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">{service.desc}</p>
                    </div>
                    <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl md:block">
                      <Image
                        src={getServiceImage(service.slug).src}
                        alt={getServiceImage(service.slug).alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
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
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
            {medium.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.slug}
                  className="w-[75vw] flex-shrink-0 snap-start sm:w-[45vw] md:w-auto"
                >
                  <Link
                    href={`/practice-areas/${service.slug}`}
                    className="group relative flex flex-col items-center rounded-2xl border border-gray-100/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-200/50 hover:shadow-xl"
                  >
                    <div
                      className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-3 group-hover:scale-110`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="mb-1 text-center font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-600">
                      {service.name}
                    </span>
                    <span className="mb-3 text-xs text-slate-400">{service.desc}</span>
                    <ArrowRight className="h-4 w-4 text-slate-200 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-400" />
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Row 3: remaining compact cards in a row */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {compact.map((service) => {
              const Icon = service.icon
              return (
                <div key={service.slug}>
                  <Link
                    href={`/practice-areas/${service.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-100/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-200/50 hover:shadow-xl"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${service.color} shadow-md transition-all duration-300 group-hover:rotate-3 group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-600">
                        {service.name}
                      </span>
                      <span className="text-xs text-slate-400">{service.desc}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 -translate-x-2 text-slate-200 opacity-40 transition-all duration-300 group-hover:translate-x-0 group-hover:text-blue-400 group-hover:opacity-100" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/practice-areas"
            className="group inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            View all practice areas
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
    description:
      'Enter the type of legal help you need and your location. Our engine finds available attorneys near you.',
    icon: Search,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    gradient: 'from-blue-500/20 to-blue-600/20',
  },
  {
    step: '2',
    title: 'Compare',
    description:
      'View detailed profiles, credentials, and fees. Choose the attorney that matches your needs.',
    icon: ClipboardList,
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    gradient: 'from-amber-500/20 to-amber-600/20',
  },
  {
    step: '3',
    title: 'Contact',
    description:
      'Request a free consultation with no obligation. The attorney contacts you to provide a detailed proposal.',
    icon: CheckCircle,
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    gradient: 'from-emerald-500/20 to-emerald-600/20',
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" />
            Simple and fast
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.5rem]">
            <span className="mb-1 mr-3 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            How does it work?
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            In 3 simple steps, find the ideal attorney for your case.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line (desktop only) */}
          <div className="absolute left-[20%] right-[20%] top-[5.5rem] z-0 hidden md:block">
            <div className="h-0.5 rounded-full bg-gradient-to-r from-blue-200 via-amber-200 to-emerald-200" />
          </div>

          {steps.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="relative text-center">
                {/* Large step number background */}
                <div className="relative z-10 mx-auto mb-8">
                  <div className="relative">
                    {/* Background number */}
                    <span
                      className={`absolute -left-2 -top-4 bg-gradient-to-br bg-clip-text font-heading text-[5rem] font-extrabold text-transparent ${item.gradient} select-none leading-none opacity-60`}
                    >
                      {item.step}
                    </span>
                    {/* Icon */}
                    <div
                      className={`relative h-20 w-20 bg-gradient-to-br ${item.color} mx-auto flex items-center justify-center rounded-3xl shadow-lg`}
                    >
                      <Icon className="h-9 w-9 text-white" />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm">
                    <span className="text-xs font-bold text-slate-700">0{item.step}</span>
                  </div>
                </div>

                <h3 className="mb-3 font-heading text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mx-auto max-w-xs leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 hover:shadow-xl hover:shadow-amber-500/35 active:scale-[0.98]"
          >
            Request a Free Consultation <ArrowRight className="h-5 w-5" />
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
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Premium dark background with radial accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0a0f1e]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 80% at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 50%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Floating decorative elements */}
        <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="bg-blue-500/3 absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center text-white sm:px-6 lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-medium text-amber-300 backdrop-blur-sm">
            <Users className="h-3.5 w-3.5" />
            Join verified attorneys on our platform
          </div>

          <h2 className="mb-5 font-heading text-3xl font-bold leading-tight tracking-tight md:text-[2.75rem] lg:text-5xl">
            Are you an attorney?{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 bg-clip-text text-transparent">
              Get listed today
            </span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
            Your practice may already be in our database from official records. Claim your profile
            and receive qualified consultation requests.
          </p>

          <div className="mb-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
            {attorneyBenefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] backdrop-blur-sm">
                  <b.icon className="h-5 w-5 text-amber-300" />
                </div>
                <span className="text-left text-sm text-slate-300">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register-attorney"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-8 py-4 font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.5)] active:scale-[0.98]"
            >
              Register my practice <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-4 font-medium text-white/70 transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/30 hover:bg-white/5 hover:text-white active:scale-[0.98]"
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
    description:
      'Every attorney is sourced from official state bar records. No fake profiles, no duplicates.',
    stat: '100%',
    statLabel: 'official data',
  },
  {
    icon: Shield,
    title: 'Active Licensed Attorneys',
    description:
      'Only attorneys with active bar licenses are listed. Suspended or disbarred attorneys are automatically excluded.',
    stat: '350k+',
    statLabel: 'active attorneys',
  },
  {
    icon: FileCheck,
    title: 'Free Consultations, No Obligation',
    description:
      'Request as many consultations as you want. No fees, no hidden commissions. Neither for clients nor for attorneys.',
    stat: '$0',
    statLabel: 'always free',
  },
  {
    icon: Globe,
    title: 'Complete National Coverage',
    description:
      'Every state is covered from coast to coast. The largest attorney database in the US across all practice areas.',
    stat: '50+',
    statLabel: 'states covered',
  },
]

export function TrustSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
            <Shield className="h-3.5 w-3.5" />
            Why US Attorneys?
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.5rem]">
            <span className="mb-1 mr-3 inline-block h-2 w-2 rounded-full bg-blue-400" />
            Data you can{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              verify
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Unlike traditional directories, our data comes directly from official state bar records.
            Transparency and reliability guaranteed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="group relative rounded-2xl border border-gray-100/80 bg-gradient-to-b from-slate-50/90 to-white/90 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-amber-200/50 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="mb-0.5 font-heading text-2xl font-extrabold text-slate-900">
                  {item.stat}
                </div>
                <div className="mb-3 text-xs font-medium text-blue-600">{item.statLabel}</div>
                <h3 className="mb-2 font-heading text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            )
          })}
        </div>

        {/* Source attribution */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-5 py-3">
            <BadgeCheck className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-slate-600">
              Source: <strong className="text-slate-900">State Bar Associations</strong> — verified
              official records
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
    <section className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-600">
            <Star className="h-3.5 w-3.5" />
            Client reviews
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.5rem]">
            <span className="mb-1 mr-3 inline-block h-2 w-2 rounded-full bg-amber-400" />
            They trust us
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Thousands of clients find the right attorney every day on US Attorneys.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonialImages.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={`h-14 w-14 rounded-full bg-gradient-to-br ${getAvatarColor(t.name)} flex shrink-0 items-center justify-center`}
                >
                  <span className="text-lg font-bold text-white">{getInitials(t.name)}</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.city}</div>
                </div>
              </div>
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="leading-relaxed text-slate-600">{t.text}</p>
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
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
            Case Results
          </div>
          <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-slate-900 md:text-[2.5rem]">
            <span className="mb-1 mr-3 inline-block h-2 w-2 rounded-full bg-blue-400" />
            Before / After
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
            Discover the outcomes achieved by our verified attorneys.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {beforeAfterPairs.slice(0, 6).map((pair, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="grid h-48 grid-cols-2">
                <div className="relative">
                  <Image
                    src={pair.before}
                    alt={`Before — ${pair.alt}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                  <div className="absolute left-2 top-2 rounded bg-red-500/90 px-2 py-1 text-xs font-bold text-white">
                    BEFORE
                  </div>
                </div>
                <div className="relative">
                  <Image
                    src={pair.after}
                    alt={`After — ${pair.alt}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                  <div className="absolute right-2 top-2 rounded bg-emerald-500/90 px-2 py-1 text-xs font-bold text-white">
                    AFTER
                  </div>
                </div>
              </div>
              <div className="p-4">
                <span className="text-sm font-semibold text-slate-900">{pair.category}</span>
                <span className="ml-2 text-xs text-slate-500">{pair.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
