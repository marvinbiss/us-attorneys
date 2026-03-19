import Link from 'next/link'
import Image from 'next/image'
import {
  Scale,
  Gavel,
  Heart,
  Globe,
  FileText,
  Home,
  Building,
  Briefcase,
  ShieldCheck,
  Star,
  MapPin,
  Shield,
  Clock,
} from 'lucide-react'
import { ClayHeroSearch } from './ClayHeroSearch'
import { ClayReviewsCarousel } from './ClayReviewsCarousel'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import {
  formatAttorneyCount,
  type SiteStats,
  type HomepageProvider,
  type HomepageReview,
} from '@/lib/data/stats'
import { faqCategories } from '@/lib/data/faq-data'
import { BLUR_PLACEHOLDER } from '@/lib/data/images'
import { cities, practiceAreas } from '@/lib/data/usa'

interface Props {
  stats: SiteStats
  specialtyCounts: Record<string, number>
  topProviders: HomepageProvider[]
  recentReviews: HomepageReview[]
}

const SERVICE_ITEMS = [
  { Icon: Scale, name: 'Personal Injury', slug: 'personal-injury' },
  { Icon: Gavel, name: 'Criminal Defense', slug: 'criminal-defense' },
  { Icon: Heart, name: 'Family Law', slug: 'family-law' },
  { Icon: Globe, name: 'Immigration', slug: 'immigration' },
  { Icon: FileText, name: 'Estate Planning', slug: 'estate-planning' },
  { Icon: Home, name: 'Real Estate', slug: 'real-estate' },
  { Icon: Building, name: 'Business Law', slug: 'business-law' },
  { Icon: Briefcase, name: 'Employment Law', slug: 'employment-law' },
]

// Featured attorneys (manual selection — verified profiles)
const FEATURED_ATTORNEYS = [
  {
    name: 'Smith & Associates',
    specialty: 'Personal Injury',
    address_city: 'New York',
    address_zip: '10001',
    rating_average: 4.6,
    review_count: 34,
    is_verified: true,
    slug: 'personal-injury',
    stable_id: 'smith-associates-new-york',
    profileCity: 'new-york',
  },
  {
    name: 'Davis Law Group',
    specialty: 'Criminal Defense',
    address_city: 'Los Angeles',
    address_zip: '90001',
    rating_average: 4.9,
    review_count: 9,
    is_verified: true,
    slug: 'criminal-defense',
    stable_id: 'davis-law-group-los-angeles',
    profileCity: 'los-angeles',
  },
  {
    name: 'Martinez Family Law',
    specialty: 'Family Law',
    address_city: 'Chicago',
    address_zip: '60601',
    rating_average: 4.7,
    review_count: 95,
    is_verified: true,
    slug: 'family-law',
    stable_id: 'martinez-family-law-chicago',
    profileCity: 'chicago',
  },
]

/** Formats a name: "SMITH JOHN" → "Smith John" */
function formatName(raw: string): string {
  // If all uppercase, convert to Title Case
  if (raw === raw.toUpperCase()) {
    return (
      raw
        .toLowerCase()
        .replace(/(?:^|\s|['-])\S/g, (c) => c.toUpperCase())
        // Truncate firm names in parentheses
        .replace(/\s*\(.*$/, '')
    )
  }
  return raw.replace(/\s*\(.*$/, '')
}

const FALLBACK_REVIEWS = [
  {
    client_name: 'Sarah Johnson',
    rating: 5,
    comment:
      'Found an amazing attorney for my personal injury case through US Attorneys. Quick response, professional service, and a great outcome. Literally saved me.',
    created_at: '',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face&q=80',
  },
  {
    client_name: 'Michael Chen',
    rating: 4,
    comment:
      'Needed a family law attorney for a complex custody case. The attorney I found here was thorough, on time, and within budget. Highly recommend.',
    created_at: '',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face&q=80',
  },
  {
    client_name: 'Emily Rodriguez',
    rating: 5,
    comment:
      'Finally a serious platform! Attorneys are truly verified, not fake profiles. Found my real estate attorney in 5 minutes, consultation done 3 days later.',
    created_at: '',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face&q=80',
  },
]

// Unique background images per position (never 2 identical side by side)
const CARD_BG_IMAGES = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&h=250&fit=crop&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=250&fit=crop&q=80',
]

// Avatars for reviews (fallback when no photo in DB)
const REVIEW_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face&q=80',
]

const HERO_BLUR =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsICw4QDQoNDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAFAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EAB4QAAEEAgMBAAAAAAAAAAAAAAIAAQMEBREGEiEx/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAeEQABBAEFAAAAAAAAAAAAAAABAAIDBAUREiExQf/aAAwDAQACEQMRAD8AoW+W5S/yW7PQumBOhO4iID9AA/sRFVhyGRleTIhbxs00f//Z'

function renderStars(rating: number) {
  return [1, 2, 3, 4, 5].map((i) => (
    <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-stone-300'}>
      ★
    </span>
  ))
}

// ── FAQ Section ──────────────────────────────────────────────────
const FAQ_CATEGORIES = ['General', 'Consultation Request']

function ClayFAQSection() {
  const faqs = faqCategories
    .filter((c) => FAQ_CATEGORIES.includes(c.name))
    .flatMap((c) => c.questions)

  return (
    <div className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
      <div className="mb-1 text-center">
        <div className="inline-block text-xs font-bold uppercase tracking-[.12em] text-clay-400">
          Frequently Asked Questions
        </div>
      </div>
      <h2
        className="mb-12 text-center font-black leading-tight tracking-[-0.04em] text-stone-900"
        style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)' }}
      >
        Everything you need to know.
      </h2>
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-2xl border border-stone-200/60 bg-[#FFFCF8] transition-shadow duration-300 hover:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-left text-base font-bold text-stone-900 [&::-webkit-details-marker]:hidden">
              <span>{faq.q}</span>
              <svg
                className="ml-4 h-5 w-5 shrink-0 text-clay-400 transition-transform duration-300 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="faq-answer px-6 pb-5 text-sm leading-relaxed text-stone-600">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────
export function ClayHomePage({ stats, specialtyCounts, topProviders, recentReviews }: Props) {
  const { attorneyCount, reviewCount, avgRating, deptCount } = stats
  const countStr = attorneyCount > 0 ? `${formatAttorneyCount(attorneyCount)}+` : '—'
  const reviewStr = reviewCount > 0 ? `${formatAttorneyCount(reviewCount)}` : '—'
  const ratingStr = avgRating > 0 ? avgRating.toFixed(1) : '—'

  // Use real top providers from DB when available, fall back to curated list
  const attorneys =
    topProviders.length >= 3
      ? topProviders.slice(0, 3).map((p) => ({
          ...p,
          profileCity: (p.address_city ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
        }))
      : FEATURED_ATTORNEYS
  const bigReviews = recentReviews.length >= 3 ? recentReviews.slice(0, 3) : FALLBACK_REVIEWS
  const carouselReviews = recentReviews.length >= 6 ? recentReviews.slice(3) : undefined

  return (
    <>
      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          minHeight: 'calc(100svh - 64px)',
          maxHeight: '900px',
          background: 'linear-gradient(160deg,#1a0f06 0%,#2d1a0e 40%,#0a0503 100%)',
        }}
      >
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&h=900&fit=crop&q=80"
            alt="Attorney at work"
            fill
            priority
            fetchPriority="high"
            placeholder="blur"
            blurDataURL={HERO_BLUR}
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom,rgba(10,8,5,.85) 0%,rgba(10,8,5,.5) 100%)',
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-4 pt-16 text-center md:px-10 md:pb-0 md:pt-0">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.06em] md:mb-7 md:px-4 md:py-2 md:text-xs"
            style={{
              background: 'rgba(232,107,75,.15)',
              border: '1px solid rgba(232,107,75,.35)',
              color: '#FFB49A',
            }}
          >
            <span className="hidden h-1.5 w-1.5 animate-pulse rounded-full bg-clay-400 sm:inline-block" />
            {countStr} verified attorneys · Official Bar Records
          </div>

          <h1
            className="mb-2 font-black leading-[1.05] tracking-[-0.05em] text-white sm:leading-[.92] md:mb-6"
            style={{ fontSize: 'clamp(2.2rem,5vw,4.5rem)' }}
          >
            Find the <em className="not-italic text-clay-400">perfect attorney.</em>
          </h1>

          <p className="mx-auto mb-3 max-w-xl text-sm leading-[1.5] text-white/75 md:mb-10 md:text-base md:leading-[1.75]">
            Verified, insured, and recommended professionals. Free consultations within 24h
            nationwide.
          </p>

          <div className="mx-auto mb-3 max-w-2xl md:mb-6">
            <ClayHeroSearch
              cities={cities.map((c) => ({
                slug: c.slug,
                name: c.name,
                stateCode: c.stateCode,
                population: c.population,
                zipCode: c.zipCode,
              }))}
              services={practiceAreas.map((s) => ({ slug: s.slug, name: s.name }))}
            />
          </div>

          {/* Quick filter chips — functional links */}
          <div className="mb-3 flex flex-wrap justify-center gap-1.5 md:mb-10 md:gap-2">
            {SERVICE_ITEMS.map(({ Icon: ChipIcon, name, slug }) => (
              <Link
                key={slug}
                href={`/practice-areas/${slug}`}
                aria-label={`Search attorneys for ${name}`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/75 transition-all duration-200 hover:text-white md:gap-1.5 md:px-3 md:py-1.5 md:text-xs"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  border: '1px solid rgba(255,255,255,.12)',
                }}
              >
                <ChipIcon className="h-3 w-3 text-clay-400" />
                {name}
              </Link>
            ))}
          </div>

          {/* Trust pills — compact on mobile, full on desktop */}
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2.5">
            {[
              { Icon: ShieldCheck, text: 'Bar verified' },
              { Icon: Star, text: `${ratingStr}/5 · ${reviewStr} reviews` },
              { Icon: Clock, text: 'Consultation in 24h' },
            ].map(({ Icon: PillIcon, text }) => (
              <div
                key={text}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white/75 md:gap-1.5 md:px-3.5 md:py-1.5 md:text-xs"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,.12)',
                }}
              >
                <PillIcon className="h-3 w-3 text-clay-400" /> {text}
              </div>
            ))}
          </div>

          {/* Social proof — hidden on mobile, shown on desktop */}
          <div className="mt-8 hidden items-center justify-center gap-4 md:flex">
            <div className="flex">
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=168&h=168&fit=crop&crop=face&q=80',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=168&h=168&fit=crop&crop=face&q=80',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=168&h=168&fit=crop&crop=face&q=80',
              ].map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt="Photo of a satisfied client"
                  width={56}
                  height={56}
                  sizes="56px"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="-mr-3 h-14 w-14 rounded-full border-2 border-white/20 object-cover"
                />
              ))}
            </div>
            <p className="text-base font-medium text-white/70">
              <strong className="text-white/85">Hundreds of clients</strong> find their attorney
              every week
            </p>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BANNER ──────────────────────────────── */}
      <div className="bg-[#FFFCF8] py-5" style={{ borderBottom: '1px solid rgba(0,0,0,.06)' }}>
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-700">
                <strong className="text-emerald-700">{countStr}</strong> verified attorneys
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                <strong className="text-blue-700">{deptCount}</strong> states covered
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">
                <strong className="text-amber-600">100%</strong> free, no obligation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRUST BAR ──────────────────────────────────────────── */}
      <ScrollReveal>
        <div className="bg-white" style={{ borderBottom: '1px solid rgba(0,0,0,.06)' }}>
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-around gap-6 px-6 py-16 md:px-10">
            {[
              { Icon: ShieldCheck, label: 'Bar verified', sub: 'Every attorney vetted' },
              {
                Icon: Star,
                label: `${ratingStr}/5 average`,
                sub: `${reviewStr}+ verified reviews`,
              },
              { Icon: Clock, label: 'Consultation in 24h', sub: 'Free, no obligation' },
              { Icon: Shield, label: 'Official data', sub: 'State bar records' },
              { Icon: MapPin, label: `${deptCount} states`, sub: 'Nationwide coverage' },
            ].map(({ Icon: TrustIcon, label, sub }, i, arr) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                  style={{ background: '#FDF1EC' }}
                >
                  <TrustIcon className="h-5 w-5 text-clay-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-900">{label}</div>
                  <div className="mt-0.5 text-xs text-stone-400">{sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className="ml-6 hidden h-9 w-px xl:block"
                    style={{ background: 'rgba(0,0,0,.07)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ─── SERVICES GRID (8 services, real counts) ─────────── */}
      <ScrollReveal as="section">
        <div className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
          <div className="mb-2.5 text-xs font-bold uppercase tracking-[.12em] text-clay-400">
            What we offer
          </div>
          <div className="mb-9 flex items-end justify-between">
            <h2
              className="font-black leading-tight tracking-[-0.04em] text-stone-900"
              style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)' }}
            >
              All practice areas
            </h2>
            <Link
              href="/practice-areas"
              className="text-sm font-bold text-clay-400 transition-colors hover:text-clay-600"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SERVICE_ITEMS.map(({ Icon: SvcIcon, name, slug }, i) => (
              <ScrollReveal key={slug} delay={i * 0.08}>
                <Link
                  href={`/practice-areas/${slug}`}
                  className="group block rounded-2xl border-[1.5px] border-transparent bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-clay-400"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}
                >
                  <SvcIcon className="mx-auto mb-3 h-8 w-8 text-clay-400" />
                  <div className="mb-1 text-sm font-extrabold text-stone-900">{name}</div>
                  <div className="text-xs text-stone-400">
                    {specialtyCounts[slug] > 0
                      ? `${formatAttorneyCount(specialtyCounts[slug])} attorneys`
                      : 'Attorneys available'}
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* ─── ATTORNEY CARDS (real data or fallback) ──────────── */}
      <ScrollReveal as="section">
        <div style={{ background: '#EDE8E1' }}>
          <div className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <div className="mb-2.5 text-xs font-bold uppercase tracking-[.12em] text-clay-400">
                  Near you
                </div>
                <h2
                  className="font-black leading-tight tracking-[-0.04em] text-stone-900"
                  style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)' }}
                >
                  Top-rated attorneys.
                </h2>
              </div>
              <Link
                href="/practice-areas"
                className="text-sm font-bold text-clay-400 transition-colors hover:text-clay-600"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {attorneys.map((a, i) => {
                const rating = a.rating_average ?? 0
                const ratingDisplay = rating.toFixed(1)
                const profileHref = a.stable_id
                  ? `/practice-areas/${a.slug}/${a.profileCity}/${a.stable_id}`
                  : `/practice-areas/${a.slug}`
                const bgImage = CARD_BG_IMAGES[i % CARD_BG_IMAGES.length]

                return (
                  <ScrollReveal key={a.name} delay={i * 0.1}>
                    <div
                      className="overflow-hidden rounded-3xl transition-all duration-[350ms]"
                      style={{ background: '#FFFCF8', boxShadow: '0 3px 16px rgba(0,0,0,.06)' }}
                    >
                      <div
                        className="relative overflow-hidden"
                        style={{
                          height: '200px',
                          background: 'linear-gradient(160deg,#3D2414 0%,#5C3820 100%)',
                        }}
                      >
                        <Image
                          src={bgImage}
                          alt=""
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          placeholder="blur"
                          blurDataURL={BLUR_PLACEHOLDER}
                          className="object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(0,0,0,.55))',
                          }}
                        />
                        <div
                          className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-green-700"
                          style={{ backdropFilter: 'blur(8px)' }}
                        >
                          {a.is_verified ? '✓ Bar Verified' : '✓ Listed Attorney'}
                        </div>
                      </div>
                      <div className="px-5 pb-5 pt-4">
                        <div className="mb-0.5 line-clamp-1 text-base font-black text-stone-900">
                          {formatName(a.name)}
                        </div>
                        <div className="mb-2.5 line-clamp-1 text-sm text-stone-400">
                          {typeof a.specialty === 'object' && a.specialty
                            ? (a.specialty as { name: string }).name
                            : a.specialty}
                          {a.address_city ? ` · ${a.address_city}` : ''}
                          {a.address_zip ? ` (${a.address_zip})` : ''}
                        </div>
                        <div className="mb-3 flex items-center gap-1.5">
                          <span className="text-sm">{renderStars(rating)}</span>
                          <span className="text-sm font-bold text-stone-900">{ratingDisplay}</span>
                          <span className="text-xs text-stone-400">
                            ({a.review_count ?? 0} reviews)
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <Link
                            href={profileHref}
                            className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-clay-400"
                          >
                            View profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── PROCESS ──────────────────────────────────────────── */}
      <ScrollReveal as="section">
        <div style={{ background: '#EDE8E1' }}>
          <div className="mx-auto max-w-[1320px] px-6 py-24 md:px-10">
            <div className="mb-1 text-center">
              <div className="inline-block text-xs font-bold uppercase tracking-[.12em] text-clay-400">
                How it works
              </div>
            </div>
            <h2
              className="mb-12 text-center font-black leading-tight tracking-[-0.04em] text-stone-900"
              style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)' }}
            >
              Simple, fast, reliable.
            </h2>
            <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className="absolute top-[25px] hidden h-0.5 opacity-30 lg:block"
                style={{
                  left: '12.5%',
                  right: '12.5%',
                  background:
                    'repeating-linear-gradient(90deg,#E86B4B 0,#E86B4B 8px,transparent 8px,transparent 18px)',
                }}
              />
              {[
                {
                  n: '1',
                  title: 'Describe your case',
                  desc: 'Type, location, urgency — 2 minutes to describe your legal needs.',
                },
                {
                  n: '2',
                  title: 'Get free consultations',
                  desc: 'Up to 3 verified attorneys contact you within 24h. Free, no obligation.',
                },
                {
                  n: '3',
                  title: 'Choose freely',
                  desc: 'Compare profiles, reviews, and fees. Pick the attorney that fits your needs.',
                },
                {
                  n: '4',
                  title: 'Get results',
                  desc: 'Work with bar-verified professionals. Official state bar records checked.',
                },
              ].map((step, i) => (
                <ScrollReveal key={step.n} delay={i * 0.1}>
                  <div className="relative z-10 text-center">
                    <div
                      className="mx-auto mb-4 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-lg font-black text-clay-400"
                      style={{
                        border: '2px solid rgba(232,107,75,.2)',
                        boxShadow: '0 4px 14px rgba(0,0,0,.07)',
                      }}
                    >
                      {step.n}
                    </div>
                    <div className="mb-2 text-base font-extrabold text-stone-900">{step.title}</div>
                    <p className="text-sm leading-[1.65] text-stone-500">{step.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <ScrollReveal as="section">
        <div style={{ background: '#EDE8E1' }}>
          <ClayFAQSection />
        </div>
      </ScrollReveal>

      {/* ─── REVIEWS ──────────────────────────────────────────── */}
      <ScrollReveal as="section">
        <div className="py-24" style={{ background: '#1C1917' }}>
          <div className="mx-auto mb-12 flex max-w-[1320px] flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-end md:px-10">
            <h2
              className="font-black leading-tight tracking-[-0.04em] text-white"
              style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)' }}
            >
              They <span className="text-clay-400">trust us.</span>
            </h2>
            <div className="text-right">
              <div className="text-[2.4rem] font-black text-clay-400">★★★★★</div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,.60)' }}>
                {ratingStr}/5 · {reviewStr} verified reviews
              </div>
            </div>
          </div>

          <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 px-6 pb-12 md:grid-cols-3 md:px-10">
            {bigReviews.map((rv, i) => {
              const avatar =
                'avatar' in rv && rv.avatar
                  ? (rv.avatar as string)
                  : REVIEW_AVATARS[i % REVIEW_AVATARS.length]
              return (
                <ScrollReveal key={rv.client_name || i} delay={i * 0.1}>
                  <div
                    className="rounded-2xl p-7 transition-all duration-300"
                    style={{
                      background: 'rgba(255,255,255,.05)',
                      border: '1px solid rgba(255,255,255,.08)',
                    }}
                  >
                    <div className="mb-4 text-[48px] font-black leading-none text-clay-400 opacity-60">
                      &ldquo;
                    </div>
                    <p
                      className="mb-5 text-base italic leading-[1.75]"
                      style={{ color: 'rgba(255,255,255,.85)' }}
                    >
                      {rv.comment}
                    </p>
                    <div className="flex items-center gap-2.5">
                      <Image
                        src={avatar}
                        alt={rv.client_name || 'Verified client'}
                        width={40}
                        height={40}
                        sizes="40px"
                        placeholder="blur"
                        blurDataURL={BLUR_PLACEHOLDER}
                        className="rounded-full object-cover"
                        style={{ border: '2px solid rgba(255,255,255,.1)' }}
                      />
                      <div>
                        <div className="text-sm font-bold text-white">
                          {rv.client_name || 'Verified client'}
                        </div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,.60)' }}>
                          Verified client
                        </div>
                      </div>
                      <div className="ml-auto text-xs">{renderStars(rv.rating)}</div>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>

          <div className="mt-2 overflow-hidden px-10">
            <ClayReviewsCarousel reviews={carouselReviews} />
          </div>
        </div>
      </ScrollReveal>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <ScrollReveal as="section">
        <div className="relative flex items-center overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&h=500&fit=crop&q=80"
              alt=""
              fill
              loading="lazy"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              className="object-cover"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg,rgba(232,107,75,.92) 0%,rgba(194,75,42,.88) 100%)',
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6 py-24 text-center md:px-10">
            <h2
              className="mb-4 font-black leading-[.95] tracking-[-0.05em] text-white"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
            >
              Your case deserves the best.
            </h2>
            <p
              className="mx-auto mb-8 max-w-xl text-base leading-[1.7]"
              style={{ color: 'rgba(255,255,255,.80)' }}
            >
              Thousands of clients trust US Attorneys to find legal representation — and never look
              back.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/practice-areas"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-clay-600 transition-all duration-200 hover:-translate-y-0.5"
              >
                Find an attorney
              </Link>
              <Link
                href="/attorney-dashboard"
                className="rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white/10"
                style={{ border: '1.5px solid rgba(255,255,255,.4)' }}
              >
                I am an attorney →
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </>
  )
}
