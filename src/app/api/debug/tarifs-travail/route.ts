import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const steps: string[] = []

  try {
    steps.push('1. Starting imports...')

    const { tradeContent, getTasksForService } = await import('@/lib/data/trade-content')
    steps.push('2. trade-content imported OK')

    const { getVilleBySlug, getNearbyCities } = await import('@/lib/data/france')
    steps.push('3. france imported OK')

    const { getCommuneBySlug } = await import('@/lib/data/commune-data')
    steps.push('4. commune-data imported OK')

    const { getBreadcrumbSchema, getFAQSchema, getServicePricingSchema, getSpeakableSchema } = await import('@/lib/seo/jsonld')
    steps.push('5. jsonld imported OK')

    const { getDefaultAuthor } = await import('@/lib/data/team')
    steps.push('6. team imported OK')

    const { getServiceImage } = await import('@/lib/data/images')
    steps.push('7. images imported OK')

    // Test data resolution
    const trade = tradeContent['plombier']
    steps.push(`8. trade: ${trade ? trade.name : 'NULL'}`)

    const villeData = getVilleBySlug('paris')
    steps.push(`9. villeData: ${villeData ? villeData.name : 'NULL'}`)

    const tasks = getTasksForService('plombier')
    steps.push(`10. tasks count: ${tasks.length}`)

    const currentTask = tasks.find((t) => t.slug === 'debouchage-de-canalisation')
    steps.push(`11. currentTask: ${currentTask ? currentTask.name : 'NULL'}`)

    // Test commune fetch (the async operation)
    let commune = null
    try {
      commune = await getCommuneBySlug('paris')
      steps.push(`12. commune: ${commune ? commune.name : 'null (no data)'}`)
    } catch (e: unknown) {
      steps.push(`12. commune ERROR: ${e instanceof Error ? e.message : String(e)}`)
    }

    // Test JSON-LD generation
    getBreadcrumbSchema([{ name: 'Test', url: '/' }])
    steps.push(`13. breadcrumbSchema: OK`)

    getFAQSchema([{ question: 'Test?', answer: 'Test.' }])
    steps.push(`14. faqSchema: OK`)

    const author = getDefaultAuthor()
    steps.push(`15. author: ${author.name}`)

    const nearbyCities = getNearbyCities('paris', 6)
    steps.push(`16. nearbyCities: ${nearbyCities.length}`)

    const img = getServiceImage('plombier')
    steps.push(`17. serviceImage: ${img.src ? 'OK' : 'NULL'}`)

    if (currentTask) {
      getServicePricingSchema({
        serviceName: `${currentTask.name} - Plombier`,
        serviceSlug: 'plombier',
        description: 'Test',
        lowPrice: 80,
        highPrice: 250,
        location: 'Paris',
        url: 'https://servicesartisans.fr/tarifs/plombier/paris/debouchage-de-canalisation',
      })
      steps.push(`18. pricingSchema: OK`)

      getSpeakableSchema({
        url: 'https://servicesartisans.fr/test',
        title: 'Test',
      })
      steps.push(`19. speakableSchema: OK`)
    }

    steps.push('ALL STEPS COMPLETED SUCCESSFULLY')

    return NextResponse.json({ success: true, steps })
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      steps,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 10),
        name: error.name,
      } : String(error),
    }, { status: 500 })
  }
}
