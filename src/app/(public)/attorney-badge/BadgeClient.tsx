"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Shield, Copy, Check, Code, Globe, ExternalLink, ChevronDown, Search, Sparkles, TrendingUp, Users } from 'lucide-react'
import { SITE_URL } from '@/lib/seo/config'

interface BadgeClientProps {
  faqItems: { question: string; answer: string }[]
}

interface ProviderResult {
  name: string
  slug: string
  stable_id: string | null
  specialty: string | null
  city: string | null
  is_verified: boolean
  rating: number | null
  reviews: number | null
}

export default function BadgeClient({ faqItems }: BadgeClientProps) {
  // Manual mode state
  const [name, setName] = useState('')
  const [service, setService] = useState('')
  const [style, setStyle] = useState<'light' | 'dark' | 'minimal'>('light')
  const [copied, setCopied] = useState(false)

  // Search mode state
  const [mode, setMode] = useState<'search' | 'manual'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProviderResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ProviderResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/badge/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
      setShowResults(true)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    setSelectedProvider(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const selectProvider = (p: ProviderResult) => {
    setSelectedProvider(p)
    setSearchQuery(p.name)
    setShowResults(false)
  }

  // Build badge URL and embed code
  const isVerifiedBadge = mode === 'search' && selectedProvider
  const displayName = isVerifiedBadge ? selectedProvider.name : (name || 'Mon Entreprise')
  const displayService = isVerifiedBadge ? (selectedProvider.specialty || 'Artisan') : (service || 'Artisan')

  let badgeUrl: string
  let linkUrl: string

  if (isVerifiedBadge) {
    const param = selectedProvider.slug
      ? `slug=${encodeURIComponent(selectedProvider.slug)}`
      : `id=${encodeURIComponent(selectedProvider.stable_id || '')}`
    badgeUrl = `${SITE_URL}/api/badge/verified?${param}&style=${style}`

    // Build link to artisan page
    const specialtySlug = (selectedProvider.specialty || 'artisan')
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const citySlug = (selectedProvider.city || 'france')
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const publicId = selectedProvider.slug || selectedProvider.stable_id || ''
    linkUrl = `${SITE_URL}/practice-areas/${specialtySlug}/${citySlug}/${publicId}`
  } else {
    const badgeParams = new URLSearchParams({
      name: displayName,
      service: displayService,
      rating: '4.8',
      reviews: '12',
      style,
    })
    badgeUrl = `${SITE_URL}/api/badge?${badgeParams.toString()}`
    const specialtySlug = service
      ? service.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'artisan'
    linkUrl = `${SITE_URL}/practice-areas/${specialtySlug}`
  }

  const badgeW = style === 'minimal' ? (isVerifiedBadge ? '220' : '200') : (isVerifiedBadge ? '320' : '300')
  const badgeH = style === 'minimal' ? (isVerifiedBadge ? '54' : '50') : (isVerifiedBadge ? '110' : '100')

  const embedCode = `<a href="${linkUrl}" target="_blank" rel="noopener" title="${displayName} — Artisan sur ServicesArtisans.fr">
  <img src="${badgeUrl}"
       alt="${displayName} — Artisan ${isVerifiedBadge && selectedProvider.is_verified ? 'Verifie' : 'Reference'} sur ServicesArtisans"
       width="${badgeW}" height="${badgeH}" loading="lazy" />
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

  // Preview URL (relative for same-origin)
  const previewBadgeUrl = isVerifiedBadge
    ? `/api/badge/verified?${selectedProvider.slug ? `slug=${encodeURIComponent(selectedProvider.slug)}` : `id=${encodeURIComponent(selectedProvider.stable_id || '')}`}&style=${style}`
    : `/api/badge?${new URLSearchParams({ name: displayName, service: displayService, rating: '4.8', reviews: '12', style }).toString()}`

  return (
    <>
      {/* Mode selector */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setMode('search')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'search' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Search className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                Trouver ma fiche
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Code className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                Badge personnalise
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            {mode === 'search' ? 'Trouvez votre fiche artisan' : 'Configurez votre badge'}
          </h2>
          <p className="text-gray-500 text-sm text-center mb-10">
            {mode === 'search'
              ? 'Recherchez votre entreprise pour generer un badge avec vos vraies donnees (note, avis, verification).'
              : 'Remplissez les champs ci-dessous et votre badge se met a jour en temps reel.'}
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Form */}
            <div className="space-y-5">
              {mode === 'search' ? (
                <>
                  <div ref={searchRef} className="relative">
                    <label htmlFor="badge-search" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom de votre entreprise
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="badge-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        placeholder="Ex : Dupont Plomberie, Martin Electricite..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                        autoComplete="off"
                      />
                    </div>

                    {/* Search results dropdown */}
                    {showResults && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                        {searching ? (
                          <div className="p-4 text-center text-gray-500 text-sm">Recherche...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Aucun resultat. Essayez un autre nom ou passez en mode &laquo; Badge personnalise &raquo;.
                          </div>
                        ) : (
                          searchResults.map((p) => (
                            <button
                              key={p.slug || p.stable_id}
                              onClick={() => selectProvider(p)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${p.is_verified ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                <Shield className={`w-4 h-4 ${p.is_verified ? 'text-emerald-600' : 'text-gray-400'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                  {[p.specialty, p.city].filter(Boolean).join(' — ')}
                                  {p.rating ? ` — ${p.rating.toFixed(1)}/5 (${p.reviews} avis)` : ''}
                                </div>
                              </div>
                              {p.is_verified && (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                  Verifie
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedProvider && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">{selectedProvider.name}</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        {selectedProvider.is_verified ? 'Artisan verifie' : 'Artisan reference'} — {selectedProvider.specialty || 'Artisan'} {selectedProvider.city ? `a ${selectedProvider.city}` : ''}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}

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
              <div className={`rounded-xl border p-8 flex items-center justify-center min-h-[160px] ${style === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewBadgeUrl}
                  alt={`Badge ${displayName}`}
                  width={parseInt(badgeW)}
                  height={parseInt(badgeH)}
                  className="max-w-full h-auto"
                />
              </div>
              {isVerifiedBadge && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Donnees en temps reel depuis votre fiche ServicesArtisans
                </p>
              )}
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
            {isVerifiedBadge && ' Les donnees se mettent a jour automatiquement.'}
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
                icon: Search,
                title: 'Trouvez votre fiche',
                desc: "Recherchez votre entreprise dans notre base ou creez un badge personnalise avec vos informations.",
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
                title: 'Badge actif !',
                desc: "Le badge apparait avec vos vraies donnees. Note et avis se mettent a jour automatiquement.",
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

      {/* Benefits — enhanced for link building motivation */}
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
                desc: "Le badge \"Artisan Verifie\" rassure instantanement vos visiteurs. 73 % des internautes declarent faire davantage confiance aux sites avec un badge de verification.",
              },
              {
                icon: TrendingUp,
                title: 'Boostez votre referencement SEO',
                desc: "Le badge inclut un lien vers votre fiche ServicesArtisans, ce qui ameliore votre visibilite sur Google. C'est un backlink gratuit et permanent.",
              },
              {
                icon: Users,
                title: 'Plus de demandes de devis',
                desc: "Les artisans qui affichent un badge de confiance recoivent en moyenne 35 % de demandes de contact en plus sur leur site.",
              },
              {
                icon: Sparkles,
                title: 'Donnees en temps reel',
                desc: "Votre note, nombre d'avis et statut de verification se mettent a jour automatiquement. Aucune maintenance requise de votre part.",
              },
              {
                icon: ExternalLink,
                title: 'Gratuit et sans engagement',
                desc: "Le badge est 100 % gratuit. Aucun abonnement, aucun frais cache. Vous pouvez le retirer a tout moment.",
              },
              {
                icon: Globe,
                title: 'Compatible avec tous les sites',
                desc: "Le badge fonctionne sur WordPress, Wix, Squarespace, Shopify, Webflow et tout site acceptant du HTML. Moins de 3 Ko, zero JavaScript.",
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
