/**
 * PriceTable — Tableau HTML des tarifs pour Featured Snippets Google.
 * Parse les commonTasks (format "Label : prix") et rend un <table> semantique.
 */

interface PriceTableProps {
  tasks: string[]
  tradeName: string
  priceRange: { min: number; max: number; unit: string }
}

export default function PriceTable({ tasks, tradeName, priceRange }: PriceTableProps) {
  if (!tasks || tasks.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Combien co&ucirc;te un {tradeName.toLowerCase()} ?
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Tarif horaire moyen : <strong className="text-gray-900">{priceRange.min}&ndash;{priceRange.max} {priceRange.unit}</strong>.
        Voici les prix indicatifs des prestations courantes :
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3.5 text-sm font-semibold text-gray-700">Prestation</th>
              <th className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">Prix indicatif</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const colonIndex = task.indexOf(' : ')
              const label = colonIndex !== -1 ? task.slice(0, colonIndex).trim() : task.trim()
              const price = colonIndex !== -1 ? task.slice(colonIndex + 3).trim() : 'Sur devis'
              return (
                <tr
                  key={i}
                  className={`hover:bg-blue-50/60 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-5 py-4 text-gray-800 text-sm border-t border-gray-100">{label}</td>
                  <td className="px-5 py-4 text-gray-900 text-sm font-medium border-t border-gray-100 text-right whitespace-nowrap">{price}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        * Prix indicatifs constat&eacute;s en France m&eacute;tropolitaine. Les tarifs varient selon la r&eacute;gion, la complexit&eacute; des travaux et le professionnel.
      </p>
    </div>
  )
}
