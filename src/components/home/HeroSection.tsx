'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useMotionValue, useTransform, animate, useInView, type Variants } from 'framer-motion'
import { services, cities, states } from '@/lib/data/usa'
import { heroImage } from '@/lib/data/images'
import { HeroSearch } from '@/components/search/HeroSearch'
import { useReducedMotion } from '@/hooks/useReducedMotion'

// ── Animated counter component ────────────────────────────────────────
function AnimatedNumber({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const reducedMotion = useReducedMotion()
  const motionValue = useMotionValue(reducedMotion ? value : 0)
  const rounded = useTransform(motionValue, (v) => {
    if (v >= 1000) {
      return Math.round(v).toLocaleString('en-US')
    }
    return Math.round(v).toString()
  })

  useEffect(() => {
    if (!isInView || reducedMotion) return
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [isInView, motionValue, value, duration, reducedMotion])

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

// ── Filter chips for popular services ─────────────────────────────────
const chipServices = [
  { name: 'Personal Injury', slug: 'personal-injury' },
  { name: 'Criminal Defense', slug: 'criminal-defense' },
  { name: 'Family Law', slug: 'family-law' },
  { name: 'Immigration', slug: 'immigration' },
  { name: 'Estate Planning', slug: 'estate-planning' },
  { name: 'Real Estate', slug: 'real-estate' },
  { name: 'Business Law', slug: 'business-law' },
  { name: 'Employment Law', slug: 'employment-law' },
  { name: 'Bankruptcy', slug: 'bankruptcy' },
  { name: 'Tax Law', slug: 'tax-law' },
]

// ── Stagger animation variants ────────────────────────────────────────
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

// ── Word-by-word stagger variants for heading ─────────────────────────
const headingContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
}

const wordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

// ── Subtitle fade-in after heading completes ──────────────────────────
const subtitleVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      delay: 1.2,
    },
  },
}

// ── Heading line component with word-by-word reveal ───────────────────
function AnimatedHeadingLine({ text, className }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          className="inline-block"
          style={{ marginRight: '0.3em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

// ── Main Hero Component ───────────────────────────────────────────────
export function HeroSection({ attorneyCount = 0 }: { attorneyCount?: number }) {
  const reducedMotion = useReducedMotion()
  const noMotion = { duration: 0 }
  return (
    <>
      {/* ── HERO SECTION ────────────────────────────────────── */}
      <section
        className="relative bg-[#0a0f1e] text-white overflow-hidden"
        style={{ minHeight: '70vh' }}
      >
        {/* Background layers */}
        <div className="absolute inset-0" aria-hidden="true">
          {/* Background photo */}
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            className="object-cover opacity-20"
            priority
            fetchPriority="high"
            sizes="100vw"
            placeholder="blur"
            blurDataURL={heroImage.blurDataURL}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-[#0a0f1e]/70" />
          {/* Animated mesh gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: [
                'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%)',
                'radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%)',
                'radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
              ].join(', '),
              backgroundSize: '200% 200%, 200% 200%, 200% 200%',
              animation: 'meshGradient 20s ease-in-out infinite',
            }}
          />
          {/* Amber accent blob - animated float */}
          <div
            className="absolute top-1/3 right-1/4 w-[600px] h-[400px] opacity-[0.07]"
            style={{
              background:
                'radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'blobFloat 18s ease-in-out infinite',
            }}
          />
          {/* Blue accent blob - animated float with offset timing */}
          <div
            className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] opacity-[0.06]"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'blobFloat 22s ease-in-out infinite reverse',
            }}
          />
          {/* Center glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-[0.04]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            }}
          />
          {/* Subtle amber mesh accent */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              background:
                'radial-gradient(ellipse 40% 40% at 70% 30%, rgba(245,158,11,0.5) 0%, transparent 70%)',
              animation: 'meshGradient 25s ease-in-out infinite reverse',
              backgroundSize: '200% 200%',
            }}
          />
          {/* Grid pattern overlay - more subtle */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          {/* Bottom fade for trust bar overlap */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/[0.03] to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 md:pt-32 md:pb-28 flex flex-col items-center">
          <motion.div
            variants={reducedMotion ? undefined : containerVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="visible"
            className="text-center w-full"
          >
            {/* Animated badge */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="inline-flex items-center gap-2.5 bg-white/[0.07] backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <span className="text-sm text-white/80 font-medium">
                  {attorneyCount > 0 ? `${attorneyCount.toLocaleString('en-US')} verified attorneys nationwide` : 'Verified attorneys nationwide (official bar records)'}
                </span>
              </div>
            </motion.div>

            {/* Visual heading with word-by-word stagger — the real H1 is server-rendered in page.tsx */}
            <motion.div
              variants={reducedMotion ? undefined : headingContainerVariants}
              initial={reducedMotion ? false : "hidden"}
              animate="visible"
              aria-hidden="true"
              role="presentation"
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6"
            >
              <AnimatedHeadingLine
                text="The directory of verified"
                className="text-white block"
              />
              <AnimatedHeadingLine
                text="attorneys nationwide"
                className="text-amber-400 block"
              />
            </motion.div>

            {/* Subtitle — fades in after heading stagger completes */}
            <motion.p
              variants={reducedMotion ? undefined : subtitleVariants}
              initial={reducedMotion ? false : "hidden"}
              animate="visible"
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Find the ideal attorney near you. Compare profiles and get free consultations.
            </motion.p>

            {/* ── SEARCH FORM ─────────────────────────────────── */}
            <motion.div
              variants={itemVariants}
              className="w-full max-w-3xl mx-auto mb-8"
            >
              <HeroSearch />
            </motion.div>

            {/* ── FILTER CHIPS ────────────────────────────────── */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-2.5 mb-14"
            >
              <span className="text-sm text-white/50 mr-1">Popular:</span>
              {chipServices.map((svc) => (
                <Link
                  key={svc.slug}
                  href={`/practice-areas/${svc.slug}`}
                  className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 rounded-full px-4 py-2 text-sm transition-all duration-200"
                >
                  {svc.name}
                </Link>
              ))}
            </motion.div>

            {/* ── ANIMATED STATS ROW ──────────────────────────── */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto"
            >
              {[
                { value: attorneyCount, suffix: '', label: 'attorneys' },
                { value: cities.length, suffix: '', label: 'cities' },
                { value: states.length, suffix: '', label: 'states' },
                { value: services.length, suffix: '', label: 'practice areas' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-heading">
                    <AnimatedNumber
                      value={stat.value}
                      suffix={stat.suffix}
                      duration={2.2}
                    />
                  </div>
                  <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FLOATING TRUST BAR ──────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 -mt-12">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reducedMotion ? noMotion : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">
                  Official Bar Records
                </div>
                <div className="text-xs text-slate-500">
                  State bar verified data
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">
                  {services.length} practice areas
                </div>
                <div className="text-xs text-slate-500">
                  All legal practice areas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-end">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">
                  100% free, no obligation
                </div>
                <div className="text-xs text-slate-500">
                  Search and consultations included
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}
