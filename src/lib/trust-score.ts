/**
 * Trust Score Engine
 *
 * Transparent, explainable 1-10 trust score for attorneys.
 * Every factor is publicly visible -- no black box.
 *
 * Differentiator vs Avvo: our score breakdown is 100% transparent.
 * Users can see exactly WHY an attorney has a given score.
 */

// -- Factor definitions --

export type TrustFactor =
  | 'barVerification'
  | 'yearsExperience'
  | 'reviewRating'
  | 'reviewVolume'
  | 'casesHandled'
  | 'winRate'
  | 'profileCompleteness'

// -- Factor labels (human-readable names) --

export const FACTOR_LABELS: Record<TrustFactor, string> = {
  barVerification: 'Bar Verification',
  yearsExperience: 'Years of Experience',
  reviewRating: 'Review Rating',
  reviewVolume: 'Review Volume',
  casesHandled: 'Cases Handled',
  winRate: 'Win Rate',
  profileCompleteness: 'Profile Completeness',
}

// -- Factor descriptions (tooltip / explainer text) --

export const FACTOR_DESCRIPTIONS: Record<TrustFactor, string> = {
  barVerification: 'Whether the attorney has a verified bar license in good standing.',
  yearsExperience: 'Number of years the attorney has been practicing law.',
  reviewRating: 'Average rating from verified client reviews.',
  reviewVolume: 'Total number of client reviews received.',
  casesHandled: 'Total number of cases the attorney has handled.',
  winRate: 'Percentage of cases with a favorable outcome.',
  profileCompleteness: 'How complete the attorney profile is (bio, photo, specialties, etc.).',
}

// -- Factor weights (multiplier for score calculation) --

export const WEIGHTS: Record<TrustFactor, number> = {
  barVerification: 3,
  yearsExperience: 2,
  reviewRating: 2,
  reviewVolume: 1.5,
  casesHandled: 1.5,
  winRate: 2,
  profileCompleteness: 1,
}