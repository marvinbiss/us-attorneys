// TODO: Replace with US equivalent (FEMA flood maps, USGS earthquake data, EPA radon zones, etc.)
// Georisques was a French government natural hazard database - not applicable to US attorneys.

import type { LocationData } from '@/lib/data/location-data'

interface Props {
  locationData: LocationData | null
  villeName: string
  specialtySlug: string
}

export default function GeorisquesInsights(_props: Props) {
  return null
}
