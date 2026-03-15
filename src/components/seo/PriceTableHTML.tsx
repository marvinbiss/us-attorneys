/**
 * PriceTableHTML — Semantic HTML fee table for capturing Google Featured Snippets.
 *
 * Renders a real <table> with <caption>, <thead>, <tbody>, <tfoot>.
 * Parses commonTasks (format "Label : price" or "Label: price") and applies
 * an optional regional multiplier to numeric prices.
 *
 * If specialtySlug AND locationSlug are provided, each task name becomes a link
 * to /pricing/[service]/[location]/[taskSlug].
 *
 * Server Component — no 'use client'.
 */

import Link from 'next/link'
import { slugifyTask } from '@/lib/data/trade-content'

interface PriceTableHTMLProps {
  tasks: string[]           // commonTasks from the trade
  specialtyName: string       // e.g.: "Personal Injury"
  specialtySlug?: string      // service slug for links (e.g.: "personal-injury")
  location?: string         // e.g.: "New York" (optional)
  locationSlug?: string     // location slug for links (e.g.: "new-york")
  multiplier?: number       // regional multiplier (default 1)
  unit?: string             // e.g.: "$/h"
}

/**
 * Parse a task in format "Service name : 80 to 250 $ ..." or "Service name: price"
 * Returns { name, price } where the price is adjusted if a multiplier is provided.
 */
function parseTaskLocal(task: string, multiplier: number): { name: string; price: string } {
  // Support both "Label : price" and "Label: price"
  const colonIndex = task.indexOf(':')
  if (colonIndex === -1) {
    return { name: task.trim(), price: 'By consultation' }
  }

  const name = task.slice(0, colonIndex).trim()
  let priceStr = task.slice(colonIndex + 1).trim()

  if (multiplier !== 1) {
    // Replace all numbers in the price string with multiplied values
    priceStr = priceStr.replace(/(\d[\d\s]*)/g, (match) => {
      const num = parseInt(match.replace(/\s/g, ''), 10)
      if (isNaN(num)) return match
      const adjusted = Math.round(num * multiplier)
      return adjusted.toLocaleString('en-US')
    })
  }

  return { name, price: priceStr || 'By consultation' }
}

export default function PriceTableHTML({
  tasks,
  specialtyName,
  specialtySlug,
  location,
  locationSlug,
  multiplier = 1,
  unit,
}: PriceTableHTMLProps) {
  if (!tasks || tasks.length === 0) return null

  const canLink = Boolean(specialtySlug && locationSlug)

  const captionText = location
    ? `${specialtyName} fees in ${location} — 2026`
    : `${specialtyName} fees nationwide — 2026`

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-left">
        <caption className="px-5 py-3 text-left text-base font-semibold text-gray-900 bg-white border-b border-gray-100">
          {captionText}
          {unit && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({unit})
            </span>
          )}
        </caption>
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-gray-700">
              Service
            </th>
            <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">
              Estimated fee
            </th>
            <th scope="col" className="hidden sm:table-cell px-5 py-3.5 text-sm font-semibold text-gray-700 text-center w-28">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, i) => {
            const { name, price } = parseTaskLocal(task, multiplier)
            const taskSlug = canLink ? slugifyTask(name) : ''
            return (
              <tr
                key={i}
                className={`hover:bg-blue-50/60 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              >
                <td className="px-5 py-4 text-sm border-t border-gray-100">
                  {canLink ? (
                    <Link
                      href={`/pricing/${specialtySlug}/${locationSlug}/${taskSlug}`}
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="text-gray-800">{name}</span>
                  )}
                </td>
                <td className="px-5 py-4 text-gray-900 text-sm font-medium border-t border-gray-100 text-right whitespace-nowrap">
                  {price}
                </td>
                <td className="hidden sm:table-cell px-3 py-4 border-t border-gray-100 text-center">
                  {specialtySlug ? (
                    <Link
                      href={locationSlug ? `/quotes/${specialtySlug}/${locationSlug}` : `/quotes/${specialtySlug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Free consultation
                    </Link>
                  ) : (
                    <Link
                      href="/quotes"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Free consultation
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50/80 border-t border-gray-200">
            <td colSpan={3} className="px-5 py-3 text-xs text-gray-500 italic">
              Estimated fees may vary based on case complexity, state, and attorney.
              {location && multiplier !== 1 && (
                <span className="ml-1">
                  Fees adjusted for {location} ({multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}% vs national average).
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
