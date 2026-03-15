'use client'

import { useState } from 'react'
import { Search, Zap, Clock, X } from 'lucide-react'
import { QuickReplyTemplate } from '@/lib/realtime/chat-service'
import { cn } from '@/lib/utils'

interface QuickRepliesProps {
  templates: QuickReplyTemplate[]
  onSelect: (template: QuickReplyTemplate) => void
  onClose: () => void
}

export function QuickReplies({ templates, onSelect, onClose }: QuickRepliesProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(templates.map((t) => t.category || 'general')))

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !search ||
      template.title.toLowerCase().includes(search.toLowerCase()) ||
      template.content.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Sort by usage count
  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.usage_count - a.usage_count)

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <Zap className="w-4 h-4 text-yellow-500" />
          Quick replies
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Search and filters */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category pills */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-2 py-1 text-xs rounded-full transition-colors',
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors capitalize',
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates list */}
      <div className="max-h-48 overflow-y-auto">
        {sortedTemplates.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No quick replies found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {template.title}
                  </span>
                  {template.shortcut && (
                    <code className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                      /{template.shortcut}
                    </code>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {template.content}
                </p>
                {template.usage_count > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    Used {template.usage_count} times
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuickReplies
