import { existingArticles } from './existing-articles'
import { prixArticles } from './batch-prix'
import { metiersArticles } from './batch-metiers'
import { projetsArticles } from './batch-projets'
import { conseilsArticles } from './batch-conseils'
import { reglementationArticles } from './batch-reglementation'
import { seoBoost1Articles } from './batch-seo-boost1'
import { batchSeoBoost2Articles } from './batch-seo-boost2'
import { batchSeoBoost3Articles } from './batch-seo-boost3'
import { metiers3Articles } from './batch-metiers-3'
import { metiers4Articles } from './batch-metiers-4'
import { securiteEnergieArticles } from './batch-securite-energie'
import { aidesSaisonnierArticles } from './batch-aides-saisonnier'
import { guidesDiversArticles } from './batch-guides-divers'
import { saisonnierArticles } from './batch-saisonnier'
import { inspirationArticles } from './batch-inspiration'
import { diyArticles } from './batch-diy'
import { energieArticles } from './batch-energie-2026'
import { renovationArticles } from './batch-renovation-2026'

export interface BlogArticle {
  title: string
  excerpt: string
  content: string[]
  image: string
  author: string
  date: string
  readTime: string
  category: string
  tags: string[]
  authorBio?: string
  updatedDate?: string
  keyTakeaways?: string[]
  faq?: { question: string; answer: string }[]
}

/** Every blog article keyed by slug */
export const allArticles: Record<string, BlogArticle> = {
  ...existingArticles,
  ...prixArticles,
  ...metiersArticles,
  ...projetsArticles,
  ...conseilsArticles,
  ...reglementationArticles,
  ...seoBoost1Articles,
  ...batchSeoBoost2Articles,
  ...batchSeoBoost3Articles,
  ...metiers3Articles,
  ...metiers4Articles,
  ...securiteEnergieArticles,
  ...aidesSaisonnierArticles,
  ...guidesDiversArticles,
  ...saisonnierArticles,
  ...inspirationArticles,
  ...diyArticles,
  ...energieArticles,
  ...renovationArticles,
}

/** All slugs for generateStaticParams */
export const articleSlugs: string[] = Object.keys(allArticles)
