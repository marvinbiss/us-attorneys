// TODO: Replace with US-specific local data insights (Census data, BLS stats, etc.)
// Original component displayed location-specific statistics — not yet adapted for US attorneys.

import type { LocationData } from '@/lib/data/location-data'

interface LocalDataInsightsProps {
  locationData: LocationData | null
  specialtySlug: string
  specialtyName: string
  cityName: string
}

export default function LocalDataInsights(_props: LocalDataInsightsProps) {
  return null
}
