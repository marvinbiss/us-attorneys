/**
 * Lead Matching Module — US Attorneys
 * Public API for the intelligent lead-to-attorney matching system.
 */

export { matchLeadToAttorneys } from './lead-matcher'
export type { LeadInput, MatchResult, MatchReason } from './lead-matcher'

export { distributeLead, reassignLead } from './lead-distributor'
export type { DistributionResult } from './lead-distributor'
