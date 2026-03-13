import { notFound } from 'next/navigation'
import { tradeContent, getTasksForService } from '@/lib/data/trade-content'
import { getVilleBySlug } from '@/lib/data/france'

export const revalidate = 86400

export default async function TarifsServiceTravailVillePage({
  params,
}: {
  params: Promise<{ service: string; ville: string; travail: string }>
}) {
  const { service, ville: villeSlug, travail } = await params

  const trade = tradeContent[service]
  const villeData = getVilleBySlug(villeSlug)
  if (!trade || !villeData) notFound()

  const tasks = getTasksForService(service)
  const currentTask = tasks.find((t) => t.slug === travail)
  if (!currentTask) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold">
        Prix {currentTask.name.toLowerCase()} à {villeData.name}
      </h1>
      <p className="mt-4 text-gray-600">
        Service: {trade.name} | Ville: {villeData.name} | Task: {currentTask.name}
      </p>
      <p className="mt-2 text-gray-500">
        Prix: {currentTask.priceText}
      </p>
    </div>
  )
}
