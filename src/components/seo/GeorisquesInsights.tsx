// TODO: Replace with US equivalent (FEMA flood maps, USGS earthquake data, EPA radon zones, etc.)
// Original component used French government natural hazard database — not yet adapted for US.

import type { LocationData } from '@/lib/data/location-data'

interface Props {
  locationData: LocationData | null
  cityName: string
  specialtySlug: string
}

export default function GeorisquesInsights(_props: Props) {
  return null
}
