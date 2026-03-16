// TODO: Replace with US-specific local data insights (Census data, BLS stats, etc.)
// Original component displayed French-specific local statistics (DPE energy ratings, artisan counts, etc.)

import type { LocationData } from '@/lib/data/location-data'

interface LocalDataInsightsProps {
  locationData: LocationData | null
  specialtySlug: string
  specialtyName: string
  villeName: string
}

export default function LocalDataInsights(_props: LocalDataInsightsProps) {
  return null
}
