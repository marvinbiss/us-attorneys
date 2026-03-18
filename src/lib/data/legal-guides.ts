// Legal Guides — Practice Area x State programmatic content
// Generates ~4,275 unique guide pages (75 PAs x 57 states/territories)

import { practiceAreas, states } from '@/lib/data/usa'
import {
  getStatuteOfLimitations,
  getStateAvgHourlyRate,
  getStateAttorneyCount,
  PA_TO_SOL_CATEGORY,
} from '@/lib/data/state-legal-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuideSection {
  heading: string
  content: string
}

export interface LegalGuide {
  specialtySlug: string
  stateCode: string
  title: string
  sections: GuideSection[]
}

// ---------------------------------------------------------------------------
// Practice-area-specific content fragments
// ---------------------------------------------------------------------------

interface PAContentTemplate {
  /** Practice area categories that this template applies to (matched by slug prefix or exact slug) */
  slugPatterns: string[]
  /** Extra sections specific to this PA category */
  extraSections: (specialtyName: string, stateName: string) => GuideSection[]
}

const PA_TEMPLATES: PAContentTemplate[] = [
  {
    slugPatterns: ['personal-injury', 'car-accidents', 'truck-accidents', 'motorcycle-accidents', 'slip-and-fall', 'medical-malpractice', 'wrongful-death', 'product-liability', 'nursing-home-abuse'],
    extraSections: (pa, state) => [
      { heading: `Types of ${pa} Cases in ${state}`, content: `${state} sees a wide range of ${pa.toLowerCase()} cases. Common scenarios include workplace incidents, motor vehicle accidents, premises liability, and medical negligence. Each type of case has specific legal requirements and potential damages that an experienced attorney can help you navigate. ${state} courts have specific rules about evidence presentation, expert testimony requirements, and damage calculations that differ from other states.` },
      { heading: `Compensation in ${pa} Cases in ${state}`, content: `In ${state}, victims of ${pa.toLowerCase()} may be entitled to economic damages (medical bills, lost wages, property damage), non-economic damages (pain and suffering, emotional distress), and in some cases punitive damages. The average settlement varies widely depending on the severity of injuries, available insurance coverage, and the strength of the evidence. Working with a local attorney who understands ${state} jury tendencies and insurance company tactics is essential to maximizing your recovery.` },
    ],
  },
  {
    slugPatterns: ['criminal-defense', 'dui-dwi', 'drug-crimes', 'white-collar-crime', 'federal-crimes', 'juvenile-crimes', 'sex-crimes', 'theft-robbery', 'violent-crimes', 'traffic-violations'],
    extraSections: (pa, state) => [
      { heading: `${pa} Penalties in ${state}`, content: `${state} has specific sentencing guidelines for ${pa.toLowerCase()} charges. Penalties can include fines, probation, community service, mandatory counseling, and imprisonment. The severity depends on the nature of the offense, prior criminal history, and aggravating or mitigating factors. ${state} may also have mandatory minimum sentences for certain offenses. An experienced defense attorney can explore alternatives such as diversion programs, plea agreements, or reduced charges.` },
      { heading: `Your Rights When Facing ${pa} Charges in ${state}`, content: `If you are charged with ${pa.toLowerCase()} in ${state}, you have constitutional rights including the right to remain silent, the right to an attorney, the right to a fair trial, and the right to confront witnesses. ${state} law may provide additional protections. It is critical to exercise these rights from the moment of arrest. Do not make statements to law enforcement without an attorney present.` },
    ],
  },
  {
    slugPatterns: ['divorce', 'child-custody', 'child-support', 'adoption', 'alimony-spousal-support', 'domestic-violence', 'prenuptial-agreements', 'paternity'],
    extraSections: (pa, state) => [
      { heading: `${pa} Laws in ${state}`, content: `${state} family courts handle ${pa.toLowerCase()} cases under state-specific statutes. Key factors include residency requirements, filing procedures, and the "best interest of the child" standard used in custody determinations. ${state} may be a community property state or an equitable distribution state, which significantly affects how assets are divided. Understanding your state's specific approach is critical to protecting your interests.` },
      { heading: `${pa} Process Timeline in ${state}`, content: `The ${pa.toLowerCase()} process in ${state} typically takes 3 to 18 months depending on complexity and whether the parties reach an agreement. ${state} may require mandatory waiting periods, mediation, or parenting classes. Contested cases involving custody disputes, significant assets, or allegations of abuse generally take longer. An experienced family law attorney can help expedite the process while protecting your rights.` },
    ],
  },
  {
    slugPatterns: ['business-law', 'corporate-law', 'mergers-acquisitions', 'contract-law', 'business-litigation', 'intellectual-property', 'trademark', 'patent', 'copyright'],
    extraSections: (pa, state) => [
      { heading: `${pa} Regulations in ${state}`, content: `${state} has specific regulations governing ${pa.toLowerCase()} matters, including registration requirements, reporting obligations, and compliance standards. Businesses operating in ${state} must comply with both federal and state laws. ${state}'s Secretary of State office and regulatory agencies provide guidance on specific requirements. Working with a ${pa.toLowerCase()} attorney familiar with ${state} regulations helps ensure compliance and avoid costly legal issues.` },
      { heading: `Common ${pa} Disputes in ${state}`, content: `${pa} disputes in ${state} frequently involve contract breaches, partnership disagreements, employment issues, and regulatory compliance. ${state} courts and arbitration forums handle these disputes according to state-specific procedural rules. Alternative dispute resolution methods such as mediation and arbitration are increasingly popular in ${state} for business matters, often resulting in faster and less costly resolutions.` },
    ],
  },
  {
    slugPatterns: ['immigration-law', 'green-cards', 'visa-applications', 'deportation-defense', 'asylum', 'citizenship-naturalization'],
    extraSections: (pa, state) => [
      { heading: `Immigration Resources in ${state}`, content: `${state} has several immigration courts, USCIS field offices, and legal aid organizations that provide ${pa.toLowerCase()} services. The local USCIS office handles applications, interviews, and naturalizations. ${state} may also have state-specific immigration-related laws affecting driver's licenses, employment verification, and law enforcement cooperation with federal immigration authorities. Knowing the local resources and legal landscape is essential.` },
      { heading: `Finding ${pa} Help in ${state}`, content: `${state} has a growing community of ${pa.toLowerCase()} attorneys, including private practitioners, nonprofit legal aid organizations, and law school clinics. Many offer free or low-cost consultations. For urgent matters such as deportation defense or asylum applications, ${state} has pro bono attorney networks and immigrant rights organizations that can provide immediate assistance. The American Immigration Lawyers Association (AILA) chapter in ${state} maintains a referral directory.` },
    ],
  },
  {
    slugPatterns: ['estate-planning', 'wills-trusts', 'probate', 'elder-law', 'guardianship'],
    extraSections: (pa, state) => [
      { heading: `${pa} Requirements in ${state}`, content: `${state} has specific requirements for ${pa.toLowerCase()} documents, including witness requirements, notarization, and filing procedures. ${state}'s probate code governs how estates are administered, how trusts are created and managed, and how disputes are resolved. Some states use the Uniform Probate Code while others have their own statutes. Understanding ${state}'s specific requirements is essential to creating valid and enforceable estate planning documents.` },
      { heading: `${pa} Tax Implications in ${state}`, content: `Estate and inheritance tax laws vary significantly by state. ${state} may impose its own estate tax or inheritance tax in addition to the federal estate tax. These state-level taxes can significantly affect estate planning strategies. A ${pa.toLowerCase()} attorney in ${state} can help structure your estate plan to minimize tax liability while achieving your goals for asset distribution and family protection.` },
    ],
  },
  {
    slugPatterns: ['bankruptcy', 'chapter-7-bankruptcy', 'chapter-13-bankruptcy', 'debt-relief'],
    extraSections: (pa, state) => [
      { heading: `${pa} Exemptions in ${state}`, content: `${state} has its own bankruptcy exemptions that determine what property you can keep when filing for bankruptcy. These exemptions cover your home (homestead exemption), vehicle, personal property, retirement accounts, and tools of trade. Some states allow filers to choose between state and federal exemptions, while others require the use of state exemptions only. Understanding ${state}'s specific exemptions is critical to protecting your assets.` },
      { heading: `${pa} Courts in ${state}`, content: `Bankruptcy cases in ${state} are handled by the United States Bankruptcy Court. ${state} falls within a specific federal judicial district and circuit, which determines the court procedures and legal precedents that apply. The bankruptcy trustee assigned to your case will review your filing, and you must attend a meeting of creditors (341 meeting) at the courthouse. Having an attorney familiar with the local bankruptcy court's practices and the preferences of specific judges and trustees is a significant advantage.` },
    ],
  },
]

function getPATemplate(specialtySlug: string): PAContentTemplate | undefined {
  return PA_TEMPLATES.find(t => t.slugPatterns.includes(specialtySlug))
}

// ---------------------------------------------------------------------------
// Core content generator
// ---------------------------------------------------------------------------

/**
 * Generate legal guide content for a practice area x state combination.
 * Returns structured sections suitable for rendering as a long-form article.
 */
export function generateGuideContent(
  specialtySlug: string,
  stateCode: string,
  stateName: string,
  specialtyName: string,
): LegalGuide {
  const year = new Date().getFullYear()

  const sections: GuideSection[] = [
    // Section 1: Overview
    {
      heading: `Overview of ${specialtyName} Law in ${stateName}`,
      content: `${specialtyName} law in ${stateName} encompasses a broad range of legal issues that affect individuals and businesses across the state. ${stateName} has its own statutes, case law precedents, and court procedures that govern how ${specialtyName.toLowerCase()} matters are handled. Whether you are dealing with a new legal issue or an ongoing matter, understanding ${stateName}'s specific legal framework is essential. The state's bar association, court system, and legal aid organizations provide resources for individuals seeking ${specialtyName.toLowerCase()} legal assistance. As of ${year}, ${stateName} continues to update its laws and regulations to address evolving legal challenges in this practice area.`,
    },

    // Section 2: How to find an attorney
    {
      heading: `How to Find a ${specialtyName} Lawyer in ${stateName}`,
      content: `Finding the right ${specialtyName.toLowerCase()} attorney in ${stateName} requires research and due diligence. Start by checking the ${stateName} State Bar Association's lawyer directory, which lists all attorneys licensed to practice in the state along with their disciplinary history. Look for attorneys who specialize in ${specialtyName.toLowerCase()} and have experience handling cases similar to yours. Read client reviews, check their track record, and verify their bar status. Many ${specialtyName.toLowerCase()} attorneys in ${stateName} offer free initial consultations, allowing you to evaluate their expertise and communication style before committing. Ask about their fee structure (hourly, flat fee, or contingency), their caseload, and their approach to your specific situation. The best attorney for your case will have deep knowledge of ${stateName} law, a proven track record, and a communication style that puts you at ease.`,
    },

    // Section 3: Average costs (with real data)
    {
      heading: `Average Cost of a ${specialtyName} Attorney in ${stateName}`,
      content: (() => {
        const avgRate = getStateAvgHourlyRate(stateCode)
        const lowRate = Math.round(avgRate * 0.6)
        const highRate = Math.round(avgRate * 1.6)
        return `The average hourly rate for attorneys in ${stateName} is approximately $${avgRate} per hour. For ${specialtyName.toLowerCase()} cases specifically, rates typically range from $${lowRate} to $${highRate} per hour depending on the attorney's experience, reputation, and location within the state. Attorneys in major metropolitan areas tend to charge higher rates than those in rural areas. Some ${specialtyName.toLowerCase()} attorneys work on a contingency fee basis (typically 33-40% of the recovery), meaning you pay nothing upfront and the attorney takes a percentage of any settlement or verdict. Others charge flat fees for straightforward matters. Many attorneys in ${stateName} also offer payment plans or sliding-scale fees based on income. Always get a written fee agreement before hiring an attorney and make sure you understand all potential costs, including court filing fees, expert witness fees, and other expenses.`
      })(),
    },

    // Section 4: Statute of Limitations (with real data)
    {
      heading: `Statute of Limitations for ${specialtyName} in ${stateName}`,
      content: (() => {
        const sol = getStatuteOfLimitations(specialtySlug, stateCode)
        const solCategory = PA_TO_SOL_CATEGORY[specialtySlug] ?? 'personal-injury'
        return `In ${stateName}, the statute of limitations for ${specialtyName.toLowerCase()} cases is ${sol} ${sol === 1 ? 'year' : 'years'} from the date the cause of action accrues. This falls under the "${solCategory.replace(/-/g, ' ')}" category in ${stateName} law. Missing this deadline will almost certainly result in your case being dismissed. Some exceptions may extend or "toll" the deadline, such as: (1) The discovery rule, which starts the clock when you discover or should have discovered the injury. (2) Minority tolling, which pauses the deadline for plaintiffs who are under 18. (3) Defendant absence from the state, which may pause the clock while the defendant is outside ${stateName}. (4) Mental incapacity of the plaintiff. It is critical to consult a ${specialtyName.toLowerCase()} attorney in ${stateName} as soon as possible to ensure your claim is filed within the ${sol}-year deadline. Do not rely on exceptions without professional legal advice.`
      })(),
    },

    // Section 5: Filing Fees
    {
      heading: `Filing Fees and Court Costs in ${stateName}`,
      content: `Court filing fees in ${stateName} vary by court level and case type. Civil filing fees in state courts typically range from $50 to $400 depending on the type of action and the amount in controversy. Additional costs may include service of process fees ($20-$100), deposition costs, expert witness fees, and mediation fees. In some ${specialtyName.toLowerCase()} cases, the court may award attorney fees and costs to the prevailing party. If you cannot afford filing fees, ${stateName} courts offer fee waiver applications (often called "in forma pauperis" petitions) for qualifying individuals. Your attorney can help you understand the total expected costs of your case and whether any costs can be recovered.`,
    },

    // Section 6: When to hire
    {
      heading: `When to Hire a ${specialtyName} Lawyer in ${stateName}`,
      content: `You should consider hiring a ${specialtyName.toLowerCase()} attorney in ${stateName} when: (1) You are facing a legal situation with significant financial, liberty, or family consequences. (2) The opposing party has legal representation. (3) You need to meet a filing deadline or respond to a legal action. (4) You are unsure of your rights or legal options under ${stateName} law. (5) Negotiations with an insurance company or opposing party have stalled. (6) You have received a demand letter, summons, or other legal document. (7) You need to draft or review important legal documents. While not every legal situation requires an attorney, having professional guidance for complex matters can prevent costly mistakes and protect your interests. Many ${specialtyName.toLowerCase()} attorneys in ${stateName} offer free consultations to help you assess whether you need legal representation.`,
    },

    // Section 7: Questions to Ask
    {
      heading: `Questions to Ask Your ${specialtyName} Attorney in ${stateName}`,
      content: `When interviewing ${specialtyName.toLowerCase()} attorneys in ${stateName}, ask these essential questions: How many years have you practiced ${specialtyName.toLowerCase()} law in ${stateName}? What percentage of your practice is dedicated to this area? Have you handled cases similar to mine, and what were the outcomes? What is your fee structure, and what costs should I expect? How will you communicate with me about my case? What is the likely timeline for my case? What are the strengths and weaknesses of my case? Will you personally handle my case, or will it be delegated to associates or paralegals? Can you provide references from past clients? Are you familiar with the specific courts and judges in my jurisdiction? A thorough initial consultation should give you confidence in your attorney's expertise and approach.`,
    },
  ]

  // Add PA-specific sections
  const template = getPATemplate(specialtySlug)
  if (template) {
    sections.push(...template.extraSections(specialtyName, stateName))
  }

  // Section: Free & Low-Cost Resources
  sections.push({
    heading: `Free and Low-Cost ${specialtyName} Legal Resources in ${stateName}`,
    content: `If you cannot afford a private attorney, ${stateName} offers several free and low-cost legal resources. The ${stateName} Legal Aid Society provides free legal assistance to qualifying low-income individuals. The state bar association operates a lawyer referral service with reduced-fee initial consultations. Law school clinics at universities in ${stateName} often provide free legal help under attorney supervision. Additionally, ${stateName} courts offer self-help centers with forms, instructions, and guidance for people representing themselves. Pro bono attorneys through the American Bar Association and local volunteer lawyer programs are also available for qualifying cases.`,
  })

  return {
    specialtySlug,
    stateCode,
    title: `${specialtyName} Law in ${stateName}: Complete ${year} Guide`,
    sections,
  }
}

// ---------------------------------------------------------------------------
// Static params helpers
// ---------------------------------------------------------------------------

/** All valid PA slugs */
export const LEGAL_GUIDE_PA_SLUGS = practiceAreas.map(p => p.slug)

/** All valid state slugs */
export const LEGAL_GUIDE_STATE_SLUGS = states.map(s => s.slug)

/** Total guide count: 75 PAs × 57 states = 4,275 */
export const LEGAL_GUIDE_TOTAL = LEGAL_GUIDE_PA_SLUGS.length * LEGAL_GUIDE_STATE_SLUGS.length

/**
 * Top 10 PAs × top 10 states = 100 seed pages for generateStaticParams
 */
export function getLegalGuideSeedParams(): { type: string; state: string }[] {
  const topPAs = LEGAL_GUIDE_PA_SLUGS.slice(0, 10)
  const topStates = LEGAL_GUIDE_STATE_SLUGS.slice(0, 10)
  const params: { type: string; state: string }[] = []
  for (const pa of topPAs) {
    for (const st of topStates) {
      params.push({ type: pa, state: st })
    }
  }
  return params
}

/**
 * Check if a slug is a legal guide PA slug (vs. an existing "how-to" guide type)
 */
export function isLegalGuidePASlug(slug: string): boolean {
  return LEGAL_GUIDE_PA_SLUGS.includes(slug)
}

/**
 * Get PA name from slug
 */
export function getPANameBySlug(slug: string): string | undefined {
  return practiceAreas.find(p => p.slug === slug)?.name
}

// ---------------------------------------------------------------------------
// FAQ generators — for FAQ schema + rendering
// ---------------------------------------------------------------------------

/**
 * Generate state-specific FAQ pairs for a PA x State guide page.
 * Used in JSON-LD FAQPage schema and on-page rendering.
 */
export function getGuideFAQs(
  specialtySlug: string,
  specialtyName: string,
  stateCode: string,
  stateName: string,
): { question: string; answer: string }[] {
  const sol = getStatuteOfLimitations(specialtySlug, stateCode)
  const rate = getStateAvgHourlyRate(stateCode)
  const count = getStateAttorneyCount(stateCode)
  const solCategory = PA_TO_SOL_CATEGORY[specialtySlug] ?? 'personal-injury'
  const year = new Date().getFullYear()

  return [
    {
      question: `What is the statute of limitations for ${specialtyName.toLowerCase()} cases in ${stateName}?`,
      answer: `In ${stateName}, the statute of limitations for ${specialtyName.toLowerCase()} cases (categorized as "${solCategory.replace(/-/g, ' ')}") is ${sol} ${sol === 1 ? 'year' : 'years'}. This means you must file your claim within ${sol} ${sol === 1 ? 'year' : 'years'} of the date the cause of action accrues. Certain exceptions may extend this deadline, such as the discovery rule, minority tolling, or defendant absence from the state. Consult an attorney immediately to ensure you do not miss your filing deadline.`,
    },
    {
      question: `How much does a ${specialtyName.toLowerCase()} attorney cost in ${stateName}?`,
      answer: `The average hourly rate for attorneys in ${stateName} is approximately $${rate} per hour as of ${year}. However, ${specialtyName.toLowerCase()} attorney fees vary based on experience, case complexity, and location within the state. Many attorneys offer free initial consultations, and some work on contingency (typically 33-40% of recovery), meaning you pay nothing unless you win. Flat fees are available for simpler matters. Always request a written fee agreement before hiring.`,
    },
    {
      question: `How many ${specialtyName.toLowerCase()} attorneys practice in ${stateName}?`,
      answer: `${stateName} has approximately ${count.toLocaleString()} active licensed attorneys across all practice areas. While not all specialize in ${specialtyName.toLowerCase()}, many have experience handling these types of cases. Use the ${stateName} State Bar Association directory to find attorneys who specifically practice ${specialtyName.toLowerCase()} law and verify their bar status and disciplinary history.`,
    },
    {
      question: `Do I need a ${specialtyName.toLowerCase()} attorney in ${stateName}, or can I represent myself?`,
      answer: `While you have the right to represent yourself (pro se) in ${stateName} courts, ${specialtyName.toLowerCase()} cases often involve complex legal procedures, evidence rules, and negotiation tactics that require professional expertise. An experienced attorney understands ${stateName}-specific laws, court procedures, and opposing counsel strategies. Studies show that individuals with legal representation typically achieve better outcomes. Most ${specialtyName.toLowerCase()} attorneys in ${stateName} offer free consultations to help you assess your case.`,
    },
    {
      question: `What should I look for when hiring a ${specialtyName.toLowerCase()} lawyer in ${stateName}?`,
      answer: `When selecting a ${specialtyName.toLowerCase()} attorney in ${stateName}, consider: (1) Years of experience specifically in ${specialtyName.toLowerCase()} law. (2) Track record with cases similar to yours. (3) Active bar membership in good standing with no disciplinary actions. (4) Positive client reviews and peer recognition. (5) Clear communication about fees, strategy, and timeline. (6) Familiarity with the specific courts and judges in your jurisdiction. (7) Willingness to provide references. Always verify an attorney's credentials through the ${stateName} State Bar before hiring.`,
    },
  ]
}

/**
 * Generate FAQ pairs for a specialty hub page (national overview).
 */
export function getGuideHubFAQs(
  specialtySlug: string,
  specialtyName: string,
): { question: string; answer: string }[] {
  const solCategory = PA_TO_SOL_CATEGORY[specialtySlug] ?? 'personal-injury'

  return [
    {
      question: `What is ${specialtyName.toLowerCase()} law?`,
      answer: `${specialtyName} law is a practice area that deals with legal matters related to ${specialtyName.toLowerCase()}. It encompasses a wide range of issues including disputes, claims, regulatory compliance, and legal proceedings specific to this area. Each state has its own statutes, case law, and court procedures that govern ${specialtyName.toLowerCase()} matters, making it important to work with an attorney licensed in your state.`,
    },
    {
      question: `Does the statute of limitations for ${specialtyName.toLowerCase()} cases vary by state?`,
      answer: `Yes, the statute of limitations for ${specialtyName.toLowerCase()} cases varies significantly by state. These deadlines fall under the "${solCategory.replace(/-/g, ' ')}" category and range from 1 to 15 years depending on the state and specific nature of the claim. Missing the filing deadline can permanently bar your claim, so it is critical to consult an attorney in your state as soon as possible.`,
    },
    {
      question: `How much does a ${specialtyName.toLowerCase()} attorney typically charge?`,
      answer: `Attorney fees for ${specialtyName.toLowerCase()} cases vary by state and range from approximately $200 per hour in lower-cost states to over $400 per hour in major legal markets like New York and California. Fee structures include hourly billing, flat fees, and contingency arrangements (where the attorney takes a percentage of any recovery). Many attorneys offer free initial consultations to evaluate your case.`,
    },
    {
      question: `How do I find the best ${specialtyName.toLowerCase()} attorney in my state?`,
      answer: `To find a qualified ${specialtyName.toLowerCase()} attorney: (1) Check your state bar association's lawyer directory for licensed attorneys in good standing. (2) Look for attorneys who focus specifically on ${specialtyName.toLowerCase()} law. (3) Read client reviews and check ratings on legal directories. (4) Request consultations with 2-3 attorneys to compare expertise and communication style. (5) Verify their experience with cases similar to yours and ask about outcomes. (6) Confirm fee structures before hiring.`,
    },
    {
      question: `Can I handle a ${specialtyName.toLowerCase()} case without an attorney?`,
      answer: `While you have the right to represent yourself, ${specialtyName.toLowerCase()} cases often involve complex legal procedures, evidence requirements, and negotiation tactics. An experienced attorney can navigate state-specific laws, protect your rights, and often achieve better outcomes. For complex or high-stakes ${specialtyName.toLowerCase()} matters, legal representation is strongly recommended. Many attorneys offer free consultations to help you assess whether you need representation.`,
    },
    {
      question: `What information should I bring to a ${specialtyName.toLowerCase()} attorney consultation?`,
      answer: `Prepare for your consultation by gathering: (1) A chronological summary of your situation. (2) All relevant documents, contracts, correspondence, and records. (3) Names and contact information of all parties involved. (4) Photos, videos, or other evidence. (5) Police reports or official records if applicable. (6) Medical records and bills if relevant. (7) Insurance policy information. (8) A list of questions about the attorney's experience, fees, and approach to your case.`,
    },
  ]
}
