/**
 * STUB — French diagnostic tree removed.
 * TODO: Replace with US legal issue diagnostic or remove all usages.
 */

export interface DiagnosticSubProblem {
  id: string
  label: string
  description: string
  recommendedService: string
  alternativeServices?: string[]
  estimatedPriceRange?: string
  urgencyTip?: string
}

export interface DiagnosticCategory {
  id: string
  label: string
  icon: string
  subProblems: DiagnosticSubProblem[]
}

export const diagnosticCategories: DiagnosticCategory[] = []
export const serviceLabels: Record<string, string> = {}
export const serviceIcons: Record<string, string> = {}
