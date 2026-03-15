import { HelpCircle, ChevronDown } from 'lucide-react'

interface ArticleFAQProps {
  items: { question: string; answer: string }[]
}

export function ArticleFAQ({ items }: ArticleFAQProps) {
  if (items.length === 0) return null

  return (
    <div className="article-faq mt-14">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-amber-500" />
        Frequently asked questions
      </h2>

      <div className="space-y-3" role="region" aria-label="Frequently asked questions">
        {items.map((item, index) => (
          <details key={index} className="article-faq-item border-b border-gray-100">
            <summary className="flex items-center justify-between py-4 cursor-pointer text-gray-900 font-medium hover:text-blue-600 transition-colors">
              <span className="pr-4">{item.question}</span>
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </summary>
            <div className="faq-answer pb-4 text-gray-600 leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
