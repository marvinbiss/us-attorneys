"use client"

import { useState } from 'react'
import { Shield, Copy, Check, Code, Globe, Star, ExternalLink, ChevronDown } from 'lucide-react'
import { SITE_URL } from '@/lib/seo/config'

interface BadgeClientProps {
  faqItems: { question: string; answer: string }[]
}

export default function BadgeClient({ faqItems }: BadgeClientProps) {
  const [name, setName] = useState('')
  const [service, setService] = useState('')
  const [style, setStyle] = useState<'light' | 'dark' | 'minimal'>('light')
  const [copied, setCopied] = useState(false)

  const displayName = name || 'Mon Entreprise'
  const displayService = service || 'Artisan'

  const badgeParams = new URLSearchParams({
    name: displayName,
    service: displayService,
    rating: '4.8',
    reviews: '12',
    style,
  })

  const badgeUrl = `${SITE_URL}/api/badge?${badgeParams.toString()}`
  const serviceSlug = service
    ? service.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : 'artisan'
  const linkUrl = `${SITE_URL}/services/${serviceSlug}`

  const embedCode = `<a href="${linkUrl}" target="_blank" rel="noopener">
  <img src="${badgeUrl}"
       alt="${displayName} — Artisan Verifie sur ServicesArtisans"
       width="${style === 'minimal' ? '200' : '300'}" height="${style === 'minimal' ? '50' : '100'}" />
</a>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = embedCode
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <>
      {/* Badge Configurator */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Configurez votre badge
          </h2>
          <p className="text-gray-500 text-sm text-center mb-10">
            Remplissez les champs ci-dessous et votre badge se met a jour en temps reel.
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Form */}
            <div className="space-y-5">
              <div>
                <label htmlFor="badge-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom de votre entreprise
                </label>
                <input
                  id="badge-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Dupont Plomberie"
                  maxLength={40}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="badge-service" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Metier / Service
                </label>
                <input
                  id="badge-service"
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Ex : Plombier"
                  maxLength={40}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="badge-style" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Style du badge
                </label>
                <select
                  id="badge-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as 'light' | 'dark' | 'minimal')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                >
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Apercu en direct</p>
              <div className="bg-gray-100 rounded-xl border border-gray-200 p-8 flex items-center justify-center min-h-[160px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/badge?${badgeParams.toString()}`}
                  alt={`Badge ${displayName}`}
                  width={style === 'minimal' ? 200 : 300}
                  height={style === 'minimal' ? 50 : 100}
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Code */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Code HTML a copier
          </h2>
          <p className="text-gray-500 text-sm text-center mb-8">
            Collez ce code dans votre site pour afficher le badge.
          </p>
          <div className="bg-gray-900 rounded-xl p-6 relative">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm font-mono">HTML</span>
            </div>
            <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {embedCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              aria-label="Copier le code"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Code copie !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Comment integrer le badge sur votre site
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '1',
                icon: Shield,
                title: 'Configurez votre badge',
                desc: "Renseignez le nom de votre entreprise et votre metier dans le formulaire ci-dessus.",
              },
              {
                step: '2',
                icon: Copy,
                title: 'Copiez le code HTML',
                desc: "Cliquez sur le bouton \"Copier le code\" pour copier le code dans votre presse-papiers.",
              },
              {
                step: '3',
                icon: Code,
                title: 'Collez sur votre site',
                desc: "Integrez le code dans votre site WordPress, Wix, Squarespace ou tout autre CMS.",
              },
              {
                step: '4',
                icon: Globe,
                title: 'Badge affiche !',
                desc: "Le badge apparait automatiquement sur votre site. Aucune maintenance requise.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <item.icon className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Pourquoi afficher le badge ?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: 'Inspirez confiance aux clients',
                desc: "Le badge \"Artisan Verifie\" rassure instantanement vos visiteurs et augmente votre taux de conversion.",
              },
              {
                icon: Star,
                title: 'Augmentez vos demandes de devis',
                desc: "Les artisans qui affichent leur badge recoivent en moyenne plus de demandes de contact sur leur site.",
              },
              {
                icon: ExternalLink,
                title: 'Gratuit et sans engagement',
                desc: "Le badge est 100 % gratuit. Aucun abonnement, aucun frais cache. Vous pouvez le retirer a tout moment.",
              },
              {
                icon: Globe,
                title: 'Compatible avec tous les sites',
                desc: "Le badge fonctionne sur WordPress, Wix, Squarespace, Shopify, Webflow et tout site acceptant du HTML.",
              },
            ].map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Questions frequentes
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details key={i} className="bg-gray-50 rounded-xl border border-gray-200 group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="text-base font-semibold text-gray-900 pr-4">{item.question}</h3>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
