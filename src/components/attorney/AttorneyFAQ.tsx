'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { HelpCircle, Plus, Minus } from 'lucide-react'
import { Artisan } from './types'

interface AttorneyFAQProps {
  attorney: Artisan
}

export function AttorneyFAQ({ attorney }: AttorneyFAQProps) {
  const reducedMotion = useReducedMotion()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!attorney.faq || attorney.faq.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: 0.4 }}
      className="bg-[#FFFCF8] dark:bg-gray-800 rounded-2xl shadow-soft border border-stone-200/60 dark:border-gray-700 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-clay-50 dark:bg-clay-900/30 flex items-center justify-center">
          <HelpCircle className="w-4.5 h-4.5 text-clay-400" aria-hidden="true" />
        </div>
        Frequently Asked Questions
      </h2>

      {/* FAQPage schema markup for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: attorney.faq.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />

      <div className="space-y-3" role="region" aria-label="Frequently asked questions">
        {attorney.faq.map((item, index) => {
          const isOpen = openIndex === index
          const headingId = `faq-heading-${index}`
          const panelId = `faq-panel-${index}`

          return (
            <motion.div
              key={index}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reducedMotion ? { duration: 0 } : { delay: index * 0.05 }}
              className="border border-stone-200/60 dark:border-gray-600 rounded-xl overflow-hidden"
            >
              <h3>
                <button
                  id={headingId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full px-5 py-4 flex items-center justify-between text-left bg-sand-50 dark:bg-gray-700/50 hover:bg-sand-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-inset"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">{item.question}</span>
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-clay-400 text-white' : 'bg-sand-300 dark:bg-gray-600 text-stone-600 dark:text-gray-300'}`}
                    aria-hidden="true"
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </button>
              </h3>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={headingId}
                    initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
