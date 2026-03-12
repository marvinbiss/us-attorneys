import type { Metadata } from 'next'
import Link from 'next/link'
import { Code, Zap, Globe, Shield, HelpCircle, ExternalLink, Copy, BarChart3 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'
import { getTradesSlugs, getTradeContent } from '@/lib/data/trade-content'

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const PAGE_TITLE = `Widget Prix Artisan — Tarifs sur votre site`
const PAGE_DESCRIPTION =
  'Widget embeddable gratuit et API JSON pour afficher les prix des artisans sur votre site ou blog. Plombier, électricien, serrurier… Tarifs actualisés par ville et région.'

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/widget-prix` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    url: `${SITE_URL}/widget-prix`,
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WidgetPrixPage() {
  const slugs = getTradesSlugs()

  // Group services in columns for display
  const servicesWithNames = slugs.map((slug) => {
    const trade = getTradeContent(slug)
    return { slug, name: trade?.name ?? slug }
  })

  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Widget Prix', url: '/widget-prix' },
  ]

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Widget Prix Artisan — ServicesArtisans.fr',
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/widget-prix`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }

  const embedCode = `<iframe src="https://servicesartisans.fr/api/prix-widget?service=plombier&ville=paris" width="100%" height="280" frameborder="0" style="border:0;max-width:480px" loading="lazy" title="Prix plombier à Paris — ServicesArtisans.fr"></iframe>`

  const apiExample = `fetch('https://servicesartisans.fr/api/prix-widget?service=plombier&ville=lyon&format=json')
  .then(res => res.json())
  .then(data => console.log(data))`

  const jsonResponseExample = `{
  "service": "plombier",
  "serviceName": "Plombier",
  "ville": "lyon",
  "villeName": "Lyon",
  "region": "Auvergne-Rhône-Alpes",
  "priceMin": 88,
  "priceMax": 2750,
  "unit": "intervention",
  "multiplier": 1.1,
  "interventions": [
    {
      "name": "Débouchage de canalisation",
      "prixMin": 88,
      "prixMax": 275,
      "unite": "intervention"
    }
  ],
  "source": "ServicesArtisans.fr",
  "sourceUrl": "https://servicesartisans.fr/plombier/lyon"
}`

  return (
    <>
      <JsonLd data={getBreadcrumbSchema(breadcrumbItems)} />
      <JsonLd data={webAppSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Breadcrumb
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'Widget Prix' },
            ]}
            className="mb-8 text-blue-200"
          />

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                Gratuit et sans inscription
              </div>
              <h1 className="mb-6 font-heading text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                Widget Prix Artisan
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-blue-100">
                Intégrez un widget de tarifs artisans sur votre site ou blog en une ligne de code.
                Données actualisées, design responsive, {slugs.length} métiers et toutes les villes de France.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#integration"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
                >
                  <Code className="h-5 w-5" />
                  Intégrer le widget
                </a>
                <a
                  href="#api"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  <Globe className="h-5 w-5" />
                  Documentation API
                </a>
              </div>
            </div>

            {/* Live preview */}
            <div className="relative">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2 text-sm text-blue-200">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono text-xs">votre-site.fr</span>
                </div>
                <iframe
                  src="/api/prix-widget?service=plombier&ville=paris"
                  width="100%"
                  height="280"
                  className="rounded-lg border-0"
                  loading="lazy"
                  title="Aperçu du widget prix plombier à Paris"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-12 text-center font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            Pourquoi utiliser notre widget ?
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: 'Gratuit à vie',
                desc: 'Aucun frais, aucune inscription. Copiez le code et intégrez-le immédiatement.',
              },
              {
                icon: BarChart3,
                title: 'Données actualisées',
                desc: `Prix mis à jour régulièrement pour ${slugs.length} métiers dans toutes les villes de France.`,
              },
              {
                icon: Globe,
                title: 'Responsive',
                desc: "Le widget s'adapte à toutes les tailles d'écran, du mobile au desktop.",
              },
              {
                icon: Shield,
                title: 'Sans dépendance',
                desc: 'HTML auto-contenu avec CSS inline. Aucun script externe, aucun cookie.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-gray-100 p-6 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration section */}
      <section id="integration" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            Intégration en 1 minute
          </h2>
          <p className="mb-8 text-gray-600">
            Copiez-collez ce code HTML dans votre site ou article de blog. Modifiez les paramètres
            <code className="mx-1 rounded bg-gray-200 px-1.5 py-0.5 text-sm font-mono text-blue-700">service</code>
            et
            <code className="mx-1 rounded bg-gray-200 px-1.5 py-0.5 text-sm font-mono text-blue-700">ville</code>
            selon vos besoins.
          </p>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Code className="h-4 w-4" />
                Code HTML à copier
              </span>
              <button
                className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                title="Copier le code"
              >
                <Copy className="h-3.5 w-3.5" />
                Copier
              </button>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
              <code className="text-gray-800">{embedCode}</code>
            </pre>
          </div>

          <div className="mt-8">
            <h3 className="mb-4 font-heading text-lg font-bold text-gray-900">Paramètres disponibles</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">Paramètre</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Exemple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-mono text-blue-700">service</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">Slug du métier (obligatoire)</td>
                    <td className="px-4 py-3 font-mono text-gray-500">plombier</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-blue-700">ville</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">Slug de la ville (obligatoire)</td>
                    <td className="px-4 py-3 font-mono text-gray-500">lyon</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-blue-700">format</td>
                    <td className="px-4 py-3 text-gray-600">string</td>
                    <td className="px-4 py-3 text-gray-600">{'"json"'} pour la réponse API (optionnel)</td>
                    <td className="px-4 py-3 font-mono text-gray-500">json</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* API documentation */}
      <section id="api" className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            Documentation API
          </h2>
          <p className="mb-8 text-gray-600">
            Utilisez notre API JSON gratuite pour intégrer les prix des artisans directement dans votre application.
          </p>

          {/* Endpoint */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="mb-3 font-heading text-lg font-bold text-gray-900">Endpoint</h3>
            <div className="flex items-center gap-3 overflow-x-auto rounded-lg bg-gray-900 px-4 py-3">
              <span className="shrink-0 rounded bg-green-500 px-2 py-0.5 text-xs font-bold text-white">GET</span>
              <code className="text-sm text-green-300">
                /api/prix-widget?service=&#123;slug&#125;&amp;ville=&#123;slug&#125;&amp;format=json
              </code>
            </div>
          </div>

          {/* Example request */}
          <div className="mb-8">
            <h3 className="mb-3 font-heading text-lg font-bold text-gray-900">Exemple de requête</h3>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">JavaScript (fetch)</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                <code className="text-gray-800">{apiExample}</code>
              </pre>
            </div>
          </div>

          {/* Example response */}
          <div className="mb-8">
            <h3 className="mb-3 font-heading text-lg font-bold text-gray-900">Exemple de réponse</h3>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">JSON</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                <code className="text-gray-800">{jsonResponseExample}</code>
              </pre>
            </div>
          </div>

          {/* Rate limits */}
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-bold text-amber-800">
              <Shield className="h-5 w-5" />
              Limites d&apos;utilisation
            </h3>
            <ul className="space-y-2 text-sm text-amber-700">
              <li>100 requêtes par heure et par adresse IP</li>
              <li>Les réponses sont cachées pendant 24 heures (CDN)</li>
              <li>Usage commercial autorisé sous réserve d&apos;attribution</li>
            </ul>
          </div>

          {/* Attribution */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-bold text-blue-800">
              <ExternalLink className="h-5 w-5" />
              Attribution obligatoire
            </h3>
            <p className="mb-3 text-sm text-blue-700">
              En utilisant le widget ou l&apos;API, vous devez inclure un lien visible vers ServicesArtisans.fr.
              Le widget HTML inclut automatiquement ce lien. Si vous utilisez l&apos;API JSON,
              ajoutez le lien suivant sur votre page :
            </p>
            <div className="rounded-lg bg-white p-3">
              <code className="text-sm text-gray-800">
                {`Source : <a href="https://servicesartisans.fr">ServicesArtisans.fr</a>`}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Available services */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            Services disponibles ({servicesWithNames.length} métiers)
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {servicesWithNames.map(({ slug, name }) => (
              <div
                key={slug}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm"
              >
                <span className="text-gray-700">{name}</span>
                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">{slug}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-8 flex items-center gap-3 font-heading text-2xl font-bold text-gray-900 sm:text-3xl">
            <HelpCircle className="h-7 w-7 text-blue-600" />
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Le widget est-il vraiment gratuit ?',
                a: "Oui, 100 % gratuit et sans inscription. Notre seule condition est de conserver le lien \"Powered by ServicesArtisans.fr\" visible dans le widget. Ce lien nous aide à développer le service et à maintenir les données à jour.",
              },
              {
                q: "D'où viennent les données de prix ?",
                a: "Les tarifs sont issus de notre baromètre des prix de l'artisanat, compilé à partir de milliers de devis réels et actualisé régulièrement. Les prix sont ajustés selon un coefficient régional pour refléter les écarts de coût entre les territoires.",
              },
              {
                q: 'Puis-je personnaliser le design du widget ?',
                a: "Le widget est livré avec un design professionnel prêt à l'emploi. Vous pouvez ajuster la taille via les attributs width et height de l'iframe. Le widget s'adapte automatiquement à la largeur disponible (responsive).",
              },
              {
                q: "Puis-je utiliser l'API pour une application commerciale ?",
                a: "Oui, l'usage commercial est autorisé. La seule obligation est d'inclure un lien visible vers ServicesArtisans.fr sur la page ou dans l'application qui affiche les données.",
              },
              {
                q: "Le widget ralentit-il mon site ?",
                a: "Non. Le widget est chargé dans une iframe isolée avec l'attribut loading=\"lazy\" (chargement différé). Il ne contient aucun script externe et n'affecte pas les performances de votre page.",
              },
              {
                q: 'Quelle est la fréquence de mise à jour des prix ?',
                a: 'Les prix sont mis à jour régulièrement en fonction des évolutions du marché. Les réponses API sont cachées pendant 24 heures pour garantir des performances optimales.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-gray-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50">
                  {q}
                  <span className="ml-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                    &#9660;
                  </span>
                </summary>
                <div className="border-t border-gray-100 px-6 py-4 text-sm leading-relaxed text-gray-600">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="mb-4 font-heading text-2xl font-bold sm:text-3xl">
            Prêt à intégrer les prix artisans ?
          </h2>
          <p className="mb-8 text-blue-100">
            Copiez le code ci-dessus et collez-le dans votre site. C&apos;est aussi simple que ça.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#integration"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              <Code className="h-5 w-5" />
              Voir le code d&apos;intégration
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Une question ? Contactez-nous
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
