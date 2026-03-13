import { Metadata } from 'next'
import { Eye, Ear, Hand, Brain, Mail } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import JsonLd from '@/components/JsonLd'
import { getBreadcrumbSchema } from '@/lib/seo/jsonld'
import { SITE_URL } from '@/lib/seo/config'
import { getPageContent } from '@/lib/cms'
import { CmsContent } from '@/components/CmsContent'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Accessibilité',
  description: 'Déclaration d\'accessibilité de ServicesArtisans - Notre engagement pour rendre le site accessible à tous.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: `${SITE_URL}/accessibilite`,
  },
  openGraph: {
    title: 'Accessibilité',
    description: 'Notre engagement pour rendre le site accessible à tous.',
    url: `${SITE_URL}/accessibilite`,
    type: 'website',
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'ServicesArtisans — Accessibilité' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessibilité',
    images: [`${SITE_URL}/opengraph-image`],
  },
}

export default async function AccessibilitePage() {
  const cmsPage = await getPageContent('accessibilite', 'static')

  if (cmsPage?.content_html) {
    return (
      <div className="min-h-screen bg-gray-50">
        <JsonLd data={getBreadcrumbSchema([
          { name: 'Accueil', url: '/' },
          { name: 'Accessibilité', url: '/accessibilite' },
        ])} />
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Breadcrumb items={[{ label: 'Accessibilité' }]} className="mb-4" />
            <h1 className="font-heading text-3xl font-bold text-gray-900">
              {cmsPage.title}
            </h1>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <CmsContent html={cmsPage.content_html} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={getBreadcrumbSchema([
        { name: 'Accueil', url: '/' },
        { name: 'Accessibilité', url: '/accessibilite' },
      ])} />
      {/* Hero */}
      <section className="relative bg-[#0a0f1e] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 110%, rgba(37,99,235,0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%)',
          }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-36">
          <Breadcrumb
            items={[{ label: 'Accessibilité' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white [&_svg]:text-slate-600"
          />
          <h1 className="font-heading text-4xl font-extrabold mb-4 tracking-[-0.025em]">
            D&eacute;claration d&apos;accessibilit&eacute;
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl">
            ServicesArtisans s&apos;engage &agrave; rendre son site web accessible &agrave; tous,
            conform&eacute;ment au R&eacute;f&eacute;rentiel G&eacute;n&eacute;ral d&apos;Am&eacute;lioration de l&apos;Accessibilit&eacute; (RGAA).
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
          {/* État de conformité */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">État de conformité</h2>
            <p className="text-gray-600 mb-4">
              Le site ServicesArtisans est en <strong>conformité partielle</strong> avec le
              Référentiel Général d'Amélioration de l'Accessibilité (RGAA) version 4.1.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Audit de conformité en cours.
              </p>
            </div>
          </section>

          {/* Nos engagements */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nos engagements</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Déficiences visuelles</h3>
                  <p className="text-gray-600 text-sm">
                    Compatibilité avec les lecteurs d'écran, contrastes suffisants, textes alternatifs pour les images.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Ear className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Déficiences auditives</h3>
                  <p className="text-gray-600 text-sm">
                    Pas de contenu audio automatique, alternatives textuelles disponibles.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Hand className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Déficiences motrices</h3>
                  <p className="text-gray-600 text-sm">
                    Navigation au clavier, zones de clic suffisantes, pas de limite de temps.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Déficiences cognitives</h3>
                  <p className="text-gray-600 text-sm">
                    Langage clair et simple, structure de page cohérente, navigation intuitive.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contenus non accessibles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contenus non accessibles</h2>
            <p className="text-gray-600 mb-4">
              Les contenus suivants ne sont pas encore conformes :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Certaines cartes interactives ne sont pas entièrement accessibles au clavier</li>
              <li>Quelques formulaires complexes nécessitent des améliorations pour les lecteurs d'écran</li>
              <li>Certains documents PDF ne sont pas encore balisés pour l'accessibilité</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Ces éléments sont en cours de correction et seront mis à jour prochainement.
            </p>
          </section>

          {/* Technologies utilisées */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Technologies utilisées</h2>
            <p className="text-gray-600 mb-4">
              L'accessibilité de ce site repose sur les technologies suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>HTML5</li>
              <li>WAI-ARIA (Accessible Rich Internet Applications)</li>
              <li>CSS3</li>
              <li>JavaScript</li>
            </ul>
          </section>

          {/* Environnement de test */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Environnement de test</h2>
            <p className="text-gray-600 mb-4">
              Les tests d'accessibilité ont été réalisés avec les configurations suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>NVDA 2023 avec Firefox</li>
              <li>VoiceOver avec Safari sur macOS</li>
              <li>VoiceOver avec Safari sur iOS</li>
              <li>TalkBack avec Chrome sur Android</li>
            </ul>
          </section>

          {/* Retour d'information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Retour d'information et contact</h2>
            <p className="text-gray-600 mb-4">
              Si vous rencontrez un défaut d'accessibilité vous empêchant d'accéder à un contenu
              ou une fonctionnalité du site, vous pouvez nous contacter :
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:accessibilite@servicesartisans.fr"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Mail className="w-5 h-5" />
                accessibilite@servicesartisans.fr
              </a>
            </div>
          </section>

          {/* Voies de recours */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Voies de recours</h2>
            <p className="text-gray-600 mb-4">
              Si vous constatez un défaut d'accessibilité qui vous empêche d'accéder à un contenu
              ou une fonctionnalité et que vous nous l'avez signalé sans obtenir de réponse satisfaisante,
              vous êtes en droit de :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Écrire au Défenseur des droits</li>
              <li>Contacter le délégué du Défenseur des droits dans votre région</li>
              <li>Envoyer un courrier par voie postale (gratuit, ne pas mettre de timbre) :
                Défenseur des droits - Libre réponse 71120 - 75342 Paris CEDEX 07</li>
            </ul>
          </section>

          {/* Date */}
          <section className="border-t pt-6">
            <p className="text-gray-500 text-sm">
              Cette déclaration d'accessibilité a été établie le 1er janvier 2024.
              Dernière mise à jour : 15 janvier 2024.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
