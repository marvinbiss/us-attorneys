'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Plus, Minus } from 'lucide-react'
import { Artisan } from './types'

interface AttorneyFAQProps {
  artisan: Artisan
}

export function AttorneyFAQ({ artisan }: AttorneyFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!artisan.faq || artisan.faq.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-[#FFFCF8] rounded-2xl shadow-soft border border-stone-200/60 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-clay-400" />
        Questions fréquentes
      </h2>

      <div className="space-y-3" role="region" aria-label="Questions fréquentes">
        {artisan.faq.map((item, index) => {
          const isOpen = openIndex === index
          const headingId = `faq-heading-${index}`
          const panelId = `faq-panel-${index}`

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="border border-stone-200/60 rounded-xl overflow-hidden"
            >
              <h3>
                <button
                  id={headingId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full px-5 py-4 flex items-center justify-between text-left bg-sand-50 hover:bg-sand-200 transition-colors focus:outline-none focus:ring-2 focus:ring-clay-400 focus:ring-inset"
                >
                  <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-clay-400 text-white' : 'bg-sand-300 text-stone-600'}`}
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
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-4 bg-white text-gray-600 leading-relaxed">
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
