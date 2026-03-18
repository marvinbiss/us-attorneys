import { Metadata } from 'next'
import Link from 'next/link'
import {
  Check,
  X,
  Shield,
  TrendingUp,
  Users,
  Star,
  Zap,
  BarChart3,
  Crown,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Search,
  Award,
} from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getSubscriptionPlans, type SubscriptionPlan } from '@/lib/subscriptions'

export const metadata: Metadata = {
  title: 'Subscription Plans for Attorneys — Grow Your Practice | US Attorneys',
  description:
    'Choose the plan that fits your practice. From free basic listings to premium placement with unlimited leads. Start your 14-day free trial today.',
  alternates: {
    canonical: `${SITE_URL}/subscription-plans`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    title: 'Attorney Subscription Plans — US Attorneys',
    description:
      'Boost your visibility, get more clients, and grow your practice with US Attorneys Pro and Premium plans.',
    url: `${SITE_URL}/subscription-plans`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} Subscription Plans`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attorney Subscription Plans — US Attorneys',
    description:
      'Boost your visibility, get more clients, and grow your practice.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 3600

const IS_BUILD = process.env.NEXT_BUILD_SKIP_DB === '1'

// --- Feature Comparison Data ---

interface FeatureRow {
  label: string
  free: string | boolean
  pro: string | boolean
  premium: string | boolean
  icon: React.ReactNode
}

const featureComparison: FeatureRow[] = [
  {
    label: 'Profile listing',
    free: 'Basic',
    pro: 'Enhanced',
    premium: 'Premium',
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: 'Leads per month',
    free: '5',
    pro: '50',
    premium: 'Unlimited',
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    label: 'Search priority boost',
    free: '1x',
    pro: '2x',
    premium: '5x',
    icon: <Search className="w-4 h-4" />,
  },
  {
    label: 'Profile badge',
    free: false,
    pro: 'Priority',
    premium: 'Premium Verified',
    icon: <Award className="w-4 h-4" />,
  },
  {
    label: 'Analytics dashboard',
    free: false,
    pro: 'Basic',
    premium: 'Advanced + Competitors',
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    label: 'Review solicitation tools',
    free: false,
    pro: true,
    premium: true,
    icon: <Star className="w-4 h-4" />,
  },
  {
    label: 'Featured placement',
    free: false,
    pro: false,
    premium: true,
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    label: 'Video profile intro',
    free: false,
    pro: false,
    premium: true,
    icon: <Zap className="w-4 h-4" />,
  },
  {
    label: 'Custom intake forms',
    free: false,
    pro: false,
    premium: true,
    icon: <Shield className="w-4 h-4" />,
  },
  {
    label: 'Dedicated account manager',
    free: false,
    pro: false,
    premium: true,
    icon: <Crown className="w-4 h-4" />,
  },
  {
    label: 'Support',
    free: 'Email',
    pro: 'Priority email & chat',
    premium: '24/7 dedicated',
    icon: <HelpCircle className="w-4 h-4" />,
  },
]

// --- FAQ Data ---

const faqs = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'When you sign up for Pro or Premium, your first 14 days are completely free. You can cancel anytime during the trial with no charge. Your card is only charged after the trial period ends.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade or downgrade your plan at any time. When upgrading, the prorated difference is charged immediately. When downgrading, the change takes effect at your next billing cycle.',
  },
  {
    q: 'What counts as a "lead"?',
    a: 'A lead is counted each time a potential client contacts you through your US Attorneys profile — via the contact form, phone click, or consultation request. Simple profile views do not count toward your lead limit.',
  },
  {
    q: 'What happens when I reach my monthly lead limit?',
    a: 'On the Free and Pro plans, once you reach your monthly lead limit, your profile remains visible but new contact requests are paused until the next billing cycle. You can upgrade to increase your limit at any time.',
  },
  {
    q: 'Is there an annual discount?',
    a: 'Yes. Annual billing saves you approximately 20% compared to monthly billing. Pro is $79/mo billed annually ($950/year) and Premium is $159/mo billed annually ($1,900/year).',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Absolutely. You can cancel at any time from your dashboard. Your premium features remain active until the end of your current billing period. No questions asked.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer a full refund within the first 30 days if you are not satisfied with your plan. After 30 days, cancellations take effect at the end of the billing period with no further charges.',
  },
  {
    q: 'How does the priority search boost work?',
    a: 'Pro members get 2x visibility in search results, and Premium members get 5x. This means your profile appears higher when potential clients search for attorneys in your practice area and location.',
  },
]

// --- Page Component ---

export default async function SubscriptionPlansPage() {
  let plans: SubscriptionPlan[] = []
  if (!IS_BUILD) {
    try {
      plans = await getSubscriptionPlans()
    } catch {
      // Fallback handled by getSubscriptionPlans
    }
  }

  const freePlan = plans.find((p) => p.slug === 'free')
  const proPlan = plans.find((p) => p.slug === 'pro')
  const premiumPlan = plans.find((p) => p.slug === 'premium')

  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Subscription Plans', url: `${SITE_URL}/subscription-plans` },
        ])}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Subscription Plans' },
            ]}
          />
        </div>

        {/* Hero */}
        <section className="pt-12 pb-8 sm:pt-16 sm:pb-12">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Grow Your Practice with{' '}
              <span className="text-blue-600 dark:text-blue-400">
                {SITE_NAME}
              </span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of attorneys who trust {SITE_NAME} to connect
              them with qualified clients. Choose the plan that matches your
              growth ambitions.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-600" />
                14-day free trial
              </span>
              <span className="hidden sm:inline">|</span>
              <span>No credit card required to start</span>
              <span className="hidden sm:inline">|</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6 items-start">
              {/* Free Plan */}
              <PricingCard
                name="Free"
                price={0}
                yearlyPrice={0}
                description="Get started with a basic listing"
                features={
                  freePlan?.features || [
                    'Basic profile listing',
                    'Up to 5 leads per month',
                    'Standard search placement',
                    'Email notifications',
                    'Client messaging',
                  ]
                }
                cta="Claim Your Profile"
                ctaHref="/register-attorney"
                variant="default"
              />

              {/* Pro Plan -- highlighted */}
              <PricingCard
                name="Pro"
                price={proPlan?.price_monthly ? proPlan.price_monthly / 100 : 99}
                yearlyPrice={proPlan?.price_yearly ? proPlan.price_yearly / 100 : 950}
                description="For attorneys ready to grow"
                features={
                  proPlan?.features || [
                    'Enhanced profile with photo & bio',
                    'Up to 50 leads per month',
                    '2x search priority boost',
                    'Priority badge on profile',
                    'Detailed analytics dashboard',
                    'Priority email & chat support',
                    'Client review solicitation tools',
                    'Monthly performance reports',
                  ]
                }
                cta="Start 14-Day Free Trial"
                ctaHref="/register-attorney?plan=pro"
                variant="popular"
                badge="Most Popular"
              />

              {/* Premium Plan */}
              <PricingCard
                name="Premium"
                price={premiumPlan?.price_monthly ? premiumPlan.price_monthly / 100 : 199}
                yearlyPrice={premiumPlan?.price_yearly ? premiumPlan.price_yearly / 100 : 1900}
                description="Maximum visibility & unlimited leads"
                features={
                  premiumPlan?.features || [
                    'Premium profile with video intro',
                    'Unlimited leads per month',
                    '5x search priority boost',
                    'Premium verified badge',
                    'Featured placement in search results',
                    'Advanced analytics & competitor insights',
                    'Dedicated account manager',
                    'Priority placement in directory',
                    'Custom intake forms',
                    'Monthly ROI reports',
                    '24/7 priority support',
                  ]
                }
                cta="Start 14-Day Free Trial"
                ctaHref="/register-attorney?plan=premium"
                variant="premium"
              />
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Detailed Feature Comparison
            </h2>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[540px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 pr-4 pl-4 sm:pl-0 text-sm font-semibold text-gray-900 dark:text-white">
                      Feature
                    </th>
                    <th className="text-center py-4 px-3 text-sm font-semibold text-gray-900 dark:text-white w-28">
                      Free
                    </th>
                    <th className="text-center py-4 px-3 text-sm font-semibold text-blue-600 dark:text-blue-400 w-28">
                      Pro
                    </th>
                    <th className="text-center py-4 px-3 pr-4 sm:pr-0 text-sm font-semibold text-purple-600 dark:text-purple-400 w-28">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row, i) => (
                    <tr
                      key={row.label}
                      className={
                        i % 2 === 0
                          ? 'bg-gray-50 dark:bg-gray-800/50'
                          : 'bg-white dark:bg-gray-900'
                      }
                    >
                      <td className="py-3.5 pr-4 pl-4 sm:pl-0 text-sm text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500">{row.icon}</span>
                          {row.label}
                        </span>
                      </td>
                      <td className="text-center py-3.5 px-3">
                        <FeatureCell value={row.free} />
                      </td>
                      <td className="text-center py-3.5 px-3">
                        <FeatureCell value={row.pro} />
                      </td>
                      <td className="text-center py-3.5 px-3 pr-4 sm:pr-0">
                        <FeatureCell value={row.premium} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Social Proof / Testimonials */}
        <section className="py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Trusted by Attorneys Nationwide
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Hear from attorneys who have grown their practices with {SITE_NAME}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Since upgrading to Pro, I have seen a 3x increase in qualified client inquiries. The analytics dashboard helps me understand exactly where my leads come from."
                name="Sarah M."
                role="Family Law Attorney"
                location="Austin, TX"
                rating={5}
              />
              <TestimonialCard
                quote="The Premium plan paid for itself in the first week. The priority placement puts my profile in front of clients actively looking for a criminal defense attorney."
                name="James R."
                role="Criminal Defense Attorney"
                location="Chicago, IL"
                rating={5}
              />
              <TestimonialCard
                quote="I started with the free plan and upgraded after seeing real results. The 14-day trial made it a no-brainer. Now I consistently get 30+ qualified leads monthly."
                name="Maria L."
                role="Immigration Attorney"
                location="Miami, FL"
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white pr-4">
                      {faq.q}
                    </span>
                    <span className="flex-shrink-0 ml-2 text-gray-400 group-open:rotate-180 transition-transform duration-200">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-2xl p-8 sm:p-12 text-center shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to Grow Your Practice?
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                Join over 300,000 attorneys listed on {SITE_NAME}. Start your
                14-day free trial today — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register-attorney?plan=pro"
                  className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-white font-medium px-8 py-3.5 rounded-lg border border-white/30 hover:bg-white/10 transition-colors"
                >
                  Talk to Sales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

// --- Sub-Components ---

function PricingCard({
  name,
  price,
  yearlyPrice,
  description,
  features,
  cta,
  ctaHref,
  variant = 'default',
  badge,
}: {
  name: string
  price: number
  yearlyPrice: number
  description: string
  features: string[]
  cta: string
  ctaHref: string
  variant?: 'default' | 'popular' | 'premium'
  badge?: string
}) {
  const isPopular = variant === 'popular'
  const isPremium = variant === 'premium'

  const borderColor = isPopular
    ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
    : isPremium
      ? 'border-purple-500 dark:border-purple-400'
      : 'border-gray-200 dark:border-gray-700'

  const ctaColor = isPopular
    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/25'
    : isPremium
      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-600/25'
      : 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900'

  const yearlyMonthly = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 rounded-2xl border-2 ${borderColor} p-6 sm:p-8 flex flex-col ${
        isPopular ? 'md:-mt-4 md:pb-10 shadow-xl' : 'shadow-sm'
      }`}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-sm">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>

      <div className="mb-6">
        {price === 0 ? (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">
              $0
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              /forever
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ${price}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                /month
              </span>
            </div>
            {yearlyMonthly > 0 && yearlyMonthly < price && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-medium">
                or ${yearlyMonthly}/mo billed annually (save{' '}
                {Math.round(((price - yearlyMonthly) / price) * 100)}%)
              </p>
            )}
          </>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
          >
            <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={`block text-center font-semibold py-3 px-6 rounded-lg transition-colors ${ctaColor}`}
      >
        {cta}
      </Link>

      {price > 0 && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
          14-day free trial included
        </p>
      )}
    </div>
  )
}

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <Check className="w-5 h-5 text-green-500 mx-auto" aria-label="Included" />
    )
  }
  if (value === false) {
    return (
      <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" aria-label="Not included" />
    )
  }
  return (
    <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
  )
}

function TestimonialCard({
  quote,
  name,
  role,
  location,
  rating,
}: {
  quote: string
  name: string
  role: string
  location: string
  rating: number
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: rating }, (_, i) => (
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        ))}
      </div>
      <blockquote className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {role} &middot; {location}
        </p>
      </div>
    </div>
  )
}
