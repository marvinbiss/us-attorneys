/**
 * PriceTableHTML — Tableau HTML semantique des tarifs pour capturer les Featured Snippets Google.
 *
 * Rend un vrai <table> avec <caption>, <thead>, <tbody>, <tfoot>.
 * Parse les commonTasks (format "Label : prix" ou "Label: prix") et applique
 * un multiplicateur regional optionnel aux prix numeriques.
 *
 * Si specialtySlug ET locationSlug sont fournis, chaque nom de tache devient un lien
 * vers /pricing/[service]/[ville]/[taskSlug].
 *
 * Server Component — pas de 'use client'.
 */

import Link from 'next/link'
import { slugifyTask } from '@/lib/data/trade-content'

interface PriceTableHTMLProps {
  tasks: string[]           // commonTasks du trade
  specialtyName: string       // ex: "Plombier"
  specialtySlug?: string      // slug du service pour les liens (ex: "plombier")
  location?: string         // ex: "Paris" (optionnel)
  locationSlug?: string     // slug de la ville pour les liens (ex: "paris")
  multiplier?: number       // multiplicateur regional (defaut 1)
  unit?: string             // ex: "€/h"
}

/**
 * Parse une tache au format "Nom prestation : 80 a 250 € ..." ou "Nom prestation: prix"
 * Retourne { name, price } ou le prix est ajuste si un multiplicateur est fourni.
 */
function parseTaskLocal(task: string, multiplier: number): { name: string; price: string } {
  // Support both "Label : prix" and "Label: prix"
  const colonIndex = task.indexOf(':')
  if (colonIndex === -1) {
    return { name: task.trim(), price: 'Sur devis' }
  }

  const name = task.slice(0, colonIndex).trim()
  let priceStr = task.slice(colonIndex + 1).trim()

  if (multiplier !== 1) {
    // Replace all numbers in the price string with multiplied values
    priceStr = priceStr.replace(/(\d[\d\s]*)/g, (match) => {
      const num = parseInt(match.replace(/\s/g, ''), 10)
      if (isNaN(num)) return match
      const adjusted = Math.round(num * multiplier)
      return adjusted.toLocaleString('fr-FR')
    })
  }

  return { name, price: priceStr || 'Sur devis' }
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
    ? `Tarifs ${specialtyName.toLowerCase()} ${location} — 2026`
    : `Tarifs ${specialtyName.toLowerCase()} en France — 2026`

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
              Prestation
            </th>
            <th scope="col" className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">
              Prix indicatif
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
                      Devis gratuit
                    </Link>
                  ) : (
                    <Link
                      href="/quotes"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Devis gratuit
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
              Prix indicatifs, peuvent varier selon la complexité des travaux, la région et le professionnel.
              {location && multiplier !== 1 && (
                <span className="ml-1">
                  Tarifs ajustés pour {location} ({multiplier > 1 ? '+' : ''}{Math.round((multiplier - 1) * 100)}&nbsp;% vs moyenne nationale).
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
