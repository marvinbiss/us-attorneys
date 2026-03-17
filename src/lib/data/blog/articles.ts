import { existingArticles } from './existing-articles'
import { pricingArticles } from './batch-pricing'
import { practiceAreaArticles } from './batch-practice-areas'
import { projectArticles } from './batch-projets'
import { tipsArticles } from './batch-tips'
import { legalRegulationArticles } from './batch-reglementation'
import { seoBoost1Articles } from './batch-seo-boost1'
import { batchSeoBoost2Articles } from './batch-seo-boost2'
import { batchSeoBoost3Articles } from './batch-seo-boost3'
import { practiceArea3Articles } from './batch-practice-areas-3'
import { practiceArea4Articles } from './batch-practice-areas-4'
import { energySafetyArticles } from './batch-securite-energie'
import { seasonalAidArticles } from './batch-aides-saisonnier'
import { miscGuidesArticles } from './batch-guides-divers'
import { seasonalArticles } from './batch-saisonnier'
import { inspirationArticles } from './batch-inspiration'
import { diyArticles } from './batch-diy'
import { energy2026Articles } from './batch-energie-2026'
import { renovation2026Articles } from './batch-renovation-2026'
import { productsArticles } from './batch-produits-materiaux'
import { diyTutorial2Articles } from './batch-tutoriels-diy-2'
import { diyTutorialArticles } from './batch-tutoriels-diy'
import { seasonalUrgencyArticles } from './batch-saisonnier-urgence'
import { regionalPricingArticles } from './batch-regional-pricing'
import { comparisonsArticles } from './batch-comparatifs-materiaux'

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
  ...pricingArticles,
  ...practiceAreaArticles,
  ...projectArticles,
  ...tipsArticles,
  ...legalRegulationArticles,
  ...seoBoost1Articles,
  ...batchSeoBoost2Articles,
  ...batchSeoBoost3Articles,
  ...practiceArea3Articles,
  ...practiceArea4Articles,
  ...energySafetyArticles,
  ...seasonalAidArticles,
  ...miscGuidesArticles,
  ...seasonalArticles,
  ...inspirationArticles,
  ...diyArticles,
  ...energy2026Articles,
  ...renovation2026Articles,
  ...productsArticles,
  ...diyTutorial2Articles,
  ...diyTutorialArticles,
  ...seasonalUrgencyArticles,
  ...regionalPricingArticles,
  ...comparisonsArticles,
}

/** All slugs for generateStaticParams */
export const articleSlugs: string[] = Object.keys(allArticles)
