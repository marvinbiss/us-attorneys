interface InternalLink {
  text: string
  href: string
}

/**
 * Maps keywords found in article slugs and tags to their corresponding
 * service pages. Used to generate contextual "Services associés" links.
 */
const serviceMapping: Record<string, { slug: string; label: string }> = {
  // Plombier / Plomberie
  'plombier': { slug: 'plombier', label: 'plombier' },
  'plomberie': { slug: 'plombier', label: 'plombier' },
  'canalisations': { slug: 'plombier', label: 'plombier' },
  // Électricien / Électricité
  'électricien': { slug: 'electricien', label: 'électricien' },
  'electricien': { slug: 'electricien', label: 'électricien' },
  'électricité': { slug: 'electricien', label: 'électricien' },
  'electricite': { slug: 'electricien', label: 'électricien' },
  'domotique': { slug: 'electricien', label: 'électricien' },
  // Serrurier / Serrurerie
  'serrurier': { slug: 'serrurier', label: 'serrurier' },
  'serrurerie': { slug: 'serrurier', label: 'serrurier' },
  'serrure': { slug: 'serrurier', label: 'serrurier' },
  // Chauffagiste / Chauffage
  'chauffagiste': { slug: 'chauffagiste', label: 'chauffagiste' },
  'chauffage': { slug: 'chauffagiste', label: 'chauffagiste' },
  'chaudière': { slug: 'chauffagiste', label: 'chauffagiste' },
  'chaudiere': { slug: 'chauffagiste', label: 'chauffagiste' },
  'pompe à chaleur': { slug: 'chauffagiste', label: 'chauffagiste' },
  'pompe-a-chaleur': { slug: 'chauffagiste', label: 'chauffagiste' },
  // Menuisier / Menuiserie
  'menuisier': { slug: 'menuisier', label: 'menuisier' },
  'menuiserie': { slug: 'menuisier', label: 'menuisier' },
  'fenêtre': { slug: 'menuisier', label: 'menuisier' },
  'fenêtres': { slug: 'menuisier', label: 'menuisier' },
  'fenetres': { slug: 'menuisier', label: 'menuisier' },
  // Carreleur / Carrelage
  'carreleur': { slug: 'carreleur', label: 'carreleur' },
  'carrelage': { slug: 'carreleur', label: 'carreleur' },
  // Couvreur / Toiture
  'couvreur': { slug: 'couvreur', label: 'couvreur' },
  'toiture': { slug: 'couvreur', label: 'couvreur' },
  'couverture': { slug: 'couvreur', label: 'couvreur' },
  // Peintre en bâtiment
  'peintre': { slug: 'peintre-en-batiment', label: 'peintre en bâtiment' },
  'peinture': { slug: 'peintre-en-batiment', label: 'peintre en bâtiment' },
  'ravalement': { slug: 'peintre-en-batiment', label: 'peintre en bâtiment' },
  'façade': { slug: 'peintre-en-batiment', label: 'peintre en bâtiment' },
  // Maçon / Maçonnerie
  'maçon': { slug: 'macon', label: 'maçon' },
  'macon': { slug: 'macon', label: 'maçon' },
  'maçonnerie': { slug: 'macon', label: 'maçon' },
  'maconnerie': { slug: 'macon', label: 'maçon' },
  'gros œuvre': { slug: 'macon', label: 'maçon' },
  // Climaticien / Climatisation
  'climaticien': { slug: 'climaticien', label: 'climaticien' },
  'climatisation': { slug: 'climaticien', label: 'climaticien' },
  'pac air-air': { slug: 'climaticien', label: 'climaticien' },
  // Jardinier paysagiste
  'jardinier': { slug: 'jardinier-paysagiste', label: 'jardinier paysagiste' },
  'paysagiste': { slug: 'jardinier-paysagiste', label: 'jardinier paysagiste' },
  'jardin': { slug: 'jardinier-paysagiste', label: 'jardinier paysagiste' },
  'paysagisme': { slug: 'jardinier-paysagiste', label: 'jardinier paysagiste' },
  // Vitrier
  'vitrier': { slug: 'vitrier', label: 'vitrier' },
  'vitrerie': { slug: 'vitrier', label: 'vitrier' },
  'vitrage': { slug: 'vitrier', label: 'vitrier' },
  'double vitrage': { slug: 'vitrier', label: 'vitrier' },
  // Cuisiniste
  'cuisiniste': { slug: 'cuisiniste', label: 'cuisiniste' },
  'cuisine': { slug: 'cuisiniste', label: 'cuisiniste' },
  // Solier / Moquettiste
  'solier': { slug: 'solier-moquettiste', label: 'solier moquettiste' },
  'parquet': { slug: 'solier-moquettiste', label: 'solier moquettiste' },
  'revêtement de sol': { slug: 'solier-moquettiste', label: 'solier moquettiste' },
  // Entreprise de nettoyage
  'nettoyage': { slug: 'entreprise-de-nettoyage', label: 'entreprise de nettoyage' },
}

/**
 * Determines which service pages are relevant for a given article
 * based on its slug, category and tags.
 */
export function getRelatedServiceLinks(
  slug: string,
  category: string,
  tags: string[]
): InternalLink[] {
  const links: InternalLink[] = []
  const addedSlugs = new Set<string>()

  // Build search terms from the slug (split on hyphens) and lowered tags
  const slugWords = slug.toLowerCase()
  const searchTerms = [slugWords, ...tags.map((t) => t.toLowerCase())]

  // Top 5 cities for service×ville cross-links
  const TOP_CITIES = [
    { name: 'Paris', slug: 'paris' },
    { name: 'Lyon', slug: 'lyon' },
    { name: 'Marseille', slug: 'marseille' },
    { name: 'Toulouse', slug: 'toulouse' },
    { name: 'Nice', slug: 'nice' },
  ]

  let firstServiceSlug: string | null = null

  for (const term of searchTerms) {
    for (const [keyword, service] of Object.entries(serviceMapping)) {
      if (term.includes(keyword) && !addedSlugs.has(service.slug)) {
        links.push({
          text: `Trouver un ${service.label} qualifié`,
          href: `/services/${service.slug}`,
        })
        // Add top-city variants for the first matched service only
        if (!firstServiceSlug) {
          firstServiceSlug = service.slug
          for (const city of TOP_CITIES) {
            links.push({
              text: `${service.label.charAt(0).toUpperCase() + service.label.slice(1)} à ${city.name}`,
              href: `/services/${service.slug}/${city.slug}`,
            })
          }
        }
        addedSlugs.add(service.slug)
      }
    }
  }

  // Always add devis link for Tarifs articles
  if (category === 'Tarifs') {
    links.push({ text: 'Demander un devis gratuit', href: '/devis' })
  }

  // Add general links based on category
  if (category === 'Réglementation' || category === 'Aides & Subventions') {
    links.push({ text: 'Comment ça marche ?', href: '/comment-ca-marche' })
  }

  if (category === 'Fiches métier') {
    links.push({ text: 'Devenir artisan partenaire', href: '/inscription-artisan' })
  }

  // Add urgence link when relevant
  if (
    tags.some((t) => t.toLowerCase() === 'urgence') ||
    slug.includes('urgence') ||
    slug.includes('depannage')
  ) {
    links.push({ text: 'Artisan en urgence', href: '/urgence' })
  }

  // Limit to 5 links max
  return links.slice(0, 5)
}

interface ArticleMeta {
  category: string
  tags: string[]
  title: string
  readTime?: string
}

/**
 * Scores and selects the most relevant related articles based on
 * shared category and overlapping tags.
 */
export function getRelatedArticleSlugs(
  currentSlug: string,
  category: string,
  tags: string[],
  allSlugs: string[],
  allArticlesMap: Record<string, ArticleMeta>
): { slug: string; title: string; category: string; readTime: string }[] {
  const currentTags = tags.map((t) => t.toLowerCase())

  const scored = allSlugs
    .filter((s) => s !== currentSlug)
    .map((s) => {
      const article = allArticlesMap[s]
      if (!article) return { slug: s, title: '', category: '', readTime: '', score: 0 }

      let score = 0

      // Same category => +2
      if (article.category === category) score += 2

      // Each overlapping tag => +3
      const articleTags = article.tags.map((t) => t.toLowerCase())
      for (const tag of articleTags) {
        if (currentTags.includes(tag)) score += 3
      }

      return { slug: s, title: article.title, category: article.category, readTime: article.readTime || '', score }
    })
    .filter((s) => s.score > 0 && s.title)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  return scored
}
