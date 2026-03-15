'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { ChatMessage, chatService } from '@/lib/realtime/chat-service'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'

interface MessageSearchProps {
  conversationId: string
  onResultClick: (message: ChatMessage) => void
  onClose: () => void
}

export function MessageSearch({ conversationId, onResultClick, onClose }: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChatMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const debouncedQuery = useDebounce(query, 300)

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const messages = await chatService.searchMessages(conversationId, debouncedQuery)
      setResults(messages)
      setCurrentIndex(0)
    } finally {
      setIsSearching(false)
    }
  }, [conversationId, debouncedQuery])

  useEffect(() => {
    performSearch()
  }, [performSearch])

  const navigateResult = (direction: 'up' | 'down') => {
    if (results.length === 0) return

    if (direction === 'up') {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else {
      setCurrentIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      onResultClick(results[currentIndex])
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      navigateResult('up')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      navigateResult('down')
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-inherit">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Search input */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans la conversation..."
            className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateResult('up')}
            disabled={results.length === 0}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            title="Résultat précédent"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateResult('down')}
            disabled={results.length === 0}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            title="Résultat suivant"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Result count */}
        {results.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px] text-right">
            {currentIndex + 1}/{results.length}
          </span>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results list */}
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
          {results.map((message, index) => (
            <button
              key={message.id}
              onClick={() => onResultClick(message)}
              className={cn(
                'w-full px-4 py-2 text-left transition-colors',
                index === currentIndex
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {message.sender_type === 'attorney' ? 'Attorney' : 'Client'}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(message.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                {highlightMatch(message.content, query)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {query && !isSearching && results.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          Aucun message trouvé pour "{query}"
        </div>
      )}
    </div>
  )
}

export default MessageSearch
