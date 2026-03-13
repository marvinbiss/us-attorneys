import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema, getOrganizationSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { Loader2 } from 'lucide-react'
import { services } from '@/lib/data/france'

// Dynamic import of the map client component (Leaflet is SSR-incompatible)
const CarteClient = dynamic(() => import('./CarteClient'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: '600px' }}>
      <div className="text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Chargement de la carte...</p>
      </div>
    </div>
  ),
})

export const metadata: Metadata = {
  title: 'Carte des artisans en France',
  description:
    'Visualisez la couverture des artisans référencés en France dans 101 départements. Trouvez un artisan près de chez vous.',
  alternates: {
    canonical: `${SITE_URL}/carte-artisans`,
  },
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    locale: 'fr_FR',
    title: 'Carte des artisans en France',
    description:
      'Visualisez la couverture des artisans référencés en France dans 101 départements.',
    url: `${SITE_URL}/carte-artisans`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'ServicesArtisans — Carte des artisans en France',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carte des artisans en France',
    description:
      'Visualisez la couverture des artisans en France dans 101 départements.',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export const revalidate = 86400

export default function CarteArtisansPage() {
  const breadcrumbItems = [
    { label: 'Carte des artisans' },
  ]

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Carte des artisans', url: '/carte-artisans' },
  ])

  const organizationSchema = getOrganizationSchema()

  return (
    <>
      <JsonLd data={[breadcrumbSchema, organizationSchema]} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <Breadcrumb items={breadcrumbItems} className="mb-4 text-blue-200 [&_a]:text-blue-200 [&_a:hover]:text-white [&_svg]:text-blue-300 [&>ol>li:last-child_span]:text-white" />
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading mb-3">
              Carte des artisans en France
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Explorez la couverture des artisans référencés sur notre plateforme dans les 101 départements. Cliquez sur une ville pour découvrir les professionnels disponibles.
            </p>
          </div>
        </div>

        {/* Map section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <CarteClient />
        </div>

        {/* Info section */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl font-bold text-gray-900 font-heading mb-8 text-center">
              Une couverture nationale complète
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">101</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Départements couverts</h3>
                <p className="text-sm text-gray-600">
                  Métropole et outre-mer, nos artisans interviennent dans tous les départements français.
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">{services.length}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Métiers du bâtiment</h3>
                <p className="text-sm text-gray-600">
                  Plombiers, électriciens, maçons, couvreurs, peintres et bien d&apos;autres corps de métier.
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-amber-600">24/7</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Recherche gratuite</h3>
                <p className="text-sm text-gray-600">
                  Accédez gratuitement à notre annuaire à tout moment. Aucune inscription requise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
