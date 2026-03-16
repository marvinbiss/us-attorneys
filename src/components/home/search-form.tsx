'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

export function SearchForm() {
  const router = useRouter()
  const [service, setService] = useState('')
  const [city, setCity] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const s = service.toLowerCase().trim().replace(/\s+/g, '-')
    const c = city.toLowerCase().trim().replace(/\s+/g, '-')
    if (s && c) router.push(`/practice-areas/${s}/${c}`)
    else if (s) router.push(`/practice-areas/${s}`)
    else router.push('/practice-areas')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-lg">
        <Input
          type="text"
          placeholder="What practice area?"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="flex-1 border-0 dark:bg-gray-700"
        />
        <Input
          type="text"
          placeholder="Where?"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="flex-1 border-0 dark:bg-gray-700"
        />
        <Button type="submit" size="lg">
          Search
        </Button>
      </div>
    </form>
  )
}
