import { existingArticles } from './existing-articles'
import { prixArticles } from './batch-prix'
import { metiersArticles } from './batch-metiers'
import { projetsArticles } from './batch-projets'
import { conseilsArticles } from './batch-conseils'
import { reglementationArticles } from './batch-reglementation'
import { seoBoost1Articles } from './batch-seo-boost1'
import { batchSeoBoost2Articles } from './batch-seo-boost2'
import { batchSeoBoost3Articles } from './batch-seo-boost3'

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
}

/** All slugs for generateStaticParams */
export const articleSlugs: string[] = Object.keys(allArticles)
