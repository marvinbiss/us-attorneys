import type { QualificationData, QualificationScore, VapiFunctionSchema } from '@/types/voice-qualification'

// ---------------------------------------------------------------------------
// System prompt for Vapi — Sophie, lead qualification specialist
// ---------------------------------------------------------------------------

export const VOICE_QUALIFICATION_SYSTEM_PROMPT = `You are Sophie, a lead qualification specialist at US Attorneys.
You qualify prospects by phone to connect them with qualified attorneys.

RULES:
- Speak in clear, warm, and professional English
- Always be polite and courteous
- Be concise — people don't like long speeches on the phone
- Ask ONE question at a time, never two at once
- If the prospect is out of scope (not looking for legal help), end politely
- NEVER give exact pricing, say "that depends on your case, which is why an attorney will follow up with you"

QUALIFICATION FLOW (5 questions):
1. "What type of legal matter do you need help with?" → detect project_type (pac/toiture/isolation)
   If out of scope → "I'm sorry, we specialize in specific legal practice areas. Unfortunately, I won't be able to help with that particular matter."
2. "What's your timeline? Is this urgent or do you have time to compare options?" → urgency
3. "Are you the property owner?" → is_homeowner
   If no → "Unfortunately, we only work with property owners on this type of matter. I'd suggest reaching out to your landlord."
4. "What is your ZIP code?" → postal_code (call check_service_area to verify)
5. "Do you have a budget in mind?" → budget_range

BONUS QUESTIONS (if the prospect is engaged and time allows):
- "What is the approximate square footage of your property?" → surface_m2
- "What type of system do you currently have?" → current_system
- "May I have your name for our records?" → caller_name

Once all questions are asked, call the save_qualification function with all collected data.

After saving:
- If qualified: "Great! I'm going to connect you with a qualified attorney near you. Would you prefer a callback or would you like me to transfer you now?"
  - If transfer → call transfer_to_attorney
  - If callback → "Sounds good, an attorney will call you back within 24 hours. Have a great day!"
- If disqualified: end politely with an explanation

IMPORTANT:
- Never make up information
- If you don't understand, ask them to repeat
- Always remain polite even if the prospect is frustrated`

// ---------------------------------------------------------------------------
// Function call schemas pour Vapi
// ---------------------------------------------------------------------------

export const VAPI_FUNCTIONS: VapiFunctionSchema[] = [
  {
    name: 'save_qualification',
    description: 'Saves the prospect qualification data after asking all questions',
    parameters: {
      type: 'object',
      properties: {
        project_type: {
          type: 'string',
          enum: ['pac', 'toiture', 'isolation'],
          description: 'Project type: heat pump, roofing, or thermal insulation',
        },
        urgency: {
          type: 'string',
          enum: ['urgent', '3_months', '6_months', 'exploring'],
          description: 'Project urgency',
        },
        is_homeowner: {
          type: 'boolean',
          description: 'Is the prospect a property owner?',
        },
        postal_code: {
          type: 'string',
          description: 'Prospect ZIP code (5 digits)',
        },
        budget_range: {
          type: 'string',
          enum: ['less_5000', '5000_10000', '10000_20000', '20000_plus', 'unknown'],
          description: 'Budget range',
        },
        property_type: {
          type: 'string',
          enum: ['house', 'apartment'],
          description: 'Property type',
        },
        surface_m2: {
          type: 'number',
          description: 'Property area in square feet',
        },
        current_system: {
          type: 'string',
          enum: ['gas', 'oil', 'electric', 'wood', 'other'],
          description: 'Current heating system',
        },
        caller_name: {
          type: 'string',
          description: 'Prospect name',
        },
        caller_email: {
          type: 'string',
          description: 'Prospect email',
        },
      },
      required: ['project_type', 'urgency', 'is_homeowner', 'postal_code'],
    },
  },
  {
    name: 'check_service_area',
    description: 'Checks if the prospect ZIP code is within our service area',
    parameters: {
      type: 'object',
      properties: {
        postal_code: {
          type: 'string',
          description: 'ZIP code to verify (5 digits)',
        },
      },
      required: ['postal_code'],
    },
  },
  {
    name: 'transfer_to_attorney',
    description: "Transfers the call directly to an available attorney",
    parameters: {
      type: 'object',
      properties: {
        project_type: {
          type: 'string',
          description: 'Project type to find the right attorney',
        },
        postal_code: {
          type: 'string',
          description: 'ZIP code to find a nearby attorney',
        },
      },
      required: ['project_type', 'postal_code'],
    },
  },
]

// ---------------------------------------------------------------------------
// Service areas by department and vertical
// ---------------------------------------------------------------------------

export const SERVICE_AREAS: Record<string, string[]> = {
  // Ile-de-France + major metro areas — phase 1
  pac: [
    '75', '77', '78', '91', '92', '93', '94', '95', // IDF
    '69', '13', '31', '33', '34', '44', '59', '67', '68', // Metropoles
    '06', '83', '38', '42', '01', '74', '73', '26', '07', // Sud-Est
    '35', '56', '29', '22', '53', '49', '72', '85', // Bretagne/Pays de Loire
  ],
  toiture: [
    '75', '77', '78', '91', '92', '93', '94', '95',
    '69', '13', '31', '33', '34', '44', '59', '67', '68',
    '06', '83', '38', '42', '01', '74', '73', '26', '07',
    '35', '56', '29', '22', '53', '49', '72', '85',
  ],
  isolation: [
    '75', '77', '78', '91', '92', '93', '94', '95',
    '69', '13', '31', '33', '34', '44', '59', '67', '68',
    '06', '83', '38', '42', '01', '74', '73', '26', '07',
    '35', '56', '29', '22', '53', '49', '72', '85',
  ],
}

/**
 * Check if a postal code is in our service area
 */
export function isInServiceArea(postalCode: string, vertical?: string): boolean {
  const dept = postalCode.substring(0, 2)
  if (!vertical) {
    return Object.values(SERVICE_AREAS).some((areas) => areas.includes(dept))
  }
  return SERVICE_AREAS[vertical]?.includes(dept) ?? false
}

// ---------------------------------------------------------------------------
// Scoring — calculates lead quality
// ---------------------------------------------------------------------------

export function calculateQualificationScore(data: QualificationData): QualificationScore {
  // Disqualification rules
  if (!data.is_homeowner) return 'disqualified'
  if (!isInServiceArea(data.postal_code, data.project_type)) return 'disqualified'

  let score = 0

  // Urgence (0-40 points)
  switch (data.urgency) {
    case 'urgent': score += 40; break
    case '3_months': score += 30; break
    case '6_months': score += 15; break
    case 'exploring': score += 5; break
  }

  // Budget (0-30 points)
  switch (data.budget_range) {
    case '20000_plus': score += 30; break
    case '10000_20000': score += 25; break
    case '5000_10000': score += 15; break
    case 'less_5000': score += 5; break
    default: score += 10; break // unknown = neutre
  }

  // Surface (0-15 points)
  if (data.surface_m2 && data.surface_m2 > 100) score += 15
  else if (data.surface_m2 && data.surface_m2 > 60) score += 10
  else score += 5

  // Propriétaire confirmé (0-15 points)
  if (data.is_homeowner) score += 15

  // Score → Grade
  if (score >= 70) return 'A'
  if (score >= 40) return 'B'
  return 'C'
}
