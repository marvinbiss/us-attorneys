/**
 * Rich SEO content for each legal practice area.
 * Used on practice area hub pages to add contextual content
 * (pricing guide, FAQ, practical tips).
 */

export interface TradeContent {
  slug: string
  name: string
  priceRange: {
    min: number
    max: number
    unit: string
  }
  commonTasks: string[]
  tips: string[]
  faq: { q: string; a: string }[]
  emergencyInfo?: string
  certifications: string[]
  averageResponseTime: string
}

export const tradeContent: Record<string, TradeContent> = {
  plombier: {
    slug: 'plombier',
    name: 'Personal Injury Law',
    priceRange: {
      min: 33,
      max: 40,
      unit: '% contingency',
    },
    commonTasks: [
      'Car accident injury claim: contingency fee 33% of settlement',
      'Slip and fall case evaluation and filing: contingency fee 33-40%',
      'Medical malpractice lawsuit: contingency fee 33-40%, costs advanced by firm',
      'Product liability claim: contingency fee 33-40%',
      'Wrongful death lawsuit: contingency fee 33-40% of recovery',
      'Dog bite or animal attack claim: contingency fee 33%',
      'Workplace injury claim (third-party): contingency fee 33-40%',
      'Nursing home abuse lawsuit: contingency fee 33-40%',
    ],
    tips: [
      'Most personal injury attorneys work on a contingency fee basis, meaning you pay nothing upfront and the attorney collects a percentage (typically 33-40%) only if you win or settle your case.',
      'Seek medical attention immediately after an injury, even if symptoms seem minor. Medical records are the most critical evidence in any personal injury case.',
      'Do not sign any documents or accept any settlement offers from insurance companies before consulting with a personal injury attorney. Initial offers are almost always far below fair value.',
      'The statute of limitations for personal injury claims varies by state, typically ranging from 1 to 6 years. Missing this deadline permanently bars your claim.',
      'Document everything: take photos of the accident scene, your injuries, and any property damage. Save all medical bills, receipts, and correspondence with insurance companies.',
      'Be cautious about posting on social media after an accident. Insurance companies and defense attorneys routinely monitor plaintiffs\' social media accounts for evidence to use against them.',
      'Ask your attorney about the total estimated cost of litigation, including court filing fees, expert witness fees, and deposition costs, which are typically advanced by the firm and deducted from your settlement.',
      'If your injury prevents you from working, keep detailed records of lost wages and reduced earning capacity. These economic damages can significantly increase your compensation.',
    ],
    faq: [
      {
        q: 'How much does a personal injury lawyer cost?',
        a: 'Most personal injury lawyers work on contingency, meaning you pay nothing upfront. The standard contingency fee is 33% of the settlement if the case resolves before trial, and 40% if the case goes to trial. If you do not win, you owe nothing for attorney fees. However, you may still be responsible for certain litigation costs (filing fees, expert witnesses, medical record retrieval) depending on your fee agreement.',
      },
      {
        q: 'How long does a personal injury case take to resolve?',
        a: 'Simple cases like minor car accidents may settle in 3-6 months once you have reached maximum medical improvement. More complex cases involving serious injuries, disputed liability, or multiple parties can take 1-3 years. Cases that go to trial typically take 2-4 years from the date of injury to verdict. Your attorney can give you a more specific timeline after evaluating the facts of your case.',
      },
      {
        q: 'What is the average settlement for a personal injury case?',
        a: 'Settlement amounts vary enormously depending on the severity of injuries, medical expenses, lost wages, and pain and suffering. Minor soft-tissue injuries may settle for $10,000-$25,000, while cases involving broken bones or surgeries often settle for $50,000-$200,000. Catastrophic injuries (traumatic brain injury, spinal cord injury) can result in settlements of $500,000 to several million dollars.',
      },
      {
        q: 'What should I do immediately after an accident?',
        a: 'First, call 911 and seek medical attention, even for seemingly minor injuries. Document the scene with photos and videos. Exchange information with all parties involved. Get contact details from any witnesses. File a police report. Do not admit fault or apologize. Contact a personal injury attorney before speaking with any insurance company. Preserve all evidence including damaged clothing and property.',
      },
      {
        q: 'Can I still file a claim if I was partially at fault?',
        a: 'In most states, yes. The rules vary by state: some follow "comparative negligence" where your compensation is reduced by your percentage of fault, while others follow "modified comparative negligence" where you can recover only if you are less than 50% or 51% at fault. A few states follow "contributory negligence" where any fault on your part bars recovery entirely. Your attorney can advise based on your state\'s laws.',
      },
      {
        q: 'Do I need a lawyer for a personal injury claim?',
        a: 'While you can file a claim yourself, studies consistently show that represented claimants receive significantly higher settlements, even after attorney fees. Insurance companies have teams of adjusters and lawyers working to minimize your payout. An experienced personal injury attorney understands the true value of your claim, can negotiate effectively, and can take your case to trial if the insurer refuses to offer fair compensation.',
      },
      {
        q: 'What types of damages can I recover?',
        a: 'You may recover economic damages (medical bills, lost wages, future medical expenses, reduced earning capacity), non-economic damages (pain and suffering, emotional distress, loss of enjoyment of life, loss of consortium), and in some cases punitive damages if the defendant\'s conduct was particularly egregious. Your attorney will evaluate all potential categories of damages applicable to your case.',
      },
      {
        q: 'What if the at-fault party does not have insurance?',
        a: 'You may be able to recover compensation through your own uninsured/underinsured motorist (UM/UIM) coverage, which is required or available in most states. Other options include filing a lawsuit directly against the at-fault party, identifying other liable parties (such as an employer or property owner), or in some cases accessing state victim compensation funds.',
      },
    ],
    emergencyInfo:
      'If you have been seriously injured, call 911 immediately. Do not move if you suspect a spinal injury. Once you are safe, document everything and contact a personal injury attorney as soon as possible. Most offer free initial consultations and work on contingency, so cost should never be a barrier to seeking legal help after an injury.',
    certifications: [
      'Board Certified in Personal Injury Trial Law (National Board of Trial Advocacy)',
      'Board Certified in Civil Trial Law (state bar certification)',
      'Member, American Association for Justice (AAJ)',
      'Super Lawyers or Best Lawyers recognition in Personal Injury',
      'Million Dollar Advocates Forum membership',
      'Multi-Million Dollar Advocates Forum membership',
      'State Trial Lawyers Association membership',
      'AV Preeminent Martindale-Hubbell Rating',
    ],
    averageResponseTime: 'Free consultation typically within 24-48 hours; urgent cases same-day',
  },

  electricien: {
    slug: 'electricien',
    name: 'Criminal Defense',
    priceRange: {
      min: 150,
      max: 500,
      unit: '$/hr',
    },
    commonTasks: [
      'DUI/DWI defense: $2,500-$10,000 flat fee depending on complexity',
      'Misdemeanor defense (assault, theft, drug possession): $2,000-$7,500',
      'Felony defense (robbery, burglary, drug trafficking): $5,000-$25,000+',
      'Federal criminal defense: $10,000-$100,000+ depending on charges',
      'Domestic violence defense: $3,000-$10,000',
      'Drug crime defense: $3,000-$15,000 depending on severity',
      'White collar crime defense (fraud, embezzlement): $10,000-$50,000+',
      'Expungement or record sealing: $1,000-$3,500',
    ],
    tips: [
      'Exercise your right to remain silent. Anything you say to law enforcement can and will be used against you. Politely decline to answer questions and request an attorney immediately.',
      'Do not consent to searches of your person, vehicle, or home without a warrant. Politely but firmly state that you do not consent to a search. Officers may search anyway, but your objection preserves your rights for court.',
      'Contact a criminal defense attorney as soon as possible after an arrest. Early intervention can sometimes prevent charges from being filed or result in reduced charges.',
      'Write down everything you remember about the incident and your arrest as soon as possible, including officer names, badge numbers, witness information, and the exact sequence of events.',
      'If you cannot afford an attorney, you have the right to a court-appointed public defender. However, public defenders often carry extremely heavy caseloads, so hiring a private attorney provides more dedicated attention to your case.',
      'Do not discuss your case on social media, with friends, or with anyone other than your attorney. These communications are not protected by attorney-client privilege and can be used as evidence.',
      'Understand that flat fees are common in criminal defense. Ask your attorney exactly what the fee covers (arraignment only, through trial, appeals) and get the fee agreement in writing.',
      'Show up to every court date on time. Missing a court appearance can result in a bench warrant, additional charges, and revocation of bail.',
    ],
    faq: [
      {
        q: 'How much does a criminal defense lawyer cost?',
        a: 'Criminal defense attorneys typically charge either hourly rates ($150-$500/hr) or flat fees. Flat fees for common charges include: DUI ($2,500-$10,000), misdemeanors ($2,000-$7,500), and felonies ($5,000-$25,000+). Complex federal cases can cost $50,000-$100,000 or more. Many attorneys offer payment plans. If you cannot afford an attorney, you have a constitutional right to a court-appointed public defender.',
      },
      {
        q: 'What happens after I am arrested?',
        a: 'After arrest, you will be booked (fingerprinted, photographed), and a bail amount may be set. You will have an initial appearance or arraignment, typically within 24-72 hours, where charges are formally read and you enter a plea. Your attorney can argue for reduced bail or release on your own recognizance. The case then proceeds through discovery, pre-trial motions, potential plea negotiations, and possibly trial.',
      },
      {
        q: 'Should I accept a plea deal?',
        a: 'This is one of the most important decisions in a criminal case and should only be made after thorough consultation with your attorney. A good defense lawyer will explain the strength of the evidence against you, the likely outcome at trial, and the specific terms of the plea offer. Approximately 90-95% of criminal cases are resolved through plea bargaining, but accepting a plea means giving up your right to trial.',
      },
      {
        q: 'What is the difference between a misdemeanor and a felony?',
        a: 'Misdemeanors are less serious offenses punishable by up to one year in county jail and fines. Felonies are more serious crimes punishable by more than one year in state or federal prison. Felony convictions carry far more severe long-term consequences including loss of voting rights, inability to possess firearms, difficulty finding employment, and potential deportation for non-citizens.',
      },
      {
        q: 'Can a criminal record be expunged?',
        a: 'Eligibility for expungement varies significantly by state and depends on the type of offense, the outcome of the case, and the time elapsed since the conviction or completion of the sentence. Many states allow expungement of certain misdemeanors and some non-violent felonies after a waiting period. Arrests that did not result in conviction are often eligible for expungement. An attorney can evaluate your specific situation under your state\'s laws.',
      },
      {
        q: 'What are my rights during a police encounter?',
        a: 'You have the right to remain silent (Fifth Amendment), the right to an attorney (Sixth Amendment), the right to refuse consent to searches (Fourth Amendment), and the right to know if you are free to leave. You must provide identification if asked in most states. Always remain calm, keep your hands visible, and clearly invoke your rights by saying "I am exercising my right to remain silent" and "I want to speak with an attorney."',
      },
      {
        q: 'How long does a criminal case take?',
        a: 'Timelines vary widely. A simple misdemeanor might resolve in 1-3 months through a plea deal. Misdemeanors going to trial may take 3-6 months. Felony cases often take 6-18 months and complex federal cases can take 1-3 years or longer. Factors include court backlogs, complexity of evidence, number of co-defendants, and whether expert witnesses are needed.',
      },
    ],
    emergencyInfo:
      'If you have been arrested, exercise your right to remain silent and request an attorney immediately. Do not answer questions, sign anything, or consent to searches. You are entitled to a phone call; use it to contact a criminal defense attorney or a family member who can arrange one for you. Many criminal defense attorneys offer 24/7 emergency hotlines.',
    certifications: [
      'Board Certified in Criminal Trial Law (National Board of Trial Advocacy)',
      'Board Certified in Criminal Law (state bar certification where available)',
      'Member, National Association of Criminal Defense Lawyers (NACDL)',
      'Fellow, American College of Trial Lawyers',
      'Super Lawyers or Best Lawyers recognition in Criminal Defense',
      'AV Preeminent Martindale-Hubbell Rating',
      'State Criminal Defense Lawyers Association membership',
      'Federal Bar Association membership (for federal practice)',
    ],
    averageResponseTime: 'Emergency cases: same-day or next-day consultation; standard cases within 1-3 business days',
  },

  serrurier: {
    slug: 'serrurier',
    name: 'Family Law',
    priceRange: {
      min: 200,
      max: 400,
      unit: '$/hr',
    },
    commonTasks: [
      'Uncontested divorce filing and representation: $1,500-$5,000 flat fee',
      'Contested divorce with litigation: $10,000-$50,000+ depending on complexity',
      'Child custody petition or modification: $3,000-$10,000',
      'Child support establishment or modification: $1,500-$5,000',
      'Prenuptial or postnuptial agreement drafting: $2,500-$7,500',
      'Adoption proceedings (stepparent, private, or international): $5,000-$15,000',
      'Restraining order / order of protection: $1,000-$3,000',
      'Paternity establishment: $2,000-$5,000',
    ],
    tips: [
      'Keep detailed financial records before initiating a divorce. Gather bank statements, tax returns, investment accounts, retirement statements, property deeds, and debt information for at least the past 3-5 years.',
      'Avoid making major financial decisions (large purchases, transferring assets, closing accounts) during a pending divorce without consulting your attorney. Courts look unfavorably on dissipation of marital assets.',
      'In custody disputes, the court\'s primary concern is always the best interest of the child. Document your involvement in your children\'s daily lives, education, healthcare, and extracurricular activities.',
      'Consider mediation before litigation. Mediated divorces typically cost $3,000-$8,000 compared to $15,000-$50,000+ for litigated divorces, and often result in more satisfactory outcomes for both parties.',
      'Never use your children as messengers or involve them in disputes between parents. Courts take a dim view of parental alienation, and it can negatively affect custody outcomes.',
      'Understand that family law matters are governed by state law, and rules regarding property division (community property vs. equitable distribution), alimony, and child custody vary significantly between states.',
      'If domestic violence is a factor, your safety comes first. Contact the National Domestic Violence Hotline (1-800-799-7233) and seek an emergency protective order through the courts.',
      'Keep all communication with your spouse civil and in writing (email or text) whenever possible. Written communications can become evidence in court proceedings.',
    ],
    faq: [
      {
        q: 'How much does a divorce lawyer cost?',
        a: 'The cost varies dramatically based on whether the divorce is contested or uncontested. An uncontested divorce with an attorney typically costs $1,500-$5,000, while a contested divorce can range from $10,000 to $50,000 or more. The national average total cost for a divorce is approximately $12,900. Factors include the complexity of asset division, custody disputes, and how cooperative both parties are. Many attorneys offer payment plans.',
      },
      {
        q: 'How long does a divorce take?',
        a: 'An uncontested divorce can be finalized in as little as 30-90 days in some states, though most take 3-6 months. Contested divorces with disputes over assets, custody, or support typically take 1-3 years. Many states have mandatory waiting or separation periods ranging from 30 days to 1 year before a divorce can be finalized. Your attorney can provide a more specific timeline based on your state\'s requirements and your circumstances.',
      },
      {
        q: 'How is child custody determined?',
        a: 'Courts determine custody based on the "best interest of the child" standard, considering factors such as: each parent\'s relationship with the child, the child\'s adjustment to home/school/community, each parent\'s mental and physical health, the child\'s preferences (if old enough), each parent\'s willingness to foster a relationship with the other parent, and any history of domestic violence or substance abuse. Joint custody (both legal and physical) is increasingly favored unless circumstances dictate otherwise.',
      },
      {
        q: 'What is the difference between legal custody and physical custody?',
        a: 'Legal custody refers to the right to make major decisions about a child\'s life, including education, healthcare, and religious upbringing. Physical custody refers to where the child lives. Both types can be sole (one parent) or joint (shared). It is common for parents to share joint legal custody while one parent has primary physical custody. Joint physical custody does not necessarily mean a 50/50 time split.',
      },
      {
        q: 'Am I entitled to alimony (spousal support)?',
        a: 'Alimony eligibility depends on multiple factors including the length of the marriage, each spouse\'s income and earning capacity, the standard of living during the marriage, each spouse\'s age and health, contributions to the marriage (including homemaking), and the requesting spouse\'s financial need. Short marriages (under 5 years) rarely result in alimony. Long marriages (20+ years) are more likely to result in longer-term or permanent alimony. Laws vary by state.',
      },
      {
        q: 'How is property divided in a divorce?',
        a: 'Property division depends on your state\'s laws. Nine states follow "community property" rules where marital assets are split 50/50. The remaining states follow "equitable distribution" where courts divide property fairly but not necessarily equally, considering factors like each spouse\'s contributions, earning capacity, and needs. Separate property (assets owned before marriage or received as gifts/inheritance) is generally not subject to division.',
      },
      {
        q: 'Can I modify a custody or support order?',
        a: 'Yes, custody and support orders can be modified if there has been a substantial change in circumstances since the original order. Common reasons include relocation, significant changes in income, changes in the child\'s needs, remarriage, or concerns about a parent\'s fitness. You must petition the court for a modification; you cannot simply stop following the existing order.',
      },
    ],
    emergencyInfo:
      'If you or your children are in immediate danger due to domestic violence, call 911 first. Then contact the National Domestic Violence Hotline at 1-800-799-7233. You can seek an emergency protective order (EPO) from the court, which can be granted the same day without the abuser being present. A family law attorney can help you obtain a longer-term restraining order.',
    certifications: [
      'Board Certified in Family Law (state bar certification)',
      'Certified Family Law Specialist (CFLS)',
      'Fellow, American Academy of Matrimonial Lawyers (AAML)',
      'Certified Divorce Financial Analyst (CDFA)',
      'Trained Collaborative Law practitioner',
      'Certified Family Mediator',
      'Member, Association of Family and Conciliation Courts (AFCC)',
      'Super Lawyers or Best Lawyers recognition in Family Law',
    ],
    averageResponseTime: 'Initial consultation within 1-3 business days; emergency protective orders can be filed same-day',
  },

  chauffagiste: {
    slug: 'chauffagiste',
    name: 'Real Estate Law',
    priceRange: {
      min: 150,
      max: 350,
      unit: '$/hr',
    },
    commonTasks: [
      'Residential real estate closing representation: $500-$1,500 flat fee',
      'Commercial real estate closing: $2,000-$10,000 depending on transaction size',
      'Title search and examination: $200-$600',
      'Purchase/sale agreement review and negotiation: $500-$1,500',
      'Lease agreement drafting or review: $500-$2,000',
      'Landlord-tenant dispute representation: $2,000-$5,000',
      'Zoning and land use application: $2,500-$10,000',
      'Real estate litigation (boundary disputes, easements): $5,000-$25,000+',
    ],
    tips: [
      'Always have a real estate attorney review your purchase agreement before signing, even if your state does not require attorney involvement at closing. The cost of a review ($300-$500) is minimal compared to the risks of a problematic contract.',
      'Obtain title insurance on any property you purchase. Title insurance protects you from claims against your ownership that may arise from issues predating your purchase, such as liens, forged deeds, or undisclosed heirs.',
      'Before buying commercial property, conduct thorough due diligence including environmental assessments (Phase I and possibly Phase II), zoning verification, and review of all existing leases, liens, and encumbrances.',
      'If you are a landlord, have an attorney draft your lease agreements rather than using generic templates. State-specific landlord-tenant laws vary significantly, and non-compliant lease terms may be unenforceable.',
      'In many states, attorneys are required at real estate closings. Even where they are not required, having an attorney present can protect your interests when signing documents that represent your largest financial commitment.',
      'Keep copies of all real estate documents indefinitely, including your deed, title insurance policy, closing disclosure, survey, and any easement or covenant agreements.',
      'If you are involved in a boundary dispute with a neighbor, try to resolve it through negotiation or mediation before resorting to litigation. Survey costs ($400-$800) are far less than legal fees for a boundary lawsuit.',
      'When purchasing property through an LLC or trust for asset protection, consult with both a real estate attorney and a tax advisor to ensure the structure is properly established and provides the intended benefits.',
    ],
    faq: [
      {
        q: 'Do I need a lawyer to buy a house?',
        a: 'Some states (such as New York, Massachusetts, Connecticut, Georgia, and several others) require an attorney at the real estate closing. Even in states where it is not mandatory, having a real estate attorney review your contract and attend the closing is highly recommended. The typical cost of $500-$1,500 for closing representation is a small fraction of the transaction and can save you from costly problems with title, contract terms, or closing documents.',
      },
      {
        q: 'What is a title search and why is it important?',
        a: 'A title search examines public records to verify the seller\'s legal right to sell the property and to identify any claims, liens, easements, or encumbrances on the property. It is essential because it uncovers potential problems (such as unpaid taxes, contractor liens, or ownership disputes) that could affect your rights as the new owner. Title searches typically cost $200-$600 and should always be paired with title insurance.',
      },
      {
        q: 'What is the difference between a real estate agent and a real estate attorney?',
        a: 'A real estate agent helps you find a property, markets your property for sale, and facilitates negotiations. They are licensed but not attorneys. A real estate attorney provides legal advice, reviews and drafts contracts, conducts title examination, handles closing procedures, and can represent you in disputes or litigation. Many transactions benefit from both professionals working in their respective areas of expertise.',
      },
      {
        q: 'How are real estate lawyers paid?',
        a: 'Real estate attorneys typically charge either flat fees or hourly rates depending on the service. Common flat fee arrangements include: residential closing ($500-$1,500), contract review ($300-$500), and lease drafting ($500-$2,000). Hourly rates typically range from $150-$350. For litigation matters such as boundary disputes or foreclosure defense, attorneys typically charge hourly. Always get a written fee agreement before engagement.',
      },
      {
        q: 'What should I know about closing costs?',
        a: 'Closing costs typically range from 2-5% of the purchase price and include attorney fees, title insurance, title search, recording fees, transfer taxes, lender fees, appraisal, and escrow charges. Buyers and sellers each have their own closing costs, though this can be negotiated. Your attorney should review the closing disclosure at least three days before closing to verify all charges are accurate.',
      },
      {
        q: 'What are my rights as a tenant?',
        a: 'Tenants have the right to habitable living conditions, privacy (landlord must give notice before entering, typically 24-48 hours), security deposit protection (limits on amount and requirements for return), protection against retaliatory eviction, and the right to proper eviction proceedings. Specific rights vary by state and locality. Many cities and states have additional protections such as rent control or just-cause eviction requirements. Consult a real estate attorney if you believe your rights are being violated.',
      },
    ],
    emergencyInfo:
      'If you are facing an imminent foreclosure, eviction, or property seizure, contact a real estate attorney immediately. Many legal aid organizations offer emergency foreclosure defense. Tenants facing illegal lockouts can call the police, as self-help evictions are illegal in all 50 states. Document any property emergencies with photos and written notices.',
    certifications: [
      'Board Certified in Real Property Law (state bar certification)',
      'Member, American College of Real Estate Lawyers (ACREL)',
      'Member, American Bar Association Section of Real Property, Trust and Estate Law',
      'Certified Commercial Investment Member (CCIM) designation',
      'State bar real estate law specialty certification',
      'Member, American Land Title Association (ALTA)',
      'Super Lawyers or Best Lawyers recognition in Real Estate Law',
      'AV Preeminent Martindale-Hubbell Rating',
    ],
    averageResponseTime: 'Closing representation: 1-2 weeks lead time; contract review within 2-3 business days; emergencies same-day',
  },

  climaticien: {
    slug: 'climaticien',
    name: 'Immigration Law',
    priceRange: {
      min: 150,
      max: 400,
      unit: '$/hr',
    },
    commonTasks: [
      'Family-based green card application (I-130 + I-485): $3,000-$8,000 attorney fees',
      'Employment-based green card (PERM + I-140 + I-485): $5,000-$15,000',
      'Naturalization / citizenship application (N-400): $1,500-$3,000',
      'H-1B visa petition: $2,000-$5,000 attorney fees',
      'Removal / deportation defense: $5,000-$15,000+',
      'Asylum application: $3,000-$10,000',
      'K-1 fiancé(e) visa petition: $2,000-$4,000',
      'DACA renewal application: $500-$1,500',
    ],
    tips: [
      'Immigration law is one of the most complex areas of US law. Even minor errors on applications can result in denials, delays, or bars to future immigration benefits. Working with an experienced immigration attorney is strongly recommended.',
      'Be wary of "notarios" or immigration consultants who offer legal services. In many Latin American countries, a "notario" is a licensed legal professional, but in the US, only licensed attorneys and DOJ-accredited representatives can provide immigration legal advice.',
      'Never lie or submit false documents on any immigration application. Immigration fraud can result in permanent bars to immigration benefits, deportation, and criminal prosecution.',
      'Keep copies of every document you submit to USCIS, and always send applications via a method that provides delivery confirmation. Processing times can be long, and you may need to prove when you filed.',
      'If you are undocumented, know that you still have constitutional rights, including the right to remain silent, the right to an attorney (though not at government expense in immigration proceedings), and the right to due process.',
      'Check USCIS processing times regularly at egov.uscis.gov/processing-times. Processing times vary significantly by service center and application type, ranging from a few months to several years.',
      'If your case is denied, you typically have the right to appeal or file a motion to reopen or reconsider. Deadlines are strict (usually 30 days), so contact your attorney immediately upon receiving a denial.',
      'Employers sponsoring workers for visas should begin the process well in advance. H-1B petitions have an annual cap and lottery system, and PERM labor certification for green cards can take 12-18 months alone.',
    ],
    faq: [
      {
        q: 'How much does an immigration lawyer cost?',
        a: 'Immigration attorney fees vary by case type. Common flat fees include: family green card ($3,000-$8,000), employment green card ($5,000-$15,000), H-1B visa ($2,000-$5,000), naturalization ($1,500-$3,000), and asylum ($3,000-$10,000). These fees are in addition to USCIS filing fees, which range from $0 for certain humanitarian applications to $2,500+ for some petitions. Many immigration attorneys offer payment plans.',
      },
      {
        q: 'How long does it take to get a green card?',
        a: 'Processing times vary dramatically. Immediate relatives of US citizens (spouses, parents, unmarried children under 21) typically wait 12-24 months. Family preference categories can take 2-20+ years depending on the category and the applicant\'s country of birth. Employment-based green cards take 1-5+ years depending on the category and country. Citizens of India and China face significantly longer wait times in employment categories due to per-country limits.',
      },
      {
        q: 'What is the difference between a visa and a green card?',
        a: 'A visa is a temporary authorization to enter and remain in the US for a specific purpose and time period (work, study, tourism). A green card (permanent resident card) grants the holder permanent authorization to live and work in the US indefinitely. Green card holders can eventually apply for US citizenship through naturalization after meeting residency requirements (typically 5 years, or 3 years if married to a US citizen).',
      },
      {
        q: 'Can I work in the US without a green card?',
        a: 'Yes, several visa categories allow work authorization, including H-1B (specialty occupation), L-1 (intracompany transfer), O-1 (extraordinary ability), TN (NAFTA professionals), E-1/E-2 (treaty traders/investors), and others. Certain visa holders\' spouses may also obtain work authorization. Asylum applicants can apply for work authorization 150 days after filing. An immigration attorney can identify which options may be available to you.',
      },
      {
        q: 'What should I do if I receive a Notice to Appear (NTA)?',
        a: 'A Notice to Appear means the government is initiating removal (deportation) proceedings against you. This is a serious matter that requires immediate legal representation. Contact an immigration attorney right away. Do not miss your immigration court hearing, as failure to appear results in an automatic deportation order. You have the right to present your case before an immigration judge, apply for relief from removal, and appeal an unfavorable decision.',
      },
      {
        q: 'Can I apply for citizenship? What are the requirements?',
        a: 'To apply for naturalization, you must: be a permanent resident (green card holder) for at least 5 years (3 years if married to a US citizen), have been physically present in the US for at least 30 months of the past 5 years, demonstrate good moral character, pass an English language test and a US civics test, and be at least 18 years old. Certain exceptions exist for military members and elderly long-term residents.',
      },
      {
        q: 'Does immigration status affect my legal rights?',
        a: 'All people in the US, regardless of immigration status, have fundamental constitutional protections including the right to due process, the right to an attorney in criminal proceedings, the right against unreasonable search and seizure, and the right to remain silent. Undocumented individuals can file police reports, seek emergency medical care, and send their children to public school. However, immigration status does affect eligibility for most public benefits.',
      },
    ],
    emergencyInfo:
      'If you or a family member has been detained by ICE, you have the right to remain silent and the right to an attorney. Do not sign any documents, especially a voluntary departure form, without consulting an attorney. Contact a local immigration attorney or the National Immigrant Justice Center hotline at 312-660-1370. If detained, you can be located through the ICE detainee locator at locator.ice.gov.',
    certifications: [
      'Board Certified in Immigration and Nationality Law (state bar certification)',
      'Member, American Immigration Lawyers Association (AILA)',
      'DOJ-accredited representative (for non-attorney practitioners)',
      'Fellow, American Bar Foundation',
      'Super Lawyers or Best Lawyers recognition in Immigration Law',
      'AV Preeminent Martindale-Hubbell Rating',
      'State bar immigration law specialty certification',
      'Membership in local/state immigration law bar associations',
    ],
    averageResponseTime: 'Initial consultation within 1-5 business days; emergency detention cases require immediate response',
  },

  macon: {
    slug: 'macon',
    name: 'Bankruptcy Law',
    priceRange: {
      min: 200,
      max: 400,
      unit: '$/hr',
    },
    commonTasks: [
      'Chapter 7 bankruptcy filing (liquidation): $1,000-$3,500 attorney fees',
      'Chapter 13 bankruptcy filing (repayment plan): $2,500-$6,000 attorney fees',
      'Chapter 11 business reorganization: $10,000-$50,000+',
      'Pre-bankruptcy consultation and means test analysis: $200-$500',
      'Credit counseling and debtor education coordination: included in filing fee',
      'Bankruptcy petition preparation and filing: included in attorney fee',
      'Creditor harassment defense (automatic stay): part of filing representation',
      'Post-bankruptcy credit rebuilding advice: often included in representation',
    ],
    tips: [
      'Bankruptcy is not the end of your financial life; it is a legal tool designed to give you a fresh start. Millions of Americans file for bankruptcy protection each year, and most see their credit scores begin to recover within 1-2 years.',
      'Understand the difference between Chapter 7 and Chapter 13: Chapter 7 eliminates most unsecured debts in 3-4 months but may require liquidating non-exempt assets. Chapter 13 allows you to keep your property and repay debts over 3-5 years.',
      'You must complete credit counseling from an approved provider within 180 days before filing and a debtor education course after filing. These are mandatory federal requirements.',
      'Stop using credit cards and taking on new debt as soon as you consider bankruptcy. Charges made shortly before filing may be deemed fraudulent and become non-dischargeable.',
      'Not all debts can be discharged in bankruptcy. Student loans, most tax debts, child support, alimony, criminal fines, and debts incurred through fraud are generally non-dischargeable.',
      'Bankruptcy exemptions protect certain assets from liquidation. These vary by state and may include your home (homestead exemption), vehicle, retirement accounts, tools of your trade, and personal property up to certain limits.',
      'Consult with a bankruptcy attorney before attempting debt consolidation, settlement, or other alternatives. In some cases, these options can make your financial situation worse or interfere with a later bankruptcy filing.',
      'A bankruptcy filing triggers an automatic stay, which immediately stops most collection actions, wage garnishments, foreclosures, and lawsuits against you.',
    ],
    faq: [
      {
        q: 'How much does it cost to file bankruptcy?',
        a: 'Attorney fees for Chapter 7 bankruptcy typically range from $1,000-$3,500, while Chapter 13 fees range from $2,500-$6,000 (often paid through the repayment plan). In addition, court filing fees are $338 for Chapter 7 and $313 for Chapter 13. You must also pay for mandatory credit counseling ($15-$50) and debtor education ($15-$50). Some attorneys offer free consultations and payment plans.',
      },
      {
        q: 'Will I lose my house if I file bankruptcy?',
        a: 'Not necessarily. In Chapter 13, you can keep your home and catch up on past-due mortgage payments through your repayment plan. In Chapter 7, your home may be protected by your state\'s homestead exemption, which shields equity up to a certain amount (ranging from $5,000 in some states to unlimited in Texas and Florida). If your equity exceeds the exemption, the trustee could sell the home, but this is relatively uncommon.',
      },
      {
        q: 'How long does bankruptcy stay on my credit report?',
        a: 'A Chapter 7 bankruptcy remains on your credit report for 10 years from the filing date, while a Chapter 13 bankruptcy remains for 7 years. However, the practical impact on your credit diminishes over time. Many people see significant credit score improvement within 1-2 years after discharge and can qualify for mortgages within 2-4 years of discharge with responsible financial management.',
      },
      {
        q: 'What is the means test?',
        a: 'The means test determines whether you qualify for Chapter 7 bankruptcy. It compares your income to the median income for your state and household size. If your income is below the median, you generally qualify for Chapter 7. If your income is above the median, a second calculation considers your allowable expenses to determine whether you have enough disposable income to fund a Chapter 13 repayment plan instead.',
      },
      {
        q: 'Can I file bankruptcy without a lawyer?',
        a: 'While technically possible (called filing "pro se"), it is strongly discouraged. Bankruptcy law is complex, and errors can result in case dismissal, loss of property, or failure to discharge debts. Studies show that pro se Chapter 7 filers succeed in obtaining a discharge only about 66% of the time, compared to 95%+ for represented filers. The cost of an attorney is a worthwhile investment in getting a proper fresh start.',
      },
      {
        q: 'What debts can be discharged in bankruptcy?',
        a: 'Most unsecured debts can be discharged, including credit card debt, medical bills, personal loans, utility bills, and some older tax debts. Debts that generally cannot be discharged include: student loans (except in cases of "undue hardship"), most tax debts less than 3 years old, child support and alimony, criminal fines and restitution, debts incurred through fraud, and debts for injuries caused by drunk driving.',
      },
      {
        q: 'How often can I file for bankruptcy?',
        a: 'You can receive a Chapter 7 discharge once every 8 years (measured from filing date to filing date). You can receive a Chapter 13 discharge once every 2 years. You can file Chapter 13 after Chapter 7 with a 4-year gap, and Chapter 7 after Chapter 13 with a 6-year gap (or less if you paid 100% of unsecured debts in the Chapter 13 plan). There is no limit on the number of times you can file, only on how frequently you can receive a discharge.',
      },
    ],
    emergencyInfo:
      'If you are facing imminent wage garnishment, bank levy, foreclosure sale, or vehicle repossession, an emergency bankruptcy filing can stop these actions immediately through the automatic stay. Contact a bankruptcy attorney right away, as emergency ("bare bones") petitions can be filed within hours when necessary. You will have 14 days to complete the full petition.',
    certifications: [
      'Board Certified in Consumer Bankruptcy Law (American Board of Certification)',
      'Board Certified in Business Bankruptcy Law (American Board of Certification)',
      'Member, National Association of Consumer Bankruptcy Attorneys (NACBA)',
      'Member, American Bankruptcy Institute (ABI)',
      'Fellow, American College of Bankruptcy',
      'Super Lawyers or Best Lawyers recognition in Bankruptcy Law',
      'AV Preeminent Martindale-Hubbell Rating',
      'State bar bankruptcy law specialty certification',
    ],
    averageResponseTime: 'Free consultation within 1-3 business days; emergency filings can be completed same-day',
  },

  couvreur: {
    slug: 'couvreur',
    name: 'Employment Law',
    priceRange: {
      min: 200,
      max: 500,
      unit: '$/hr',
    },
    commonTasks: [
      'Wrongful termination claim: $5,000-$15,000 retainer or contingency fee',
      'Employment discrimination complaint (EEOC filing): $3,000-$10,000 or contingency',
      'Sexual harassment lawsuit: typically contingency fee 33-40%',
      'Wage and hour dispute / unpaid overtime claim: contingency or $3,000-$8,000',
      'Severance agreement review and negotiation: $1,000-$3,000',
      'Employment contract review: $500-$2,000',
      'Non-compete agreement review or challenge: $2,000-$5,000',
      'FMLA or ADA accommodation dispute: $3,000-$10,000 or contingency',
    ],
    tips: [
      'Document everything related to your employment dispute: save emails, text messages, performance reviews, company policies, and any written communications. Create a timeline of events with dates and details.',
      'If you believe you are being discriminated against or harassed, report it in writing to your employer\'s HR department or management. This creates a formal record and triggers your employer\'s obligation to investigate.',
      'Before signing a severance agreement, have an employment attorney review it. Severance agreements almost always contain a release of legal claims, and you may be giving up valuable rights. Most employers expect some negotiation.',
      'File a charge with the EEOC within 180 days of the discriminatory act (or 300 days in states with local enforcement agencies). Missing this deadline can permanently bar your claim.',
      'If you are a whistleblower reporting illegal activity by your employer, you may be protected under federal and state whistleblower protection laws. Document what you reported, to whom, and when, before retaliation occurs.',
      'Non-compete agreements are increasingly scrutinized by courts and legislatures. Some states (like California) largely refuse to enforce them. Have an attorney review any non-compete before assuming it limits your options.',
      'Keep personal copies of employment records on your personal devices or accounts, not on company systems. You may lose access to company email and files immediately upon termination.',
      'Independent contractors and gig workers may have different rights than employees. If you believe you have been misclassified, an employment attorney can evaluate your situation under the applicable federal and state tests.',
    ],
    faq: [
      {
        q: 'How much does an employment lawyer cost?',
        a: 'Employment attorneys use various fee structures depending on the case type. Employee-side attorneys handling discrimination, harassment, or wrongful termination cases often work on contingency (33-40% of recovery). Hourly rates range from $200-$500 for matters like contract review, severance negotiation, or defense-side work. Flat fees are common for discrete tasks like reviewing a non-compete ($500-$2,000) or filing an EEOC charge ($3,000-$5,000).',
      },
      {
        q: 'What qualifies as wrongful termination?',
        a: 'Most US employment is "at will," meaning either party can end the relationship at any time for any lawful reason. Wrongful termination occurs when firing violates a specific law or agreement, such as: discrimination based on a protected characteristic (race, gender, age, disability, religion, national origin), retaliation for exercising legal rights (filing a workers\' comp claim, reporting safety violations, taking FMLA leave), breach of an employment contract, or violation of public policy.',
      },
      {
        q: 'What is considered workplace discrimination?',
        a: 'Workplace discrimination occurs when an employer treats an employee or applicant unfavorably because of a protected characteristic, including race, color, religion, sex (including pregnancy, gender identity, and sexual orientation), national origin, age (40+), disability, or genetic information. Discrimination can be direct (explicit adverse actions) or indirect (neutral policies that disproportionately affect a protected group). Both are illegal under federal law (Title VII, ADA, ADEA) and often additional state laws.',
      },
      {
        q: 'What should I do if I am being sexually harassed at work?',
        a: 'Document every incident with dates, times, locations, witnesses, and details. Report the harassment in writing to your supervisor or HR department following your company\'s complaint procedure. If internal resolution fails, file a charge with the EEOC (or state agency) within 180-300 days. Consult an employment attorney, as many offer free consultations for harassment cases. Do not quit before consulting a lawyer, as this may affect your legal options.',
      },
      {
        q: 'Am I entitled to overtime pay?',
        a: 'Under the Fair Labor Standards Act (FLSA), non-exempt employees must receive overtime pay at 1.5 times their regular rate for hours worked over 40 in a workweek. Some states have more generous overtime rules. Key exemptions apply to certain executive, administrative, professional, outside sales, and computer employees who meet specific salary and duties tests. Misclassification of employees as exempt is common and may entitle you to back pay for up to 2-3 years.',
      },
      {
        q: 'Can my employer fire me for filing a complaint?',
        a: 'No. Federal and state laws prohibit retaliation against employees who engage in protected activities, including filing discrimination complaints, reporting safety violations (OSHA), taking FMLA leave, filing workers\' compensation claims, or reporting illegal activity (whistleblowing). If you are fired or suffer adverse action after engaging in a protected activity, you may have a retaliation claim, which is often easier to prove than the underlying complaint.',
      },
      {
        q: 'What is a non-compete agreement and is it enforceable?',
        a: 'A non-compete agreement restricts an employee from working for competitors or starting a competing business for a specified time and geographic area after leaving employment. Enforceability varies widely by state. California, Minnesota, Oklahoma, and North Dakota generally refuse to enforce them. Other states enforce "reasonable" non-competes, considering duration (usually 6-24 months), geographic scope, and the employer\'s legitimate business interest. The FTC has proposed a nationwide ban on most non-competes.',
      },
    ],
    emergencyInfo:
      'If you are facing imminent termination, workplace violence, or severe harassment, document everything immediately and consult an employment attorney. If you are in physical danger, call 911. For workplace safety emergencies, contact OSHA at 1-800-321-6742. If you have been fired and believe it was illegal, act quickly as filing deadlines (180-300 days) are strictly enforced.',
    certifications: [
      'Board Certified in Labor and Employment Law (state bar certification)',
      'Member, National Employment Law Project (NELP)',
      'Fellow, College of Labor and Employment Lawyers',
      'Member, National Employment Lawyers Association (NELA)',
      'Super Lawyers or Best Lawyers recognition in Employment Law',
      'AV Preeminent Martindale-Hubbell Rating',
      'Member, American Bar Association Section of Labor and Employment Law',
      'State bar labor and employment law specialty certification',
    ],
    averageResponseTime: 'Initial consultation within 1-5 business days; urgent retaliation or termination matters within 24-48 hours',
  },

  menuisier: {
    slug: 'menuisier',
    name: 'Estate Planning',
    priceRange: {
      min: 200,
      max: 400,
      unit: '$/hr',
    },
    commonTasks: [
      'Simple will drafting: $300-$1,000',
      'Revocable living trust creation: $1,500-$5,000',
      'Comprehensive estate plan (will, trust, powers of attorney, healthcare directive): $2,000-$5,000',
      'Trust administration after death: $3,000-$10,000+',
      'Probate representation: $3,000-$10,000+ (or 2-5% of estate value)',
      'Power of attorney drafting (financial and healthcare): $200-$500 each',
      'Advance healthcare directive / living will: $200-$500',
      'Estate plan review and update: $500-$1,500',
    ],
    tips: [
      'Everyone over 18 should have at minimum a will, durable power of attorney, and healthcare directive. Without these documents, your state\'s default laws will determine who manages your affairs and inherits your assets.',
      'Review and update your estate plan every 3-5 years or after major life events: marriage, divorce, birth of a child, death of a beneficiary, significant change in assets, move to a new state, or changes in tax laws.',
      'A revocable living trust avoids probate, which can be expensive (2-7% of estate value), time-consuming (6-18 months), and public. Probate avoidance is especially valuable in states with complex or costly probate procedures.',
      'Name contingent beneficiaries on all accounts and update beneficiary designations after life changes. Beneficiary designations on retirement accounts, life insurance, and payable-on-death accounts override your will.',
      'Consider the tax implications of your estate plan. The federal estate tax exemption is currently $13.61 million per individual (2024), but this is scheduled to be cut roughly in half after 2025 unless Congress acts.',
      'If you have minor children, your will should name a guardian. Without a designated guardian, the court will choose one, which may not align with your wishes.',
      'A durable power of attorney is essential for incapacity planning. Without one, your family may need to go through expensive guardianship proceedings ($5,000-$15,000) to manage your finances if you become incapacitated.',
      'Digital estate planning is increasingly important. Make provisions for your online accounts, cryptocurrency, digital photos, and social media profiles in your estate plan.',
    ],
    faq: [
      {
        q: 'How much does estate planning cost?',
        a: 'Costs vary by complexity. A simple will typically costs $300-$1,000. A comprehensive estate plan including a revocable living trust, pour-over will, powers of attorney, and healthcare directive costs $2,000-$5,000. High-net-worth estate plans involving tax planning strategies can cost $5,000-$20,000+. Many estate planning attorneys offer fixed-fee packages. The investment is modest compared to the cost and complications of dying without a plan.',
      },
      {
        q: 'Do I need a trust or is a will sufficient?',
        a: 'A will is sufficient for simple estates, but a revocable living trust offers significant advantages: it avoids probate (saving time, money, and privacy), provides for incapacity management, takes effect immediately upon funding, and is harder to contest than a will. Trusts are particularly beneficial if you own real estate in multiple states, have minor children, want privacy, or have a complex family situation. Your attorney can recommend the best approach for your circumstances.',
      },
      {
        q: 'What happens if I die without a will?',
        a: 'If you die without a will (intestate), state law determines who inherits your assets, typically in this order: spouse, children, parents, siblings, and then more distant relatives. The distribution may not match your wishes. For example, in many states, a surviving spouse may receive only half the estate if there are children. Unmarried partners receive nothing. The court will appoint an administrator for your estate and a guardian for your minor children.',
      },
      {
        q: 'What is probate and how can I avoid it?',
        a: 'Probate is the court-supervised process of validating a will, paying debts, and distributing assets. It typically takes 6-18 months and costs 2-7% of the estate value. Methods to avoid probate include: creating a revocable living trust, naming beneficiaries on accounts (retirement, life insurance, POD/TOD accounts), holding property in joint tenancy with right of survivorship, and using transfer-on-death deeds (available in most states).',
      },
      {
        q: 'How often should I update my estate plan?',
        a: 'Review your estate plan every 3-5 years and update it after any major life event: marriage, divorce, birth or adoption of a child, death of a beneficiary or executor, significant change in financial situation, move to a new state, acquisition of new property, change in health status, or changes in federal/state estate tax laws. Even if nothing has changed, a periodic review ensures your plan still reflects your wishes.',
      },
      {
        q: 'What is a durable power of attorney?',
        a: 'A durable power of attorney (DPOA) is a legal document that authorizes someone you trust (your "agent") to make financial and legal decisions on your behalf if you become unable to do so. "Durable" means it remains effective even if you become incapacitated. There are two types: financial DPOA (managing bank accounts, paying bills, handling investments) and healthcare DPOA (making medical decisions). Both are essential components of any estate plan.',
      },
      {
        q: 'Do I need an estate plan if I am young and healthy?',
        a: 'Yes. Incapacity and death can occur at any age. At minimum, every adult should have: a healthcare directive (stating your wishes for medical treatment if you cannot communicate), a healthcare power of attorney (authorizing someone to make medical decisions for you), and a financial power of attorney (authorizing someone to manage your finances if you are incapacitated). If you have any assets, dependents, or specific wishes for your care, a will or trust is also important.',
      },
    ],
    certifications: [
      'Board Certified in Estate Planning and Probate Law (state bar certification)',
      'Certified Trust and Fiduciary Advisor (CTFA)',
      'Accredited Estate Planner (AEP) — American College of Financial Services',
      'Fellow, American College of Trust and Estate Counsel (ACTEC)',
      'Certified Elder Law Attorney (CELA)',
      'Member, National Academy of Elder Law Attorneys (NAELA)',
      'Super Lawyers or Best Lawyers recognition in Estate Planning',
      'AV Preeminent Martindale-Hubbell Rating',
    ],
    averageResponseTime: 'Initial consultation within 1-2 weeks; document drafting typically 2-4 weeks after consultation',
  },

  'peintre-en-batiment': {
    slug: 'peintre-en-batiment',
    name: 'Tax Law',
    priceRange: {
      min: 200,
      max: 500,
      unit: '$/hr',
    },
    commonTasks: [
      'IRS audit representation: $3,000-$10,000 depending on complexity',
      'Tax controversy / dispute resolution with IRS: $5,000-$15,000',
      'Offer in Compromise (OIC) negotiation: $3,500-$7,500',
      'Installment agreement negotiation: $1,500-$3,000',
      'Tax lien or levy release: $2,000-$5,000',
      'Tax court litigation: $10,000-$30,000+',
      'Business tax planning and compliance: $2,000-$10,000/year',
      'International tax compliance (FBAR, FATCA): $2,000-$8,000',
    ],
    tips: [
      'Never ignore IRS notices. Responding promptly preserves your rights and prevents penalties from escalating. Even if you cannot pay, responding shows good faith and opens options for resolution.',
      'If you receive an audit notice, do not panic. Most audits are correspondence audits (by mail) focused on a specific item. Hiring a tax attorney or CPA to handle the audit significantly reduces the risk of an unfavorable outcome.',
      'Keep tax records for at least 7 years. The IRS generally has 3 years to audit your return, but this extends to 6 years if there is a substantial understatement of income (25% or more) and indefinitely if fraud is suspected.',
      'If you owe back taxes, there are multiple resolution options: installment agreements (payment plans), Offer in Compromise (settling for less than owed), currently-not-collectible status, and penalty abatement. A tax attorney can identify the best strategy for your situation.',
      'Separate personal and business finances completely. Commingling funds is one of the most common triggers for IRS scrutiny and can undermine the liability protection of your business entity.',
      'If you have foreign bank accounts exceeding $10,000 in aggregate, you must file an FBAR (FinCEN Form 114) by April 15. Penalties for non-filing can be severe: up to $12,909 per account per year for non-willful violations and the greater of $100,000 or 50% of account balance for willful violations.',
      'Tax planning should be done proactively, not reactively. Year-end tax planning with a professional can identify opportunities for deductions, credits, and deferral strategies that are unavailable after December 31.',
      'Criminal tax charges (tax evasion, filing false returns) are rare but carry severe penalties including imprisonment. If you believe you may be under criminal investigation, contact a tax attorney immediately, not a CPA or enrolled agent.',
    ],
    faq: [
      {
        q: 'How much does a tax lawyer cost?',
        a: 'Tax attorneys typically charge $200-$500 per hour. Common flat-fee services include: audit representation ($3,000-$10,000), Offer in Compromise preparation ($3,500-$7,500), installment agreement negotiation ($1,500-$3,000), and tax lien release ($2,000-$5,000). Tax court litigation can cost $10,000-$30,000+. Many tax attorneys offer free initial consultations to evaluate your situation.',
      },
      {
        q: 'What is the difference between a tax attorney, CPA, and enrolled agent?',
        a: 'A tax attorney is a licensed lawyer specializing in tax law who can provide legal advice, represent you in court, and invoke attorney-client privilege. A CPA (Certified Public Accountant) specializes in accounting and tax preparation and can represent you before the IRS. An enrolled agent (EA) is federally authorized to represent taxpayers before the IRS. For routine tax preparation, a CPA or EA is typically sufficient. For legal disputes, audits, criminal matters, or complex tax planning, a tax attorney is recommended.',
      },
      {
        q: 'What happens if I cannot pay my taxes?',
        a: 'You have several options: (1) Installment agreement: monthly payments over up to 72 months; (2) Offer in Compromise: settle for less than the full amount owed if you meet IRS criteria; (3) Currently-not-collectible status: temporarily halt collection if paying would create economic hardship; (4) Penalty abatement: request removal of penalties for reasonable cause. The worst thing to do is nothing, as interest and penalties continue to accrue and the IRS may eventually garnish wages, levy bank accounts, or place liens on property.',
      },
      {
        q: 'What is an IRS audit and what should I expect?',
        a: 'An IRS audit is an examination of your tax return to verify that income, deductions, and credits were reported accurately. There are three types: correspondence audit (by mail, most common, focused on a specific item), office audit (at an IRS office, more comprehensive), and field audit (at your home or business, most thorough). You have the right to representation, the right to know why you are being audited, and the right to appeal an unfavorable result.',
      },
      {
        q: 'What is an Offer in Compromise?',
        a: 'An Offer in Compromise (OIC) is an agreement with the IRS to settle your tax debt for less than the full amount owed. The IRS considers your ability to pay, income, expenses, and asset equity. The acceptance rate is roughly 30-40%. You must be current on all filing requirements and not be in an open bankruptcy proceeding. There is a $205 application fee (waived for low-income applicants) and you must submit a partial payment with your offer.',
      },
      {
        q: 'Can the IRS take my house or bank account?',
        a: 'Yes. The IRS can place a lien on your property (a legal claim against your assets) and can levy (seize) bank accounts, wages, Social Security benefits, and other property to satisfy a tax debt. However, certain assets are exempt from levy, including necessary clothing, schoolbooks, certain amounts of personal property and household furnishings, and unemployment and workers\' compensation benefits. A tax attorney can help prevent or release levies and liens.',
      },
      {
        q: 'How far back can the IRS audit me?',
        a: 'Generally, the IRS has 3 years from the date you filed your return to initiate an audit (or 3 years from the due date, whichever is later). This extends to 6 years if you failed to report more than 25% of your gross income. There is no statute of limitations if you filed a fraudulent return or failed to file at all. The IRS also has 10 years from the date of assessment to collect an outstanding tax debt.',
      },
    ],
    emergencyInfo:
      'If the IRS has issued a levy notice (Intent to Levy, CP504) or a Notice of Federal Tax Lien, contact a tax attorney immediately. You typically have 30 days from the date of the notice to request a Collection Due Process hearing, which can halt collection actions. If your wages are being garnished or bank account has been levied, emergency relief may be available.',
    certifications: [
      'Board Certified in Tax Law (state bar certification)',
      'LL.M. in Taxation (Master of Laws in Taxation)',
      'Certified Tax Law Specialist',
      'Fellow, American College of Tax Counsel (ACTC)',
      'Member, American Bar Association Section of Taxation',
      'Super Lawyers or Best Lawyers recognition in Tax Law',
      'AV Preeminent Martindale-Hubbell Rating',
      'Enrolled Agent (EA) designation (some tax attorneys hold this as well)',
    ],
    averageResponseTime: 'Initial consultation within 1-5 business days; IRS notice response assistance within 24-48 hours',
  },

  carreleur: {
    slug: 'carreleur',
    name: 'Business / Corporate Law',
    priceRange: {
      min: 250,
      max: 700,
      unit: '$/hr',
    },
    commonTasks: [
      'Business entity formation (LLC, corporation): $500-$2,000',
      'Operating agreement or bylaws drafting: $1,000-$3,000',
      'Contract drafting and review: $500-$5,000 depending on complexity',
      'Mergers and acquisitions (M&A) representation: $10,000-$100,000+',
      'Partnership or shareholder dispute resolution: $5,000-$25,000+',
      'Commercial lease negotiation: $1,500-$5,000',
      'Employment agreement and non-compete drafting: $1,000-$3,000',
      'Regulatory compliance review: $2,500-$10,000',
    ],
    tips: [
      'Choose the right business entity from the start. LLCs offer flexibility and liability protection for small businesses, while C-corporations are preferred for venture-funded startups. S-corporations can offer tax advantages for profitable small businesses. Consult both a business attorney and a tax advisor.',
      'Put every important business agreement in writing. Oral contracts, while sometimes enforceable, are extremely difficult to prove in court and inevitably lead to disputes over terms.',
      'Maintain strict separation between personal and business finances. Commingling funds is the most common reason courts "pierce the corporate veil," exposing your personal assets to business liabilities.',
      'Have an attorney review any contract before you sign it, especially leases, vendor agreements, partnership agreements, and financing documents. The cost of review ($500-$2,000) is far less than the cost of a bad deal.',
      'If you have business partners, create a comprehensive partnership or operating agreement that addresses capital contributions, profit sharing, decision-making authority, dispute resolution, and exit strategies (buyout provisions, death, disability, divorce).',
      'Protect your intellectual property early. Register trademarks, file patents, and use proper agreements (NDAs, work-for-hire, IP assignment) with employees and contractors.',
      'Stay current on regulatory compliance for your industry. Non-compliance can result in fines, license revocation, and personal liability for officers and directors.',
      'Consider including alternative dispute resolution (arbitration or mediation) clauses in your contracts. Litigation is expensive and time-consuming; ADR can resolve disputes faster and at lower cost.',
    ],
    faq: [
      {
        q: 'How much does a business lawyer cost?',
        a: 'Business attorneys charge $250-$700 per hour depending on experience and market. Common flat-fee services include: business formation ($500-$2,000), operating agreement ($1,000-$3,000), and standard contract drafting ($500-$5,000). For ongoing legal needs, many businesses use monthly retainer arrangements ($1,000-$5,000/month). M&A transactions and complex litigation are typically billed hourly and can cost $10,000-$100,000+.',
      },
      {
        q: 'What type of business entity should I form?',
        a: 'The best entity depends on your specific situation. Sole proprietorships are simplest but offer no liability protection. LLCs provide liability protection and tax flexibility and are ideal for most small businesses. S-corporations can reduce self-employment taxes for profitable businesses. C-corporations are necessary for venture capital funding and offer unlimited growth potential. Partnerships are suitable for professional services firms. Consult with a business attorney and tax advisor to determine the best structure for your goals.',
      },
      {
        q: 'Do I need a lawyer to start a business?',
        a: 'While you can form an LLC or corporation online without a lawyer, having a business attorney involved from the start is highly recommended. Common startup issues that require legal expertise include: choosing the right entity type, drafting operating agreements or bylaws, ensuring regulatory compliance, protecting intellectual property, drafting founder agreements, and setting up proper employment relationships. The cost of early legal advice ($1,000-$3,000) can prevent much more expensive problems later.',
      },
      {
        q: 'What is an operating agreement and do I need one?',
        a: 'An operating agreement is the governing document for an LLC that defines ownership percentages, profit distribution, management structure, voting rights, and procedures for adding/removing members and dissolving the company. While not legally required in all states, every LLC should have one. Without an operating agreement, your LLC is governed by your state\'s default rules, which may not align with the members\' intentions. Single-member LLCs also benefit from operating agreements to strengthen liability protection.',
      },
      {
        q: 'How do I protect my personal assets from business liabilities?',
        a: 'Form a proper entity (LLC or corporation), maintain strict separation of personal and business finances, adequately capitalize the business, maintain proper corporate formalities (meeting minutes, annual filings, separate tax returns), obtain adequate business insurance, and use contracts that properly identify the business (not you personally) as the contracting party. Even with an entity, personal guarantees on loans or leases will expose your personal assets for those specific obligations.',
      },
      {
        q: 'What should I do if a business partner dispute arises?',
        a: 'First, review your operating agreement or partnership agreement for dispute resolution provisions. Many agreements require mediation or arbitration before litigation. If no agreement exists or the agreement does not address the dispute, consult a business attorney to understand your options. Resolution methods include negotiation, mediation, arbitration, buyout of one partner\'s interest, or as a last resort, judicial dissolution. Acting quickly is important to prevent further damage to the business.',
      },
      {
        q: 'When does my business need a lawyer on an ongoing basis?',
        a: 'You should consult a business attorney when: entering into significant contracts, hiring employees, dealing with regulatory inquiries, facing lawsuits or threatened litigation, considering acquisitions or investments, dealing with partner disputes, expanding to new states or countries, or navigating industry-specific regulations. Many growing businesses benefit from a monthly retainer arrangement that provides ongoing access to legal counsel as issues arise.',
      },
    ],
    certifications: [
      'Board Certified in Business Law (state bar certification)',
      'Member, American Bar Association Section of Business Law',
      'Fellow, American College of Governance Counsel',
      'Certified Compliance and Ethics Professional (CCEP)',
      'Super Lawyers or Best Lawyers recognition in Corporate Law',
      'AV Preeminent Martindale-Hubbell Rating',
      'Member, Association of Corporate Counsel (ACC)',
      'State bar business law specialty certification',
    ],
    averageResponseTime: 'Entity formation: 1-2 weeks; contract review: 2-5 business days; M&A representation: varies by deal complexity',
  },

  solier: {
    slug: 'solier',
    name: 'Intellectual Property Law',
    priceRange: {
      min: 300,
      max: 600,
      unit: '$/hr',
    },
    commonTasks: [
      'Trademark search and registration (per mark): $1,500-$3,500',
      'Utility patent application filing: $8,000-$15,000+',
      'Design patent application: $3,000-$6,000',
      'Copyright registration: $500-$1,500',
      'Trademark opposition or cancellation proceeding: $10,000-$30,000',
      'Patent infringement litigation: $50,000-$500,000+',
      'Cease and desist letter (IP enforcement): $1,000-$3,000',
      'IP licensing agreement drafting: $3,000-$10,000',
    ],
    tips: [
      'Protect your intellectual property early, before launching a product or disclosing your invention publicly. Public disclosure can bar patent rights in most countries and weaken trade secret protection.',
      'Conduct a comprehensive trademark search before investing in a brand name. A clearance search ($500-$1,500) is far less expensive than rebranding after receiving a cease and desist letter or losing a trademark dispute.',
      'Register your trademarks with the USPTO. Federal registration provides nationwide priority, the ability to sue in federal court, access to enhanced damages, and the right to use the (R) symbol. State common law rights are limited to the geographic area of actual use.',
      'For inventions, file a patent application before any public disclosure, sale, or offer for sale. The US follows a "first to file" system, so delay creates risk. A provisional patent application ($1,500-$3,000) provides a 12-month window to file a full application.',
      'Use proper IP agreements with all employees and contractors: assignment of inventions, work-for-hire agreements, confidentiality/NDA agreements, and non-compete agreements where enforceable. Without written agreements, IP ownership can be disputed.',
      'Copyright protection exists automatically upon creation of an original work, but registration with the US Copyright Office ($45-$125 filing fee) is required before you can sue for infringement and allows you to seek statutory damages and attorney fees.',
      'Keep detailed records of your creative and inventive processes: dated lab notebooks, design files with timestamps, correspondence, and development records. This evidence can be critical in IP disputes.',
      'Consider international IP protection if you plan to operate or sell in foreign markets. Patent and trademark rights are territorial; US registrations do not protect you abroad.',
    ],
    faq: [
      {
        q: 'How much does it cost to get a patent?',
        a: 'A utility patent application typically costs $8,000-$15,000+ for attorney fees, plus $1,600-$3,200 in USPTO filing fees (depending on entity size). Total costs through patent issuance (including office action responses) typically range from $15,000-$30,000 over 2-4 years. Design patents are less expensive ($3,000-$6,000 attorney fees). A provisional patent application costs $1,500-$3,000 and provides a 12-month priority date while you evaluate commercial viability.',
      },
      {
        q: 'What is the difference between a trademark, patent, and copyright?',
        a: 'Trademarks protect brand identifiers (names, logos, slogans, sounds) that distinguish your goods or services from others. Patents protect inventions (utility patents for functional inventions, design patents for ornamental designs). Copyrights protect original creative works (writing, music, art, software code, photographs). Each has different requirements, protection duration, and registration processes. A single product may be protected by all three: the brand name (trademark), the technology (patent), and the user manual (copyright).',
      },
      {
        q: 'How long does trademark registration take?',
        a: 'The trademark registration process typically takes 8-12 months from filing to registration if there are no complications. The timeline includes: filing the application (immediate), examination by a USPTO attorney (3-4 months), publication for opposition (30-day period), and if no opposition, registration (2-3 months after publication). If the USPTO issues an office action (refusal), responding adds 3-6 months. If there is an opposition proceeding, it can add 1-3 years.',
      },
      {
        q: 'What should I do if someone is infringing my intellectual property?',
        a: 'First, document the infringement thoroughly (screenshots, purchases, records of sales). Consult an IP attorney to evaluate the strength of your claim and the best strategy. Options range from a cease and desist letter ($1,000-$3,000, resolves many disputes) to DMCA takedown notices (for online copyright infringement) to litigation. Consider whether licensing or a coexistence agreement might be preferable to costly litigation. Act promptly, as delay can weaken your position and allow the infringement to grow.',
      },
      {
        q: 'Do I need a patent attorney to file a patent?',
        a: 'While you can file a patent application yourself (pro se), it is strongly recommended to use a patent attorney or patent agent who is registered with the USPTO. Patent prosecution is highly technical, and poorly drafted applications often result in weak patents with narrow claims or outright rejection. Studies show that applications filed by registered practitioners have significantly higher allowance rates and result in stronger patent protection.',
      },
      {
        q: 'How long does a patent last?',
        a: 'Utility patents last 20 years from the filing date, provided maintenance fees are paid at 3.5, 7.5, and 11.5 years after issuance. Design patents filed after May 13, 2015 last 15 years from issuance with no maintenance fees. Patents cannot be renewed or extended (except in limited circumstances for pharmaceutical patents). After expiration, the invention enters the public domain. Trade secrets, in contrast, can theoretically last forever as long as secrecy is maintained.',
      },
      {
        q: 'Can I trademark a common word?',
        a: 'It depends on the context. Common words can be trademarked if they are used in a distinctive way unrelated to their ordinary meaning (e.g., "Apple" for computers, "Delta" for airlines). Descriptive terms (like "Tasty" for food) are generally not registrable unless they have acquired secondary meaning through extensive use. Generic terms (like "Computer" for computers) can never be trademarked. An IP attorney can advise on the strength and registrability of your proposed mark.',
      },
    ],
    certifications: [
      'Registered Patent Attorney (USPTO registration required for patent practice)',
      'Board Certified in Intellectual Property Law (state bar certification)',
      'Member, American Intellectual Property Law Association (AIPLA)',
      'Fellow, American College of Intellectual Property Law Attorneys',
      'Certified Licensing Professional (CLP)',
      'Super Lawyers or Best Lawyers recognition in Intellectual Property',
      'AV Preeminent Martindale-Hubbell Rating',
      'Member, International Trademark Association (INTA)',
    ],
    averageResponseTime: 'Trademark filing: 1-2 weeks; patent consultations: 1-2 weeks; cease and desist letters: 3-5 business days',
  },

  cuisiniste: {
    slug: 'cuisiniste',
    name: 'Workers\' Compensation',
    priceRange: {
      min: 0,
      max: 0,
      unit: 'contingency (typically 15-20% of benefits)',
    },
    commonTasks: [
      'Workers\' compensation claim filing and representation: contingency fee 15-20%',
      'Denied claim appeal: contingency fee 15-20% of recovered benefits',
      'Permanent disability rating dispute: contingency fee 15-20%',
      'Third-party liability claim related to workplace injury: contingency fee 33-40%',
      'Workplace injury settlement negotiation: contingency fee 15-20%',
      'Medical treatment authorization dispute: included in claim representation',
      'Return-to-work dispute / light duty issues: included in representation',
      'Death benefits claim for surviving family: contingency fee 15-20%',
    ],
    tips: [
      'Report any workplace injury to your employer immediately, regardless of how minor it may seem. In most states, you must report within 30-90 days, and failure to report on time can result in loss of benefits.',
      'Seek medical attention right away after a workplace injury. Your employer or their insurance company may direct you to a specific doctor initially, but most states allow you to choose your own physician after the initial visit or for a second opinion.',
      'Document everything about your injury: write down exactly what happened, when, where, and who witnessed it. Take photos of the hazardous condition or equipment involved. Keep copies of all medical records and bills.',
      'Workers\' compensation is a no-fault system; you do not need to prove your employer was negligent. You are entitled to benefits if your injury arose out of and in the course of your employment.',
      'Do not sign any documents from the insurance company without having them reviewed by an attorney, especially settlement offers or medical treatment waivers.',
      'Workers\' compensation attorneys work on contingency (typically 15-20% of your benefits), so you pay nothing upfront and nothing if you do not receive benefits.',
      'If your workers\' compensation claim is denied, you have the right to appeal. Many initially denied claims are successful on appeal, especially with attorney representation.',
      'Be honest about your medical condition and limitations. Surveillance by insurance companies is common, and inconsistencies between your claimed limitations and observed activities can be used to deny or reduce your benefits.',
    ],
    faq: [
      {
        q: 'How much does a workers\' compensation lawyer cost?',
        a: 'Workers\' compensation attorneys work on contingency, meaning you pay nothing upfront. Attorney fees are typically 15-20% of the benefits you receive, and in many states, the fee percentage is set or capped by law. The fee is approved by the workers\' compensation judge. If you do not receive benefits, you owe nothing. There is no financial risk to hiring an attorney for a workers\' compensation claim.',
      },
      {
        q: 'What benefits am I entitled to under workers\' compensation?',
        a: 'Workers\' compensation typically provides: (1) medical treatment for your work-related injury or illness (all reasonable and necessary treatment); (2) temporary disability benefits (typically 66.67% of your average weekly wage) while you are unable to work; (3) permanent disability benefits if you have lasting impairment; (4) vocational rehabilitation if you cannot return to your previous job; and (5) death benefits for dependents if a worker dies from a work-related injury or illness. Specific benefits and calculations vary by state.',
      },
      {
        q: 'Can I be fired for filing a workers\' compensation claim?',
        a: 'No. It is illegal for an employer to fire, demote, harass, or retaliate against an employee for filing a workers\' compensation claim. If you experience retaliation, you may have a separate legal claim against your employer for wrongful termination or retaliation. However, workers\' compensation does not guarantee job protection indefinitely; your employer may be able to fill your position if you cannot return to work after a reasonable period, depending on state law and any applicable FMLA protections.',
      },
      {
        q: 'What should I do if my workers\' compensation claim is denied?',
        a: 'Do not give up. Many claims are initially denied and then succeed on appeal. Common reasons for denial include: disputes about whether the injury is work-related, missed filing deadlines, insufficient medical documentation, or pre-existing conditions. Contact a workers\' compensation attorney immediately, as there are strict deadlines for filing an appeal (typically 15-90 days depending on the state). An attorney can help gather additional evidence and present your case before a workers\' compensation judge.',
      },
      {
        q: 'Can I sue my employer for a workplace injury?',
        a: 'Generally, no. Workers\' compensation is an exclusive remedy system, meaning you receive guaranteed benefits regardless of fault but cannot sue your employer for additional damages (like pain and suffering). However, exceptions exist: you may be able to sue if your employer acted with intentional misconduct, if a third party (not your employer) caused or contributed to your injury (e.g., a negligent driver, a defective product manufacturer), or if your employer does not carry required workers\' compensation insurance.',
      },
      {
        q: 'Do I need to see the company doctor?',
        a: 'This depends on your state\'s laws. Some states require you to see a doctor chosen by your employer or their insurance company, at least initially. Other states allow you to choose your own doctor from the start. Most states allow you to request a change of physician or get a second opinion if you are unsatisfied with the treatment you are receiving. Your attorney can advise you on your state\'s specific rules regarding medical provider choice.',
      },
      {
        q: 'What if my injury was partly my fault?',
        a: 'Workers\' compensation is a no-fault system, meaning you are entitled to benefits even if the injury was partially or entirely your fault. Exceptions may apply if you were intoxicated, engaged in willful misconduct, or intentionally self-inflicted the injury. Your employer\'s negligence (or lack thereof) is also irrelevant to your right to benefits. This no-fault trade-off is the core principle of workers\' compensation law.',
      },
    ],
    emergencyInfo:
      'If you have been seriously injured at work, call 911 immediately if needed. Report the injury to your supervisor right away and seek medical attention. If your employer does not have workers\' compensation insurance or refuses to file a claim, contact your state\'s workers\' compensation board. Many states have uninsured employer funds to cover injuries when employers fail to maintain coverage.',
    certifications: [
      'Board Certified in Workers\' Compensation Law (state bar certification)',
      'Certified Workers\' Compensation Specialist',
      'Member, Workers\' Injury Law and Advocacy Group (WILG)',
      'Member, American Bar Association Workers\' Compensation Section',
      'Super Lawyers or Best Lawyers recognition in Workers\' Compensation',
      'AV Preeminent Martindale-Hubbell Rating',
      'State bar workers\' compensation specialty certification',
      'Fellow, College of Workers\' Compensation Lawyers',
    ],
    averageResponseTime: 'Free consultation within 1-3 business days; urgent claim denials within 24 hours',
  },

  nettoyage: {
    slug: 'nettoyage',
    name: 'Civil Litigation',
    priceRange: {
      min: 200,
      max: 500,
      unit: '$/hr',
    },
    commonTasks: [
      'Breach of contract lawsuit: $5,000-$25,000+ depending on amount in dispute',
      'Business tort litigation (fraud, interference): $10,000-$50,000+',
      'Construction defect claim: $5,000-$30,000',
      'Insurance coverage dispute: $5,000-$20,000 or contingency',
      'Real property dispute (boundary, easement, title): $5,000-$25,000',
      'Debt collection defense: $2,000-$7,500',
      'Defamation / libel / slander lawsuit: $5,000-$30,000+',
      'Appeals (state or federal): $10,000-$50,000+',
    ],
    tips: [
      'Before filing a lawsuit, calculate the realistic cost of litigation versus the potential recovery. Many disputes are not economically viable to litigate, and alternative dispute resolution (mediation, arbitration) is often more cost-effective.',
      'Preserve all documents, emails, text messages, and electronically stored information as soon as a dispute arises. Destroying evidence (even inadvertently through routine deletion) after litigation is anticipated can result in severe sanctions.',
      'Understand the difference between the amount you are owed and the amount you will actually recover. Even with a favorable judgment, collecting from the defendant can be difficult and may require additional legal proceedings.',
      'Consider mediation early in the process. Studies show that over 80% of mediated civil disputes settle, often saving both parties tens of thousands of dollars in litigation costs.',
      'Be realistic about timelines. Civil litigation typically takes 1-3 years from filing to trial, and appeals can add another 1-2 years. Plan accordingly.',
      'Review any applicable contracts for dispute resolution clauses, forum selection clauses, and attorney fee provisions before filing suit. These clauses can significantly affect your strategy and potential recovery.',
      'Litigation holds are mandatory once litigation is reasonably anticipated. Inform your IT department, employees, and anyone who might have relevant documents or data to preserve all potentially relevant materials.',
      'Small claims court (typically for disputes under $5,000-$15,000 depending on the state) offers a faster, less expensive alternative for straightforward matters. Attorneys are often not required and sometimes not permitted.',
    ],
    faq: [
      {
        q: 'How much does it cost to file a civil lawsuit?',
        a: 'The total cost depends on the complexity of the case. Attorney fees for civil litigation typically range from $200-$500/hr. A straightforward breach of contract case might cost $5,000-$25,000 through trial. Complex commercial litigation can exceed $100,000. Additional costs include court filing fees ($200-$500), deposition costs ($1,000-$3,000 per deposition), expert witness fees ($5,000-$25,000), and discovery-related expenses. Some cases (fraud, certain consumer claims) allow the winning party to recover attorney fees.',
      },
      {
        q: 'How long does a civil lawsuit take?',
        a: 'Timelines vary significantly. A simple breach of contract case in state court may take 12-18 months from filing to trial. Complex commercial litigation can take 2-4 years. Federal court cases often move faster than state court. The phases include: pre-suit demand/negotiation (1-3 months), pleading and early motions (2-4 months), discovery (6-12 months), pre-trial motions (2-4 months), trial (days to weeks), and possible appeal (12-24 months). Over 95% of civil cases settle before trial.',
      },
      {
        q: 'What is the difference between civil and criminal litigation?',
        a: 'Civil litigation involves disputes between private parties (individuals, businesses, organizations) and seeks remedies like monetary damages, injunctions, or specific performance. Criminal litigation involves the government prosecuting individuals for violations of criminal law, with potential penalties including imprisonment and fines. The burden of proof is lower in civil cases ("preponderance of evidence" or 51%) compared to criminal cases ("beyond a reasonable doubt"). The same act can give rise to both civil and criminal proceedings.',
      },
      {
        q: 'Can I represent myself in a civil lawsuit?',
        a: 'Yes, you have the right to represent yourself (pro se) in civil court. However, civil litigation involves complex procedural rules, evidentiary requirements, and legal standards that can be extremely difficult to navigate without legal training. Courts hold pro se litigants to the same procedural standards as attorneys. For small claims court, self-representation is common and practical. For cases in regular civil court, especially those involving significant amounts, professional representation is strongly recommended.',
      },
      {
        q: 'What is the statute of limitations for civil claims?',
        a: 'Statutes of limitations vary by state and claim type. Common timeframes include: breach of written contract (4-6 years), breach of oral contract (2-4 years), personal injury (1-6 years), property damage (2-6 years), fraud (2-6 years), and defamation (1-3 years). The clock typically starts when the cause of action accrues (when you knew or should have known about the harm). Missing the statute of limitations permanently bars your claim regardless of its merits.',
      },
      {
        q: 'What is discovery in a lawsuit?',
        a: 'Discovery is the pre-trial process where each party can obtain information and evidence from the other party and third parties. Discovery tools include: interrogatories (written questions), requests for production of documents, requests for admission, and depositions (sworn testimony). Discovery is often the most expensive and time-consuming phase of litigation, sometimes lasting 6-12 months. Electronic discovery (e-discovery) involving emails and digital records has become a major component and cost driver.',
      },
      {
        q: 'What happens if I win a lawsuit but the defendant does not pay?',
        a: 'A court judgment does not automatically result in payment. If the defendant does not voluntarily pay, you must take additional steps to collect, including: wage garnishment, bank account levy, property liens, asset discovery (requiring the debtor to disclose assets under oath), and in some cases seizure and sale of property. Collection can be difficult if the defendant has limited assets or files for bankruptcy. Consider the defendant\'s ability to pay before investing in litigation.',
      },
    ],
    certifications: [
      'Board Certified in Civil Trial Law (National Board of Trial Advocacy)',
      'Board Certified in Civil Trial Law (state bar certification)',
      'Fellow, American College of Trial Lawyers',
      'Member, American Board of Trial Advocates (ABOTA)',
      'Certified Civil Mediator',
      'Super Lawyers or Best Lawyers recognition in Civil Litigation',
      'AV Preeminent Martindale-Hubbell Rating',
      'Member, Litigation Section of the American Bar Association',
    ],
    averageResponseTime: 'Initial consultation within 1-5 business days; time-sensitive matters (TROs, emergency injunctions) within 24 hours',
  },

  jardinier: {
    slug: 'jardinier',
    name: 'Environmental Law',
    priceRange: {
      min: 250,
      max: 600,
      unit: '$/hr',
    },
    commonTasks: [
      'Environmental regulatory compliance review: $5,000-$20,000',
      'Environmental impact assessment coordination: $10,000-$50,000',
      'Environmental permit application: $5,000-$25,000',
      'Contaminated site remediation legal counsel: $10,000-$50,000+',
      'CERCLA (Superfund) liability defense: $25,000-$200,000+',
      'Clean Water Act or Clean Air Act compliance: $5,000-$30,000',
      'Environmental due diligence for property transactions: $3,000-$10,000',
      'Citizen suit under federal environmental statutes: $10,000-$50,000+',
    ],
    tips: [
      'Conduct Phase I and Phase II Environmental Site Assessments before purchasing commercial or industrial property. Environmental contamination liability can follow the property regardless of who caused the contamination.',
      'Maintain meticulous records of all environmental compliance activities, permits, monitoring data, and waste disposal manifests. Regulators expect thorough documentation, and gaps can lead to enforcement actions.',
      'If you discover contamination on your property, consult an environmental attorney before reporting to regulators. Voluntary disclosure can provide benefits, but the strategy must be carefully managed.',
      'Understand that environmental liability can be retroactive, strict (no fault required), joint and several (one party can be liable for the entire cleanup), and can pierce the corporate veil. The financial exposure can be enormous.',
      'Stay current on evolving environmental regulations. EPA standards, state environmental laws, and local ordinances change frequently, and non-compliance can result in penalties of up to $60,000+ per day per violation under federal law.',
      'If your business generates hazardous waste, ensure compliance with RCRA requirements for generation, storage, transportation, and disposal. Cradle-to-grave liability means generators remain responsible even after waste leaves their facility.',
      'For real estate transactions, environmental representations and warranties, indemnification provisions, and environmental insurance can help allocate and manage contamination risk between buyer and seller.',
      'Public participation is a key component of environmental law. Community members have rights to comment on permits, access environmental data, and bring citizen suits against violators under most federal environmental statutes.',
    ],
    faq: [
      {
        q: 'How much does an environmental lawyer cost?',
        a: 'Environmental attorneys typically charge $250-$600 per hour depending on specialization and experience. Common engagements include: compliance review ($5,000-$20,000), permit applications ($5,000-$25,000), environmental due diligence ($3,000-$10,000), and contamination liability defense ($25,000-$200,000+). For citizen environmental lawsuits, some attorneys work on contingency or are awarded fees by the court under fee-shifting provisions in federal environmental statutes.',
      },
      {
        q: 'What is CERCLA and how does Superfund liability work?',
        a: 'CERCLA (the Comprehensive Environmental Response, Compensation, and Liability Act), also known as Superfund, holds potentially responsible parties (PRPs) liable for the cost of cleaning up contaminated sites. Liability is strict (no fault required), retroactive (applies to past actions), and joint and several (each PRP can be held liable for the entire cleanup cost). PRPs include current and former property owners, operators, generators of hazardous waste, and transporters. Cleanup costs can range from millions to hundreds of millions of dollars.',
      },
      {
        q: 'What should I do if I find contamination on my property?',
        a: 'Consult an environmental attorney immediately before reporting to regulators. Your attorney will help you: assess the extent and type of contamination, understand your legal obligations, evaluate voluntary cleanup programs (which often provide liability protection and faster timelines), develop a remediation strategy, and identify potentially responsible parties who may share liability. Many states offer brownfield incentives and liability protections for voluntary cleanups that can significantly reduce your exposure.',
      },
      {
        q: 'What are the penalties for violating environmental laws?',
        a: 'Penalties for environmental violations can be severe. Civil penalties under federal law (Clean Water Act, Clean Air Act, RCRA) can reach $60,000+ per day per violation. Criminal penalties for knowing violations can include fines of $50,000-$1,000,000 per day and imprisonment of up to 15 years for knowing endangerment. In addition, violators may be required to fund cleanup and remediation, pay natural resource damages, and face debarment from government contracts.',
      },
      {
        q: 'What is an Environmental Impact Statement (EIS)?',
        a: 'An EIS is a detailed document required under the National Environmental Policy Act (NEPA) for major federal actions that significantly affect the environment. It analyzes the environmental impacts of a proposed action, considers alternatives, and proposes mitigation measures. State equivalents (like California\'s CEQA) apply to state and local projects. The EIS process can take 1-5 years and involves public comment periods. Legal challenges to the adequacy of an EIS are common and can delay or block projects.',
      },
      {
        q: 'Do environmental laws apply to small businesses?',
        a: 'Yes. Environmental regulations apply to businesses of all sizes, though specific requirements may vary based on the volume of emissions, waste generated, or water discharged. Small businesses should be aware of: hazardous waste generator requirements (even small quantity generators have obligations), stormwater discharge permits, air emission permits, underground storage tank regulations, and chemical storage reporting requirements. The EPA and state agencies offer small business compliance assistance programs.',
      },
      {
        q: 'Can I sue a company for environmental contamination affecting my property?',
        a: 'Yes. You may have claims under: CERCLA (to recover cleanup costs), state environmental statutes, common law theories (trespass, nuisance, negligence, strict liability), and toxic tort claims (if contamination has affected your health). You may also be able to bring a citizen suit under federal environmental statutes if a company is violating its permit or environmental regulations. An environmental attorney can evaluate the strength of your claims and available remedies.',
      },
    ],
    emergencyInfo:
      'If you discover an environmental emergency (chemical spill, hazardous waste release, contamination of water supply), call 911 for immediate safety threats and report to the National Response Center at 1-800-424-8802 for hazardous substance releases. Contact your state environmental agency and an environmental attorney as soon as possible to manage regulatory reporting obligations and protect your legal interests.',
    certifications: [
      'Board Certified in Environmental Law (state bar certification)',
      'Member, American College of Environmental Lawyers (ACOEL)',
      'Member, American Bar Association Section of Environment, Energy, and Resources',
      'Certified Environmental Professional (CEP)',
      'Super Lawyers or Best Lawyers recognition in Environmental Law',
      'AV Preeminent Martindale-Hubbell Rating',
      'Member, Environmental Law Institute (ELI)',
      'State bar environmental law specialty certification',
    ],
    averageResponseTime: 'Regulatory compliance: 1-2 weeks; environmental emergencies (spills, enforcement actions): same-day response',
  },
}

/**
 * Retrieves the content for a practice area by its slug.
 * Returns undefined if the slug does not exist.
 */
export function getTradeContent(slug: string): TradeContent | undefined {
  return tradeContent[slug]
}

/**
 * Retrieves all available practice area slugs.
 */
export function getTradesSlugs(): string[] {
  return Object.keys(tradeContent)
}

/**
 * Slugifies a task name for use in the URL /pricing/[service]/[location]/[task].
 */
export function slugifyTask(taskName: string): string {
  return taskName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Parses a task from commonTasks (format "name: price").
 */
export function parseTask(task: string): { name: string; slug: string; priceText: string } {
  const colonIdx = task.indexOf(':')
  if (colonIdx === -1) return { name: task.trim(), slug: slugifyTask(task.trim()), priceText: '' }
  const name = task.substring(0, colonIdx).trim()
  const priceText = task.substring(colonIdx + 1).trim()
  return { name, slug: slugifyTask(name), priceText }
}

/** Returns all parsed tasks for a practice area */
export function getTasksForService(specialtySlug: string): { name: string; slug: string; priceText: string }[] {
  const trade = tradeContent[specialtySlug]
  if (!trade) return []
  return trade.commonTasks.map(parseTask)
}
