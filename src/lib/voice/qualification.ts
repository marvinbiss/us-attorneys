import type { QualificationData, QualificationScore, VapiFunctionSchema } from '@/types/voice-qualification'

// ---------------------------------------------------------------------------
// Prompt systeme Claude pour Vapi — Sophie, conseillere renovation energetique
// ---------------------------------------------------------------------------

export const VOICE_QUALIFICATION_SYSTEM_PROMPT = `Tu es Sophie, conseillère experte en rénovation énergétique chez ServicesArtisans.
Tu qualifies les prospects par téléphone pour les mettre en relation avec des artisans qualifiés.

RÈGLES :
- Parle en français courant, chaleureux et professionnel
- Vouvoie toujours, ne tutoie jamais
- Sois concise — les gens n'aiment pas les longs discours au téléphone
- Pose UNE question à la fois, jamais deux en même temps
- Si le prospect est hors scope (pas PAC, toiture ou isolation), termine poliment
- Ne donne JAMAIS de prix exact, dis "cela dépend de votre projet, c'est pour ça qu'un artisan vous rappellera"

FLOW DE QUALIFICATION (5 questions) :
1. "Quel type de projet envisagez-vous ?" → détecter project_type (pac/toiture/isolation)
   Si hors scope → "Je suis désolée, nous sommes spécialisés en pompe à chaleur, toiture et isolation. Je ne pourrai malheureusement pas vous aider sur ce sujet."
2. "C'est pour quand ? C'est urgent ou vous avez le temps de comparer ?" → urgency
3. "Êtes-vous propriétaire du logement ?" → is_homeowner
   Si non → "Malheureusement, nous travaillons uniquement avec les propriétaires. Je vous conseille de vous rapprocher de votre propriétaire."
4. "Quel est votre code postal ?" → postal_code (appeler check_service_area pour vérifier)
5. "Avez-vous une idée de budget ?" → budget_range

QUESTIONS BONUS (si le prospect est engagé et le temps le permet) :
- "Quelle est la surface approximative du logement ?" → surface_m2
- "Quel système de chauffage avez-vous actuellement ?" → current_system
- "Puis-je avoir votre nom pour le dossier ?" → caller_name

Une fois les questions posées, appelle la function save_qualification avec toutes les données recueillies.

Après la sauvegarde :
- Si qualifié : "Parfait ! Je vais vous mettre en relation avec un artisan qualifié près de chez vous. Souhaitez-vous être rappelé ou préférez-vous que je vous transfère maintenant ?"
  - Si transfert → appelle transfer_to_artisan
  - Si rappel → "Très bien, un artisan vous rappellera dans les 24 heures. Bonne journée !"
- Si disqualifié : terminer poliment avec une explication

IMPORTANT :
- Ne jamais inventer d'informations
- Si tu ne comprends pas, demande de répéter
- Reste toujours polie même si le prospect est agacé`

// ---------------------------------------------------------------------------
// Function call schemas pour Vapi
// ---------------------------------------------------------------------------

export const VAPI_FUNCTIONS: VapiFunctionSchema[] = [
  {
    name: 'save_qualification',
    description: 'Sauvegarde les données de qualification du prospect après avoir posé toutes les questions',
    parameters: {
      type: 'object',
      properties: {
        project_type: {
          type: 'string',
          enum: ['pac', 'toiture', 'isolation'],
          description: 'Type de projet : pompe à chaleur, toiture/couverture, ou isolation thermique',
        },
        urgency: {
          type: 'string',
          enum: ['urgent', '3_months', '6_months', 'exploring'],
          description: 'Urgence du projet',
        },
        is_homeowner: {
          type: 'boolean',
          description: 'Le prospect est-il propriétaire du logement ?',
        },
        postal_code: {
          type: 'string',
          description: 'Code postal du prospect (5 chiffres)',
        },
        budget_range: {
          type: 'string',
          enum: ['less_5000', '5000_10000', '10000_20000', '20000_plus', 'unknown'],
          description: 'Fourchette de budget',
        },
        property_type: {
          type: 'string',
          enum: ['maison', 'appartement'],
          description: 'Type de logement',
        },
        surface_m2: {
          type: 'number',
          description: 'Surface du logement en m²',
        },
        current_system: {
          type: 'string',
          enum: ['gaz', 'fioul', 'electrique', 'bois', 'autre'],
          description: 'Système de chauffage actuel',
        },
        caller_name: {
          type: 'string',
          description: 'Nom du prospect',
        },
        caller_email: {
          type: 'string',
          description: 'Email du prospect',
        },
      },
      required: ['project_type', 'urgency', 'is_homeowner', 'postal_code'],
    },
  },
  {
    name: 'check_service_area',
    description: 'Vérifie si le code postal du prospect est dans notre zone de service',
    parameters: {
      type: 'object',
      properties: {
        postal_code: {
          type: 'string',
          description: 'Code postal à vérifier (5 chiffres)',
        },
      },
      required: ['postal_code'],
    },
  },
  {
    name: 'transfer_to_artisan',
    description: "Transfère l'appel en direct vers un artisan disponible",
    parameters: {
      type: 'object',
      properties: {
        project_type: {
          type: 'string',
          description: 'Type de projet pour trouver le bon artisan',
        },
        postal_code: {
          type: 'string',
          description: 'Code postal pour trouver un artisan proche',
        },
      },
      required: ['project_type', 'postal_code'],
    },
  },
]

// ---------------------------------------------------------------------------
// Zones de service par département et verticale
// ---------------------------------------------------------------------------

export const SERVICE_AREAS: Record<string, string[]> = {
  // Ile-de-France + grandes metropoles — phase 1
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
// Scoring — calcule la qualité du lead
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
