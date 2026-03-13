'use client'

import { useEffect } from 'react'
import { recordSearch, type RecentSearch } from './RecentSearches'

interface SearchRecorderProps {
  type: RecentSearch['type']
  label: string
  href: string
}

export default function SearchRecorder({ type, label, href }: SearchRecorderProps) {
  useEffect(() => {
    recordSearch({ type, label, href })
  }, [type, label, href])

  return null
}
