import { Shield, CheckCircle, Lock, Clock } from 'lucide-react'
import Link from 'next/link'

interface TrustGuaranteeProps {
  /** 'banner' for inline display, 'compact' for minimal */
  variant?: 'banner' | 'compact'
}

const guarantees = [
  {
    icon: Shield,
    title: 'Verified Attorneys',
    description: 'Bar number verified, credentials checked',
  },
  {
    icon: CheckCircle,
    title: '100% Free Consultations',
    description: 'No obligation, no hidden fees',
  },
  {
    icon: Lock,
    title: 'Data Protected',
    description: 'Your information remains confidential',
  },
  {
    icon: Clock,
    title: 'Response within 24h',
    description: "Up to 3 attorneys contact you",
  },
]

export default function TrustGuarantee({ variant = 'banner' }: TrustGuaranteeProps) {
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
        {guarantees.map((g) => (
          <span key={g.title} className="flex items-center gap-1.5">
            <g.icon className="w-3.5 h-3.5 text-green-500" />
            {g.title}
          </span>
        ))}
        <Link href="/guarantee" className="text-blue-600 hover:underline">
          Learn more
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/60 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-green-600" />
        <h3 className="font-heading text-lg font-bold text-gray-900">
          The US Attorneys Guarantee
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {guarantees.map((g) => (
          <div key={g.title} className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <g.icon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{g.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/guarantee"
          className="text-sm text-green-700 hover:text-green-900 font-medium hover:underline"
        >
          Discover our quality commitment
        </Link>
      </div>
    </div>
  )
}
