import { existingArticles } from './existing-articles'
import { prixArticles } from './batch-pricing'
import { metiersArticles } from './batch-practice-areas'
import { projetsArticles } from './batch-projets'
import { conseilsArticles } from './batch-tips'
import { regulationsArticles } from './batch-reglementation'
import { seoBoost1Articles } from './batch-seo-boost1'
import { batchSeoBoost2Articles } from './batch-seo-boost2'
import { batchSeoBoost3Articles } from './batch-seo-boost3'
import { metiers3Articles } from './batch-practice-areas-3'
import { metiers4Articles } from './batch-practice-areas-4'
import { securiteEnergieArticles } from './batch-securite-energie'
import { aidesSaisonnierArticles } from './batch-aides-saisonnier'
import { guidesDiversArticles } from './batch-guides-divers'
import { saisonnierArticles } from './batch-saisonnier'
import { inspirationArticles } from './batch-inspiration'
import { diyArticles } from './batch-diy'
import { energieArticles } from './batch-energie-2026'
import { renovationArticles } from './batch-renovation-2026'
import { produitsArticles } from './batch-produits-materiaux'
import { tutorielsDiy2Articles } from './batch-tutoriels-diy-2'
import { tutorielsDiyArticles } from './batch-tutoriels-diy'
import { saisonnierUrgenceArticles } from './batch-saisonnier-urgence'
import { prixRegionauxArticles } from './batch-regional-pricing'
import { comparatifsArticles } from './batch-comparatifs-materiaux'

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
  ...regulationsArticles,
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
  ...produitsArticles,
  ...tutorielsDiy2Articles,
  ...tutorielsDiyArticles,
  ...saisonnierUrgenceArticles,
  ...prixRegionauxArticles,
  ...comparatifsArticles,
}

/** All slugs for generateStaticParams */
export const articleSlugs: string[] = Object.keys(allArticles)
