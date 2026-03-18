/**
 * Legal Issue Assessment Engine
 *
 * Decision tree mapping categories -> subcategories -> practice areas.
 * 75+ terminal nodes covering all major practice areas.
 *
 * Used by /tools/legal-assessment to guide users to the right attorney type.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubCategory {
  id: string
  label: string
  description: string
  icon: string
  /** Practice area slugs ordered by relevance (first = primary) */
  practiceAreas: { slug: string; name: string; confidence: number }[]
  /** Approximate statute of limitations in years (null = varies widely) */
  solYears?: number | null
  /** Whether timeline is typically urgent for this issue */
  inherentlyUrgent?: boolean
  /** What to bring to the first consultation */
  preparationChecklist: string[]
  /** Deadline warning text when SOL is relevant */
  deadlineNote?: string
}

export interface Category {
  id: string
  label: string
  description: string
  icon: string
  subCategories: SubCategory[]
}

export type UrgencyLevel = 'immediate' | 'within-weeks' | 'planning-ahead'

export interface AssessmentAnswers {
  categoryId: string
  subCategoryId: string
  timelineMonths?: number // how many months ago did this happen
  stateCode?: string
  urgency: UrgencyLevel
}

export interface AssessmentRecommendation {
  practiceAreas: { slug: string; name: string; confidence: number }[]
  urgency: UrgencyLevel
  deadlineWarning?: string
  preparationChecklist: string[]
  categoryLabel: string
  subCategoryLabel: string
}

// ---------------------------------------------------------------------------
// Decision Tree — 7 categories, 75+ terminal nodes
// ---------------------------------------------------------------------------

export const assessmentCategories: Category[] = [
  // ========================================================================
  // 1. PERSONAL / FAMILY
  // ========================================================================
  {
    id: 'personal-family',
    label: 'Personal / Family',
    description: 'Injuries, divorce, custody, wills, and family matters',
    icon: 'Users',
    subCategories: [
      {
        id: 'personal-injury-car',
        label: 'Car Accident Injury',
        description: 'Injured in a car, truck, or motorcycle accident',
        icon: 'Car',
        practiceAreas: [
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 95 },
          { slug: 'car-accidents', name: 'Car Accidents', confidence: 90 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Police report and accident number',
          'Photos of the accident scene and vehicle damage',
          'Medical records and bills from treatment',
          'Insurance policy information (yours and the other driver\'s)',
          'Contact info of any witnesses',
          'Record of missed work days and lost wages',
        ],
        deadlineNote: 'Most states have a 2-3 year statute of limitations for personal injury claims. Act quickly to preserve evidence.',
      },
      {
        id: 'personal-injury-slip',
        label: 'Slip and Fall / Premises Liability',
        description: 'Injured on someone else\'s property',
        icon: 'AlertTriangle',
        practiceAreas: [
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 92 },
          { slug: 'premises-liability', name: 'Premises Liability', confidence: 88 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Incident report filed with the property owner/manager',
          'Photos of the hazardous condition',
          'Medical records and treatment documentation',
          'Witness contact information',
          'Clothing or shoes worn at the time (preserve them)',
          'Documentation of any prior complaints about the hazard',
        ],
        deadlineNote: 'Statute of limitations for premises liability is typically 2-3 years but can be shorter for government property.',
      },
      {
        id: 'personal-injury-medical',
        label: 'Medical Malpractice',
        description: 'Harmed by a doctor, hospital, or medical provider',
        icon: 'Stethoscope',
        practiceAreas: [
          { slug: 'medical-malpractice', name: 'Medical Malpractice', confidence: 95 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 70 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Complete medical records from the provider in question',
          'Records from any subsequent treating physicians',
          'Written timeline of symptoms and treatments',
          'Copies of informed consent documents you signed',
          'Medical bills and insurance statements',
          'Names and contact info of all medical providers involved',
        ],
        deadlineNote: 'Medical malpractice has strict deadlines (often 1-3 years) and many states require a certificate of merit before filing.',
      },
      {
        id: 'personal-injury-dog-bite',
        label: 'Dog Bite / Animal Attack',
        description: 'Bitten or attacked by someone else\'s pet or animal',
        icon: 'AlertTriangle',
        practiceAreas: [
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 90 },
          { slug: 'premises-liability', name: 'Premises Liability', confidence: 70 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Animal control report (if filed)',
          'Photos of injuries and the animal',
          'Medical records and bills',
          'Owner\'s contact and insurance information',
          'Witness statements',
          'Any history of prior incidents with the same animal',
        ],
      },
      {
        id: 'nursing-home-abuse',
        label: 'Nursing Home Abuse / Neglect',
        description: 'A loved one was abused or neglected in a care facility',
        icon: 'ShieldAlert',
        practiceAreas: [
          { slug: 'nursing-home-abuse', name: 'Nursing Home Abuse', confidence: 95 },
          { slug: 'elder-law', name: 'Elder Law', confidence: 80 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 65 },
        ],
        solYears: 2,
        inherentlyUrgent: true,
        preparationChecklist: [
          'Admission agreement and care plan',
          'Medical records from the facility',
          'Photos of injuries or poor conditions',
          'Incident reports filed with the facility',
          'State inspection reports (available online)',
          'Contact info for other residents or families as witnesses',
        ],
      },
      {
        id: 'personal-injury-work',
        label: 'Workplace Injury',
        description: 'Injured on the job or occupational illness',
        icon: 'HardHat',
        practiceAreas: [
          { slug: 'workers-compensation', name: 'Workers\' Compensation', confidence: 95 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 60 },
        ],
        solYears: 1,
        inherentlyUrgent: true,
        preparationChecklist: [
          'Workers\' comp claim number (if already filed)',
          'Incident report filed with your employer',
          'Medical records related to the injury',
          'Employment records and pay stubs',
          'Names of witnesses to the injury',
          'Any correspondence from your employer or their insurer',
        ],
        deadlineNote: 'Workers\' comp claims often have very short deadlines — you may need to report within 30 days and file within 1-2 years.',
      },
      {
        id: 'personal-injury-product',
        label: 'Defective Product Injury',
        description: 'Harmed by a dangerous or defective product',
        icon: 'Package',
        practiceAreas: [
          { slug: 'product-liability', name: 'Product Liability', confidence: 93 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 75 },
        ],
        solYears: 3,
        preparationChecklist: [
          'The defective product itself (preserve it as-is)',
          'Purchase receipt or proof of purchase',
          'Product packaging, manuals, and warranty info',
          'Photos of the product defect and your injuries',
          'Medical records from treatment',
          'Any recall notices related to the product',
        ],
      },
      {
        id: 'wrongful-death',
        label: 'Wrongful Death',
        description: 'A loved one died due to someone else\'s negligence',
        icon: 'Heart',
        practiceAreas: [
          { slug: 'wrongful-death', name: 'Wrongful Death', confidence: 95 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 70 },
        ],
        solYears: 2,
        inherentlyUrgent: true,
        preparationChecklist: [
          'Death certificate',
          'Medical records of the deceased',
          'Police or incident reports',
          'Documentation of your relationship to the deceased',
          'Financial records showing the deceased\'s income',
          'Funeral and burial expense receipts',
        ],
        deadlineNote: 'Wrongful death statutes of limitations vary by state (1-3 years). Some states require filing within 1 year.',
      },
      {
        id: 'divorce-uncontested',
        label: 'Divorce (Uncontested)',
        description: 'Both spouses agree on terms of the divorce',
        icon: 'FileText',
        practiceAreas: [
          { slug: 'divorce', name: 'Divorce', confidence: 95 },
          { slug: 'family-law', name: 'Family Law', confidence: 85 },
        ],
        preparationChecklist: [
          'Marriage certificate',
          'Financial statements (bank accounts, investments, debts)',
          'Property deeds and vehicle titles',
          'Tax returns from the last 3 years',
          'Proposed division of assets agreement',
          'Children\'s birth certificates (if applicable)',
        ],
      },
      {
        id: 'divorce-contested',
        label: 'Divorce (Contested)',
        description: 'Spouses cannot agree — need litigation support',
        icon: 'Gavel',
        practiceAreas: [
          { slug: 'divorce', name: 'Divorce', confidence: 95 },
          { slug: 'family-law', name: 'Family Law', confidence: 90 },
          { slug: 'child-custody', name: 'Child Custody', confidence: 60 },
        ],
        preparationChecklist: [
          'Marriage certificate',
          'Complete financial disclosure (all assets, debts, income)',
          'Property appraisals',
          'Evidence of any domestic issues (if relevant)',
          'Children\'s school and medical records',
          'Prenuptial or postnuptial agreement (if any)',
        ],
      },
      {
        id: 'child-custody',
        label: 'Child Custody / Visitation',
        description: 'Custody disputes, modification, or visitation rights',
        icon: 'Baby',
        practiceAreas: [
          { slug: 'child-custody', name: 'Child Custody', confidence: 95 },
          { slug: 'family-law', name: 'Family Law', confidence: 85 },
        ],
        preparationChecklist: [
          'Existing custody order (if any)',
          'Children\'s school records and extracurricular schedule',
          'Evidence of your involvement in the children\'s lives',
          'Documentation of any concerns about the other parent',
          'Communication records with the other parent',
          'Your proposed parenting schedule',
        ],
      },
      {
        id: 'child-support',
        label: 'Child Support',
        description: 'Establishing, modifying, or enforcing child support',
        icon: 'DollarSign',
        practiceAreas: [
          { slug: 'child-support', name: 'Child Support', confidence: 95 },
          { slug: 'family-law', name: 'Family Law', confidence: 80 },
        ],
        preparationChecklist: [
          'Current child support order (if any)',
          'Both parents\' income documentation',
          'Children\'s expenses (medical, education, childcare)',
          'Proof of any changed financial circumstances',
          'Records of payments made or missed',
          'Tax returns from the last 2 years',
        ],
      },
      {
        id: 'adoption',
        label: 'Adoption',
        description: 'Adopting a child (domestic, international, or stepparent)',
        icon: 'Heart',
        practiceAreas: [
          { slug: 'adoption', name: 'Adoption', confidence: 95 },
          { slug: 'family-law', name: 'Family Law', confidence: 75 },
        ],
        preparationChecklist: [
          'Home study report (if completed)',
          'Background check results',
          'Financial statements showing ability to support a child',
          'Medical records for all household members',
          'References from community members',
          'Birth certificates of the child (if identified)',
        ],
      },
      {
        id: 'estate-planning',
        label: 'Wills & Estate Planning',
        description: 'Creating a will, trust, or power of attorney',
        icon: 'Scroll',
        practiceAreas: [
          { slug: 'estate-planning', name: 'Estate Planning', confidence: 95 },
          { slug: 'wills-trusts', name: 'Wills & Trusts', confidence: 90 },
          { slug: 'elder-law', name: 'Elder Law', confidence: 50 },
        ],
        preparationChecklist: [
          'List of all assets (property, accounts, investments)',
          'List of all debts and liabilities',
          'Beneficiary designations on existing accounts',
          'Names and contact info of intended beneficiaries',
          'Existing will or trust documents (if updating)',
          'Healthcare directives preferences',
        ],
      },
      {
        id: 'probate',
        label: 'Probate / Estate Administration',
        description: 'Settling a deceased person\'s estate',
        icon: 'FileCheck',
        practiceAreas: [
          { slug: 'probate', name: 'Probate', confidence: 95 },
          { slug: 'estate-planning', name: 'Estate Planning', confidence: 70 },
        ],
        preparationChecklist: [
          'Death certificate (multiple certified copies)',
          'The deceased\'s will (if one exists)',
          'List of known assets and debts',
          'Bank and investment account statements',
          'Property deeds and vehicle titles',
          'Names and contact info of all heirs',
        ],
      },
      {
        id: 'elder-law',
        label: 'Elder Care / Guardianship',
        description: 'Guardianship, nursing home issues, or elder abuse',
        icon: 'ShieldCheck',
        practiceAreas: [
          { slug: 'elder-law', name: 'Elder Law', confidence: 95 },
          { slug: 'estate-planning', name: 'Estate Planning', confidence: 55 },
        ],
        preparationChecklist: [
          'Medical records and physician assessments',
          'Financial statements of the elderly person',
          'Existing power of attorney or guardianship documents',
          'Documentation of any suspected abuse or neglect',
          'List of medications and treating physicians',
          'Long-term care facility agreements',
        ],
      },
    ],
  },

  // ========================================================================
  // 2. BUSINESS
  // ========================================================================
  {
    id: 'business',
    label: 'Business',
    description: 'Contracts, partnerships, startups, and business disputes',
    icon: 'Briefcase',
    subCategories: [
      {
        id: 'business-formation',
        label: 'Starting a Business / Formation',
        description: 'LLC, corporation, partnership setup and compliance',
        icon: 'Building2',
        practiceAreas: [
          { slug: 'business-law', name: 'Business Law', confidence: 95 },
          { slug: 'corporate-law', name: 'Corporate Law', confidence: 80 },
        ],
        preparationChecklist: [
          'Proposed business name(s)',
          'Business plan or description of activities',
          'Names and roles of all owners/partners',
          'Desired business structure (LLC, Corp, etc.)',
          'Anticipated funding sources',
          'Industry-specific licensing requirements',
        ],
      },
      {
        id: 'contract-dispute',
        label: 'Contract Dispute',
        description: 'Breach of contract, non-payment, or contract interpretation',
        icon: 'FileWarning',
        practiceAreas: [
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 90 },
          { slug: 'contract-law', name: 'Contract Law', confidence: 92 },
          { slug: 'business-law', name: 'Business Law', confidence: 75 },
        ],
        solYears: 4,
        preparationChecklist: [
          'The original contract or agreement',
          'All amendments and addendums',
          'Correspondence regarding the dispute',
          'Evidence of the breach (emails, invoices, etc.)',
          'Documentation of damages suffered',
          'Any prior attempts to resolve the dispute',
        ],
      },
      {
        id: 'partnership-dispute',
        label: 'Partnership / Shareholder Dispute',
        description: 'Conflicts between business partners or shareholders',
        icon: 'Users',
        practiceAreas: [
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 92 },
          { slug: 'corporate-law', name: 'Corporate Law', confidence: 85 },
        ],
        preparationChecklist: [
          'Partnership or operating agreement',
          'Corporate bylaws or articles of organization',
          'Financial statements of the business',
          'Documentation of the dispute',
          'Meeting minutes and resolutions',
          'Any prior mediation or negotiation attempts',
        ],
      },
      {
        id: 'intellectual-property',
        label: 'Intellectual Property',
        description: 'Trademarks, patents, copyrights, or trade secrets',
        icon: 'Lightbulb',
        practiceAreas: [
          { slug: 'intellectual-property', name: 'Intellectual Property', confidence: 95 },
          { slug: 'patent-law', name: 'Patent Law', confidence: 70 },
          { slug: 'trademark-law', name: 'Trademark Law', confidence: 70 },
        ],
        preparationChecklist: [
          'Description of the intellectual property at issue',
          'Registration certificates (trademark, patent, copyright)',
          'Evidence of first use or creation date',
          'Any licensing agreements',
          'Evidence of infringement',
          'Cease and desist letters sent or received',
        ],
      },
      {
        id: 'business-tax',
        label: 'Business Tax Issues',
        description: 'Tax planning, audits, or disputes with the IRS',
        icon: 'Calculator',
        practiceAreas: [
          { slug: 'tax-law', name: 'Tax Law', confidence: 95 },
          { slug: 'business-law', name: 'Business Law', confidence: 60 },
        ],
        preparationChecklist: [
          'Business tax returns from the last 3 years',
          'IRS notices or audit letters',
          'Financial statements and bookkeeping records',
          'Correspondence with the IRS or state tax authority',
          'Payroll records',
          'List of current and former accountants/tax preparers',
        ],
      },
      {
        id: 'mergers-acquisitions',
        label: 'Mergers & Acquisitions',
        description: 'Buying, selling, or merging a business',
        icon: 'Combine',
        practiceAreas: [
          { slug: 'mergers-acquisitions', name: 'Mergers & Acquisitions', confidence: 95 },
          { slug: 'corporate-law', name: 'Corporate Law', confidence: 85 },
          { slug: 'business-law', name: 'Business Law', confidence: 70 },
        ],
        preparationChecklist: [
          'Business financial statements (3 years)',
          'Description of the proposed transaction',
          'List of assets and liabilities',
          'Existing contracts and lease agreements',
          'Employee roster and employment agreements',
          'Any pending litigation or regulatory issues',
        ],
      },
      {
        id: 'collections',
        label: 'Debt Collection / Creditor Rights',
        description: 'Collecting money owed to you or your business',
        icon: 'Banknote',
        practiceAreas: [
          { slug: 'collections', name: 'Collections', confidence: 90 },
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 75 },
        ],
        solYears: 4,
        preparationChecklist: [
          'The original contract or invoice',
          'Payment history and records of non-payment',
          'Demand letters sent',
          'Debtor\'s contact information and known assets',
          'Any communication from the debtor',
          'Statute of limitations for your state and debt type',
        ],
      },
      {
        id: 'franchise-law',
        label: 'Franchise Law',
        description: 'Buying, selling, or disputes related to a franchise',
        icon: 'Store',
        practiceAreas: [
          { slug: 'franchise-law', name: 'Franchise Law', confidence: 95 },
          { slug: 'business-law', name: 'Business Law', confidence: 70 },
        ],
        preparationChecklist: [
          'Franchise Disclosure Document (FDD)',
          'Franchise agreement',
          'Financial performance representations',
          'Correspondence with the franchisor',
          'Your financial records related to the franchise',
          'Territory maps and competition analysis',
        ],
      },
      {
        id: 'securities-law',
        label: 'Securities / Investment Fraud',
        description: 'Investment losses, broker misconduct, or SEC matters',
        icon: 'TrendingDown',
        practiceAreas: [
          { slug: 'securities-law', name: 'Securities Law', confidence: 95 },
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 65 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Investment account statements',
          'Prospectuses and offering documents',
          'Communication with your broker or advisor',
          'Documentation of losses',
          'Marketing materials that influenced your decision',
          'Any arbitration notices received',
        ],
      },
      {
        id: 'real-estate-commercial-lease',
        label: 'Commercial Lease Dispute',
        description: 'Disputes over commercial lease terms, rent, or eviction',
        icon: 'Building2',
        practiceAreas: [
          { slug: 'commercial-real-estate', name: 'Commercial Real Estate', confidence: 85 },
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 80 },
        ],
        preparationChecklist: [
          'Commercial lease agreement',
          'Correspondence with the landlord or tenant',
          'Rent payment records',
          'Photos of property condition issues',
          'Any notices received (default, eviction, etc.)',
          'Business financial records showing impact',
        ],
      },
      {
        id: 'business-insurance',
        label: 'Business Insurance Dispute',
        description: 'Insurance claim denied or underpaid for business loss',
        icon: 'ShieldCheck',
        practiceAreas: [
          { slug: 'insurance-law', name: 'Insurance Law', confidence: 90 },
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 75 },
        ],
        preparationChecklist: [
          'Insurance policy and declarations page',
          'Claim submission documents',
          'Denial or underpayment letter',
          'Proof of loss documentation',
          'Correspondence with the insurance adjuster',
          'Independent damage assessments or appraisals',
        ],
      },
    ],
  },

  // ========================================================================
  // 3. CRIMINAL
  // ========================================================================
  {
    id: 'criminal',
    label: 'Criminal',
    description: 'Charges, arrests, DUI, drug offenses, and criminal defense',
    icon: 'Shield',
    subCategories: [
      {
        id: 'dui-dwi',
        label: 'DUI / DWI',
        description: 'Driving under the influence charge',
        icon: 'Wine',
        practiceAreas: [
          { slug: 'dui-dwi', name: 'DUI / DWI Defense', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 80 },
          { slug: 'traffic-violations', name: 'Traffic Violations', confidence: 55 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Citation or arrest report',
          'Breathalyzer/blood test results (if available)',
          'Your driver\'s license',
          'Vehicle registration and insurance',
          'Court date and case number',
          'Names of any witnesses',
        ],
        deadlineNote: 'You may have only 10-30 days to request a DMV hearing to save your license. Act immediately.',
      },
      {
        id: 'drug-offense',
        label: 'Drug Offense',
        description: 'Possession, distribution, or manufacturing charges',
        icon: 'Pill',
        practiceAreas: [
          { slug: 'drug-crimes', name: 'Drug Crimes Defense', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 85 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Arrest report and charging documents',
          'Bail/bond information',
          'Court date and case number',
          'Details of the arrest circumstances',
          'Prior criminal record (if any)',
          'Names of any witnesses',
        ],
      },
      {
        id: 'assault-violent',
        label: 'Assault / Violent Crime',
        description: 'Assault, battery, or other violent crime charges',
        icon: 'AlertOctagon',
        practiceAreas: [
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 95 },
          { slug: 'violent-crimes', name: 'Violent Crimes Defense', confidence: 90 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Arrest report and charging documents',
          'Bail/bond information',
          'Details of the incident',
          'Names and contact info of witnesses',
          'Any evidence (photos, videos, texts)',
          'Protective/restraining orders (if any)',
        ],
      },
      {
        id: 'theft-fraud',
        label: 'Theft / Fraud Charges',
        description: 'Shoplifting, embezzlement, fraud, or white-collar charges',
        icon: 'ShieldAlert',
        practiceAreas: [
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 90 },
          { slug: 'white-collar-crime', name: 'White Collar Crime Defense', confidence: 85 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Arrest report and charging documents',
          'Financial records relevant to the charges',
          'Any correspondence from investigators',
          'Employment records (if work-related)',
          'Court date and case number',
          'Prior criminal history',
        ],
      },
      {
        id: 'domestic-violence',
        label: 'Domestic Violence',
        description: 'Accused of domestic violence or need a protective order',
        icon: 'ShieldOff',
        practiceAreas: [
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 85 },
          { slug: 'domestic-violence', name: 'Domestic Violence', confidence: 95 },
          { slug: 'family-law', name: 'Family Law', confidence: 60 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Arrest report or protective order',
          'Court dates and case numbers',
          'Details of the allegations',
          'Communication records with the accuser',
          'Any evidence supporting your defense',
          'Children\'s information (if relevant)',
        ],
      },
      {
        id: 'federal-crime',
        label: 'Federal Crime',
        description: 'Charged with a federal offense (FBI, DEA, IRS investigation)',
        icon: 'Building',
        practiceAreas: [
          { slug: 'federal-criminal-defense', name: 'Federal Criminal Defense', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 75 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Federal indictment or complaint',
          'Any federal agent business cards or contact info',
          'Court appointment (if assigned public defender)',
          'All documents received from federal authorities',
          'Prior criminal history',
          'DO NOT speak to federal agents without an attorney present',
        ],
        deadlineNote: 'Federal cases move quickly and carry severe penalties. Hire a federal defense attorney as soon as possible.',
      },
      {
        id: 'sex-offense',
        label: 'Sex Crime Accusation',
        description: 'Facing sex crime charges or allegations',
        icon: 'ShieldAlert',
        practiceAreas: [
          { slug: 'sex-crimes-defense', name: 'Sex Crimes Defense', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 80 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Arrest report and charging documents',
          'Court date and case number',
          'Bail conditions',
          'DO NOT contact the alleged victim',
          'DO NOT discuss the case with anyone except your attorney',
          'Preserve all electronic communications',
        ],
      },
      {
        id: 'expungement',
        label: 'Expungement / Record Sealing',
        description: 'Clear or seal a past criminal record',
        icon: 'Eraser',
        practiceAreas: [
          { slug: 'expungement', name: 'Expungement', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 70 },
        ],
        preparationChecklist: [
          'Complete criminal history report',
          'Court records from the case(s) you want expunged',
          'Proof of sentence completion (probation, fines, etc.)',
          'Evidence of rehabilitation',
          'Employment or housing denials due to record',
          'Time elapsed since conviction or arrest',
        ],
      },
      {
        id: 'juvenile-crime',
        label: 'Juvenile Offense',
        description: 'Minor child facing criminal charges',
        icon: 'Baby',
        practiceAreas: [
          { slug: 'juvenile-law', name: 'Juvenile Law', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 70 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Arrest report or citation',
          'School records and disciplinary history',
          'Court date information',
          'Medical or mental health records',
          'Parent/guardian identification',
          'Prior juvenile record (if any)',
        ],
      },
      {
        id: 'traffic-violation',
        label: 'Traffic Violation / Reckless Driving',
        description: 'Speeding, reckless driving, or license suspension',
        icon: 'Car',
        practiceAreas: [
          { slug: 'traffic-violations', name: 'Traffic Violations', confidence: 95 },
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 60 },
        ],
        preparationChecklist: [
          'Traffic citation or ticket',
          'Driver\'s license and driving record',
          'Court date and location',
          'Insurance information',
          'Any photos or dashcam footage',
          'Witness contact information',
        ],
      },
      {
        id: 'probation-violation',
        label: 'Probation / Parole Violation',
        description: 'Accused of violating terms of probation or parole',
        icon: 'AlertOctagon',
        practiceAreas: [
          { slug: 'criminal-defense', name: 'Criminal Defense', confidence: 95 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Probation/parole conditions document',
          'Violation notice or warrant',
          'Probation officer\'s contact information',
          'Evidence related to the alleged violation',
          'Court dates and case numbers',
          'Prior criminal history',
        ],
      },
    ],
  },

  // ========================================================================
  // 4. IMMIGRATION
  // ========================================================================
  {
    id: 'immigration',
    label: 'Immigration',
    description: 'Visas, green cards, citizenship, and deportation defense',
    icon: 'Globe',
    subCategories: [
      {
        id: 'green-card',
        label: 'Green Card Application',
        description: 'Apply for permanent residency (family or employment based)',
        icon: 'CreditCard',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
          { slug: 'green-card', name: 'Green Card / Permanent Residency', confidence: 90 },
        ],
        preparationChecklist: [
          'Valid passport',
          'Birth certificate (translated if not in English)',
          'Immigration history (all prior visas and entries)',
          'Sponsor\'s tax returns and employment letter (if applicable)',
          'Marriage certificate (for spousal sponsorship)',
          'Criminal background clearance',
        ],
      },
      {
        id: 'work-visa',
        label: 'Work Visa (H-1B, L-1, O-1, etc.)',
        description: 'Employer-sponsored work visa application',
        icon: 'Briefcase',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
          { slug: 'employment-immigration', name: 'Employment Immigration', confidence: 90 },
        ],
        preparationChecklist: [
          'Job offer letter from US employer',
          'Educational credentials and transcripts',
          'Credential evaluation (for foreign degrees)',
          'Resume / CV',
          'Employer\'s details (EIN, size, finances)',
          'Current immigration status documentation',
        ],
        deadlineNote: 'H-1B cap season opens April 1 each year. Plan well in advance.',
      },
      {
        id: 'deportation-defense',
        label: 'Deportation / Removal Defense',
        description: 'Facing deportation or removal proceedings',
        icon: 'AlertTriangle',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 90 },
          { slug: 'deportation-defense', name: 'Deportation Defense', confidence: 95 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Notice to Appear (NTA)',
          'All prior immigration documents and I-94',
          'Court hearing dates',
          'Evidence of ties to the US (family, employment, community)',
          'Tax returns showing US ties',
          'DO NOT sign any documents from ICE without legal review',
        ],
        deadlineNote: 'Deportation proceedings have strict court deadlines. Get legal help immediately.',
      },
      {
        id: 'citizenship',
        label: 'Naturalization / Citizenship',
        description: 'Applying for US citizenship',
        icon: 'Flag',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
          { slug: 'citizenship', name: 'Citizenship & Naturalization', confidence: 90 },
        ],
        preparationChecklist: [
          'Green card (front and back copies)',
          'Travel history for the last 5 years',
          'Tax returns for the last 5 years',
          'Criminal history (if any, even dismissed cases)',
          'Marriage/divorce certificates',
          'Selective Service registration (for males 18-31)',
        ],
      },
      {
        id: 'family-immigration',
        label: 'Family-Based Immigration',
        description: 'Sponsoring a family member to come to the US',
        icon: 'Users',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
          { slug: 'family-immigration', name: 'Family Immigration', confidence: 90 },
        ],
        preparationChecklist: [
          'Proof of US citizenship or green card status',
          'Proof of family relationship (birth/marriage certificates)',
          'Tax returns from the last 3 years',
          'Affidavit of support financial documents',
          'Beneficiary\'s passport and identity documents',
          'Any prior immigration applications or petitions',
        ],
      },
      {
        id: 'asylum',
        label: 'Asylum / Refugee Status',
        description: 'Seeking protection from persecution in your home country',
        icon: 'Shield',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 85 },
          { slug: 'asylum', name: 'Asylum & Refugee Law', confidence: 95 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Your personal declaration/statement of persecution',
          'Evidence of persecution (photos, news articles, reports)',
          'Country condition reports',
          'Medical records documenting harm',
          'Identity documents',
          'Witness statements from others who can corroborate your story',
        ],
        deadlineNote: 'You must file for asylum within 1 year of your arrival in the US in most cases.',
      },
      {
        id: 'visa-denial',
        label: 'Visa Denial / Revocation',
        description: 'Your visa application was denied or your visa was revoked',
        icon: 'XCircle',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
        ],
        preparationChecklist: [
          'Denial notice and reason codes',
          'Original visa application and supporting documents',
          'Any Request for Evidence (RFE) notices',
          'Correspondence with USCIS or the consulate',
          'Updated documents that address the denial reason',
          'Timeline of all immigration filings',
        ],
      },
      {
        id: 'daca',
        label: 'DACA / Dreamer Status',
        description: 'DACA application, renewal, or related issues',
        icon: 'Shield',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
        ],
        preparationChecklist: [
          'Current DACA approval notice and EAD card',
          'Proof of continuous residence in the US',
          'School records and transcripts',
          'Employment records',
          'Criminal background (any arrests, even dismissed)',
          'Prior DACA applications and receipts',
        ],
      },
      {
        id: 'immigration-business',
        label: 'Business / Investor Visa (E-2, EB-5)',
        description: 'Visa for business owners or investors',
        icon: 'Briefcase',
        practiceAreas: [
          { slug: 'immigration', name: 'Immigration Law', confidence: 95 },
          { slug: 'business-law', name: 'Business Law', confidence: 55 },
        ],
        preparationChecklist: [
          'Business plan',
          'Proof of investment funds and source',
          'Business formation documents',
          'Financial projections',
          'Job creation plan (for EB-5)',
          'Passport and current immigration status',
        ],
      },
    ],
  },

  // ========================================================================
  // 5. REAL ESTATE
  // ========================================================================
  {
    id: 'real-estate',
    label: 'Real Estate',
    description: 'Buying, selling, landlord/tenant, and property disputes',
    icon: 'Home',
    subCategories: [
      {
        id: 'home-purchase',
        label: 'Home Purchase / Sale',
        description: 'Buying or selling residential property',
        icon: 'Home',
        practiceAreas: [
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 95 },
        ],
        preparationChecklist: [
          'Purchase agreement or contract',
          'Property disclosure statements',
          'Title report or title insurance commitment',
          'Mortgage pre-approval letter',
          'Home inspection report',
          'HOA documents (if applicable)',
        ],
      },
      {
        id: 'landlord-tenant',
        label: 'Landlord / Tenant Dispute',
        description: 'Eviction, lease issues, security deposit, or habitability',
        icon: 'DoorOpen',
        practiceAreas: [
          { slug: 'landlord-tenant', name: 'Landlord-Tenant Law', confidence: 95 },
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 70 },
        ],
        preparationChecklist: [
          'Lease or rental agreement',
          'Correspondence with landlord/tenant',
          'Photos of property condition',
          'Rent payment records',
          'Eviction notices (if any)',
          'Security deposit documentation',
        ],
      },
      {
        id: 'property-dispute',
        label: 'Property Line / Boundary Dispute',
        description: 'Disputes with neighbors over property boundaries',
        icon: 'Map',
        practiceAreas: [
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 90 },
          { slug: 'property-litigation', name: 'Property Litigation', confidence: 85 },
        ],
        preparationChecklist: [
          'Property deed',
          'Survey or plat map',
          'Photos of the disputed boundary',
          'Correspondence with the neighbor',
          'Title insurance policy',
          'Any existing easement agreements',
        ],
      },
      {
        id: 'commercial-real-estate',
        label: 'Commercial Real Estate',
        description: 'Commercial leases, purchases, or development',
        icon: 'Building2',
        practiceAreas: [
          { slug: 'commercial-real-estate', name: 'Commercial Real Estate', confidence: 95 },
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 80 },
        ],
        preparationChecklist: [
          'Commercial lease or purchase agreement',
          'Zoning and land use documentation',
          'Environmental assessments',
          'Financial projections',
          'Tenant improvement plans',
          'Title report and survey',
        ],
      },
      {
        id: 'foreclosure',
        label: 'Foreclosure Defense',
        description: 'Facing home foreclosure or behind on mortgage payments',
        icon: 'AlertTriangle',
        practiceAreas: [
          { slug: 'foreclosure-defense', name: 'Foreclosure Defense', confidence: 95 },
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 75 },
          { slug: 'bankruptcy', name: 'Bankruptcy', confidence: 55 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Mortgage statements and loan documents',
          'Foreclosure notices received',
          'Correspondence with the lender/servicer',
          'Financial hardship documentation',
          'Proof of income and expenses',
          'Any loan modification applications submitted',
        ],
        deadlineNote: 'Foreclosure timelines vary by state. Some states allow only 30 days to respond. Act immediately.',
      },
      {
        id: 'construction-dispute',
        label: 'Construction Dispute',
        description: 'Contractor issues, defective work, or mechanic\'s liens',
        icon: 'Hammer',
        practiceAreas: [
          { slug: 'construction-law', name: 'Construction Law', confidence: 95 },
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 65 },
        ],
        preparationChecklist: [
          'Construction contract and all change orders',
          'Payment records and invoices',
          'Photos of defective work',
          'Inspection reports',
          'Correspondence with the contractor',
          'Any lien notices filed or received',
        ],
      },
      {
        id: 'hoa-dispute',
        label: 'HOA Dispute',
        description: 'Issues with homeowners association fees, rules, or enforcement',
        icon: 'Users',
        practiceAreas: [
          { slug: 'real-estate', name: 'Real Estate Law', confidence: 85 },
          { slug: 'hoa-law', name: 'HOA Law', confidence: 90 },
        ],
        preparationChecklist: [
          'HOA CC&Rs (Covenants, Conditions & Restrictions)',
          'HOA bylaws and rules',
          'Correspondence with the HOA board',
          'Violation notices received',
          'Meeting minutes from HOA meetings',
          'Payment records for HOA dues',
        ],
      },
    ],
  },

  // ========================================================================
  // 6. EMPLOYMENT
  // ========================================================================
  {
    id: 'employment',
    label: 'Employment',
    description: 'Workplace discrimination, wrongful termination, and labor rights',
    icon: 'Building',
    subCategories: [
      {
        id: 'wrongful-termination',
        label: 'Wrongful Termination',
        description: 'Fired illegally, in retaliation, or in violation of contract',
        icon: 'UserX',
        practiceAreas: [
          { slug: 'employment-law', name: 'Employment Law', confidence: 95 },
          { slug: 'wrongful-termination', name: 'Wrongful Termination', confidence: 92 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Employment contract or offer letter',
          'Termination letter or documentation',
          'Employee handbook / company policies',
          'Performance reviews and evaluations',
          'Emails or messages related to the termination',
          'Pay stubs and benefits documentation',
        ],
        deadlineNote: 'EEOC charges must be filed within 180-300 days. State deadlines vary.',
      },
      {
        id: 'discrimination',
        label: 'Workplace Discrimination',
        description: 'Discrimination based on race, gender, age, disability, religion, etc.',
        icon: 'Ban',
        practiceAreas: [
          { slug: 'employment-discrimination', name: 'Employment Discrimination', confidence: 95 },
          { slug: 'employment-law', name: 'Employment Law', confidence: 85 },
          { slug: 'civil-rights', name: 'Civil Rights', confidence: 65 },
        ],
        solYears: 1,
        preparationChecklist: [
          'Specific incidents of discrimination (dates, witnesses, details)',
          'Written complaints filed with HR or management',
          'Performance reviews before and after incidents',
          'Company anti-discrimination policy',
          'Comparative treatment evidence (how others were treated)',
          'Communication records (emails, texts, voicemails)',
        ],
        deadlineNote: 'You typically have 180-300 days to file an EEOC charge. Do not delay.',
      },
      {
        id: 'sexual-harassment',
        label: 'Sexual Harassment',
        description: 'Unwanted sexual conduct, quid pro quo, or hostile work environment',
        icon: 'ShieldAlert',
        practiceAreas: [
          { slug: 'sexual-harassment', name: 'Sexual Harassment', confidence: 95 },
          { slug: 'employment-law', name: 'Employment Law', confidence: 85 },
        ],
        solYears: 1,
        inherentlyUrgent: true,
        preparationChecklist: [
          'Written record of each incident (date, time, location, witnesses)',
          'Complaints filed with HR or management',
          'Company sexual harassment policy',
          'Communication records (texts, emails, social media)',
          'Names of witnesses',
          'Any evidence of retaliation after reporting',
        ],
        deadlineNote: 'EEOC charge deadline: 180-300 days. Preserve all evidence immediately.',
      },
      {
        id: 'wage-dispute',
        label: 'Unpaid Wages / Overtime',
        description: 'Employer not paying wages, overtime, tips, or commissions',
        icon: 'DollarSign',
        practiceAreas: [
          { slug: 'wage-hour-law', name: 'Wage & Hour Law', confidence: 95 },
          { slug: 'employment-law', name: 'Employment Law', confidence: 85 },
        ],
        solYears: 2,
        preparationChecklist: [
          'Pay stubs for the disputed period',
          'Employment contract or offer letter',
          'Time records or work schedule',
          'Company pay policies',
          'Calculation of wages owed',
          'Correspondence about the pay dispute',
        ],
      },
      {
        id: 'non-compete',
        label: 'Non-Compete / Non-Disclosure',
        description: 'Enforcing or challenging a non-compete or NDA',
        icon: 'Lock',
        practiceAreas: [
          { slug: 'employment-law', name: 'Employment Law', confidence: 90 },
          { slug: 'business-litigation', name: 'Business Litigation', confidence: 70 },
        ],
        preparationChecklist: [
          'The non-compete or NDA agreement',
          'Employment contract',
          'Details of the new job opportunity',
          'Evidence of the agreement\'s unreasonableness (if challenging)',
          'State-specific non-compete laws',
          'Correspondence from former employer regarding the agreement',
        ],
      },
      {
        id: 'retaliation',
        label: 'Whistleblower / Retaliation',
        description: 'Punished for reporting illegal activity or safety violations',
        icon: 'Megaphone',
        practiceAreas: [
          { slug: 'whistleblower', name: 'Whistleblower Protection', confidence: 95 },
          { slug: 'employment-law', name: 'Employment Law', confidence: 80 },
        ],
        inherentlyUrgent: true,
        preparationChecklist: [
          'Documentation of what you reported',
          'How and when you made the report',
          'Evidence of retaliation (demotion, firing, schedule changes)',
          'Timeline of events before and after reporting',
          'Names of people who witnessed the retaliation',
          'Company policies on reporting violations',
        ],
      },
      {
        id: 'severance-negotiation',
        label: 'Severance Negotiation',
        description: 'Reviewing or negotiating a severance package',
        icon: 'FileText',
        practiceAreas: [
          { slug: 'employment-law', name: 'Employment Law', confidence: 95 },
        ],
        preparationChecklist: [
          'The proposed severance agreement',
          'Employment contract and any bonus agreements',
          'Stock option or equity documents',
          'Non-compete and NDA provisions',
          'Details of your tenure and compensation history',
          'Benefits information (health insurance, 401k)',
        ],
        deadlineNote: 'Most severance agreements give you 21 days to review (40+ years old get 21 days by law). Do not sign without legal review.',
      },
      {
        id: 'fmla-disability',
        label: 'FMLA / Disability Accommodation',
        description: 'Denied medical leave or reasonable workplace accommodations',
        icon: 'Accessibility',
        practiceAreas: [
          { slug: 'employment-law', name: 'Employment Law', confidence: 90 },
          { slug: 'disability-rights', name: 'Disability Rights', confidence: 85 },
        ],
        preparationChecklist: [
          'FMLA request and employer\'s response',
          'Medical documentation of your condition',
          'Accommodation request and employer\'s response',
          'Employment records and attendance history',
          'Company leave and accommodation policies',
          'Evidence of how others\' leave requests were handled',
        ],
      },
    ],
  },

  // ========================================================================
  // 7. OTHER
  // ========================================================================
  {
    id: 'other',
    label: 'Other',
    description: 'Bankruptcy, consumer rights, environmental, and other legal matters',
    icon: 'MoreHorizontal',
    subCategories: [
      {
        id: 'bankruptcy',
        label: 'Bankruptcy',
        description: 'Overwhelmed by debt and considering bankruptcy protection',
        icon: 'CreditCard',
        practiceAreas: [
          { slug: 'bankruptcy', name: 'Bankruptcy', confidence: 95 },
          { slug: 'debt-relief', name: 'Debt Relief', confidence: 80 },
        ],
        preparationChecklist: [
          'List of all debts (credit cards, loans, medical, etc.)',
          'List of all assets (home, car, bank accounts, investments)',
          'Income documentation (pay stubs, tax returns)',
          'Monthly budget / expense breakdown',
          'Any lawsuits, garnishments, or collection actions',
          'Credit reports from all three bureaus',
        ],
      },
      {
        id: 'consumer-protection',
        label: 'Consumer Protection / Fraud',
        description: 'Scammed, defrauded, or sold a defective product',
        icon: 'ShieldCheck',
        practiceAreas: [
          { slug: 'consumer-protection', name: 'Consumer Protection', confidence: 95 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 40 },
        ],
        preparationChecklist: [
          'Receipts and proof of purchase',
          'The product or service documentation',
          'Advertising or marketing materials',
          'Correspondence with the company',
          'Evidence of fraud or deception',
          'Complaints filed with BBB or government agencies',
        ],
      },
      {
        id: 'social-security-disability',
        label: 'Social Security Disability',
        description: 'SSDI or SSI application, denial, or appeal',
        icon: 'ShieldCheck',
        practiceAreas: [
          { slug: 'social-security-disability', name: 'Social Security Disability', confidence: 95 },
        ],
        preparationChecklist: [
          'Social Security denial letter',
          'Complete medical records',
          'List of all treating physicians',
          'Work history for the past 15 years',
          'Medications list',
          'Functional limitations documentation',
        ],
        deadlineNote: 'You have only 60 days to appeal an SSDI denial. Do not miss this deadline.',
      },
      {
        id: 'environmental-law',
        label: 'Environmental Issue',
        description: 'Pollution, contamination, or environmental regulation',
        icon: 'Leaf',
        practiceAreas: [
          { slug: 'environmental-law', name: 'Environmental Law', confidence: 95 },
        ],
        preparationChecklist: [
          'Description of the environmental issue',
          'Location and property details',
          'Photos or videos of contamination/pollution',
          'Health effects documentation (if any)',
          'Government notices or citations',
          'Any environmental assessments or reports',
        ],
      },
      {
        id: 'personal-tax',
        label: 'Personal Tax Issue',
        description: 'IRS audit, back taxes, or tax controversy',
        icon: 'Receipt',
        practiceAreas: [
          { slug: 'tax-law', name: 'Tax Law', confidence: 95 },
        ],
        solYears: 3,
        preparationChecklist: [
          'IRS notices and correspondence',
          'Tax returns for the years in question',
          'W-2s, 1099s, and other income documents',
          'Records of estimated payments made',
          'Prior accountant/CPA contact information',
          'Financial statements showing ability to pay (for installment plans)',
        ],
      },
      {
        id: 'civil-rights',
        label: 'Civil Rights Violation',
        description: 'Government overreach, police misconduct, or constitutional rights',
        icon: 'Scale',
        practiceAreas: [
          { slug: 'civil-rights', name: 'Civil Rights', confidence: 95 },
          { slug: 'constitutional-law', name: 'Constitutional Law', confidence: 75 },
        ],
        preparationChecklist: [
          'Description of the rights violation',
          'Dates, times, and locations of incidents',
          'Names of government officials/officers involved',
          'Badge numbers (for police misconduct)',
          'Witness contact information',
          'Photos, videos, or body cam footage requests',
        ],
      },
      {
        id: 'education-law',
        label: 'Education Law',
        description: 'Student rights, special education (IEP/504), or school discipline',
        icon: 'GraduationCap',
        practiceAreas: [
          { slug: 'education-law', name: 'Education Law', confidence: 95 },
        ],
        preparationChecklist: [
          'IEP or 504 plan (if applicable)',
          'School disciplinary records',
          'Correspondence with the school/district',
          'Student\'s educational records',
          'Evaluation reports',
          'Due process complaint or hearing notices',
        ],
      },
      {
        id: 'healthcare-law',
        label: 'Healthcare / Insurance Dispute',
        description: 'Insurance claim denial, billing disputes, or healthcare access',
        icon: 'Heart',
        practiceAreas: [
          { slug: 'health-law', name: 'Health Law', confidence: 90 },
          { slug: 'insurance-law', name: 'Insurance Law', confidence: 85 },
        ],
        preparationChecklist: [
          'Insurance policy and plan documents',
          'Claim denial letter and reason',
          'Medical records supporting the claim',
          'All bills and explanation of benefits (EOBs)',
          'Correspondence with the insurance company',
          'Appeal documents already submitted',
        ],
      },
      {
        id: 'entertainment-sports',
        label: 'Entertainment / Sports Law',
        description: 'Contracts, rights, or disputes in entertainment or sports',
        icon: 'Music',
        practiceAreas: [
          { slug: 'entertainment-law', name: 'Entertainment Law', confidence: 95 },
          { slug: 'intellectual-property', name: 'Intellectual Property', confidence: 60 },
        ],
        preparationChecklist: [
          'Existing contracts or agreements',
          'Intellectual property registration (copyrights, trademarks)',
          'Revenue statements and royalty reports',
          'Agent or manager agreements',
          'Correspondence regarding the dispute',
          'Creative works at issue',
        ],
      },
      {
        id: 'military-veterans',
        label: 'Military / Veterans Law',
        description: 'VA benefits, military discharge, or service-related issues',
        icon: 'Shield',
        practiceAreas: [
          { slug: 'military-law', name: 'Military Law', confidence: 95 },
          { slug: 'veterans-benefits', name: 'Veterans Benefits', confidence: 90 },
        ],
        preparationChecklist: [
          'DD-214 or military service records',
          'VA decision letters',
          'Medical records (military and private)',
          'Service-connected disability documentation',
          'VA benefits statements',
          'Any appeals filed with the Board of Veterans\' Appeals',
        ],
      },
      {
        id: 'internet-defamation',
        label: 'Defamation / Online Reputation',
        description: 'False statements, libel, slander, or online harassment',
        icon: 'AlertTriangle',
        practiceAreas: [
          { slug: 'defamation', name: 'Defamation', confidence: 95 },
          { slug: 'civil-litigation', name: 'Civil Litigation', confidence: 70 },
        ],
        solYears: 1,
        preparationChecklist: [
          'Screenshots of defamatory content (with URLs and dates)',
          'Evidence the statements are false',
          'Documentation of damages (lost business, emotional distress)',
          'Identity of the person making the statements (if known)',
          'Records of any takedown requests submitted',
          'Witness statements corroborating the impact',
        ],
        deadlineNote: 'Defamation statutes of limitations are often just 1-2 years. Preserve evidence immediately.',
      },
      {
        id: 'medical-debt',
        label: 'Medical Debt / Hospital Billing',
        description: 'Overwhelming medical bills, billing errors, or collections',
        icon: 'Heart',
        practiceAreas: [
          { slug: 'consumer-protection', name: 'Consumer Protection', confidence: 80 },
          { slug: 'health-law', name: 'Health Law', confidence: 75 },
          { slug: 'bankruptcy', name: 'Bankruptcy', confidence: 60 },
        ],
        preparationChecklist: [
          'Itemized hospital or medical bills',
          'Explanation of Benefits (EOBs) from insurance',
          'Insurance policy and coverage documents',
          'Collection notices received',
          'Payment plan agreements (if any)',
          'Records of any billing disputes filed',
        ],
      },
      {
        id: 'small-claims',
        label: 'Small Claims Dispute',
        description: 'Dispute under $10,000 (neighbor, contractor, etc.)',
        icon: 'Scale',
        practiceAreas: [
          { slug: 'civil-litigation', name: 'Civil Litigation', confidence: 85 },
          { slug: 'consumer-protection', name: 'Consumer Protection', confidence: 60 },
        ],
        preparationChecklist: [
          'Written summary of the dispute',
          'Contracts or agreements involved',
          'Receipts and proof of payment',
          'Photos or evidence of damages',
          'Correspondence with the other party',
          'Calculation of the amount owed',
        ],
      },
      {
        id: 'government-benefits',
        label: 'Government Benefits Appeal',
        description: 'Denied unemployment, Medicaid, food stamps, or other benefits',
        icon: 'FileText',
        practiceAreas: [
          { slug: 'government-benefits', name: 'Government Benefits', confidence: 90 },
          { slug: 'social-security-disability', name: 'Social Security Disability', confidence: 55 },
        ],
        preparationChecklist: [
          'Denial letter with reason codes',
          'Application documents submitted',
          'Supporting documentation (income, medical, etc.)',
          'Appeal deadline from the denial letter',
          'Employment history and records',
          'Any prior benefit determination letters',
        ],
        deadlineNote: 'Government benefit appeals often have strict 30-60 day deadlines. Check your denial letter immediately.',
      },
      {
        id: 'class-action',
        label: 'Class Action / Mass Tort',
        description: 'Part of a group harmed by the same product, company, or action',
        icon: 'Users',
        practiceAreas: [
          { slug: 'class-action', name: 'Class Action', confidence: 95 },
          { slug: 'personal-injury', name: 'Personal Injury', confidence: 65 },
        ],
        preparationChecklist: [
          'Description of the harm or injury',
          'Proof of product purchase or exposure',
          'Medical records (if health-related)',
          'Financial records showing losses',
          'Any class action notices received',
          'Contact info for others similarly affected',
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Recommendation Engine
// ---------------------------------------------------------------------------

/**
 * Get a recommendation based on user answers.
 */
export function getRecommendation(answers: AssessmentAnswers): AssessmentRecommendation {
  const category = assessmentCategories.find(c => c.id === answers.categoryId)
  if (!category) {
    return {
      practiceAreas: [{ slug: 'general-practice', name: 'General Practice', confidence: 50 }],
      urgency: answers.urgency,
      preparationChecklist: [
        'A written summary of your legal issue',
        'Any relevant documents or correspondence',
        'A list of key dates and deadlines',
        'Names and contact info of relevant parties',
      ],
      categoryLabel: 'General',
      subCategoryLabel: 'General Legal Issue',
    }
  }

  const subCategory = category.subCategories.find(s => s.id === answers.subCategoryId)
  if (!subCategory) {
    return {
      practiceAreas: [{ slug: 'general-practice', name: 'General Practice', confidence: 50 }],
      urgency: answers.urgency,
      preparationChecklist: [
        'A written summary of your legal issue',
        'Any relevant documents or correspondence',
        'A list of key dates and deadlines',
        'Names and contact info of relevant parties',
      ],
      categoryLabel: category.label,
      subCategoryLabel: 'General Legal Issue',
    }
  }

  // Determine if there is a deadline warning
  let deadlineWarning: string | undefined = subCategory.deadlineNote

  // Check SOL-based urgency
  if (subCategory.solYears && answers.timelineMonths !== undefined) {
    const monthsRemaining = (subCategory.solYears * 12) - answers.timelineMonths
    if (monthsRemaining <= 3) {
      deadlineWarning = `CRITICAL: Based on a typical ${subCategory.solYears}-year statute of limitations, you may have less than ${Math.max(monthsRemaining, 0)} months remaining to file your claim. Consult an attorney immediately.`
    } else if (monthsRemaining <= 6) {
      deadlineWarning = `WARNING: Based on a typical ${subCategory.solYears}-year statute of limitations, you may have approximately ${monthsRemaining} months remaining. Do not delay in seeking legal counsel.`
    }
  }

  // If inherently urgent, override urgency level to immediate
  const effectiveUrgency: UrgencyLevel = subCategory.inherentlyUrgent
    ? 'immediate'
    : answers.urgency

  return {
    practiceAreas: subCategory.practiceAreas,
    urgency: effectiveUrgency,
    deadlineWarning,
    preparationChecklist: subCategory.preparationChecklist,
    categoryLabel: category.label,
    subCategoryLabel: subCategory.label,
  }
}

/**
 * Count total terminal nodes (subcategories) in the decision tree.
 */
export function getTerminalNodeCount(): number {
  return assessmentCategories.reduce(
    (total, cat) => total + cat.subCategories.length,
    0
  )
}

/**
 * Get all unique practice area slugs across the entire tree.
 */
export function getAllPracticeAreaSlugs(): string[] {
  const slugs = new Set<string>()
  for (const cat of assessmentCategories) {
    for (const sub of cat.subCategories) {
      for (const pa of sub.practiceAreas) {
        slugs.add(pa.slug)
      }
    }
  }
  return Array.from(slugs)
}
