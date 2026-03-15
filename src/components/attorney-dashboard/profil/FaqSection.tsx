'use client'

import { HelpCircle, Plus, X } from 'lucide-react'
import { SectionCard } from './SectionCard'
import { useAttorneyForm } from './useAttorneyForm'

interface FaqSectionProps {
  provider: Record<string, unknown>
  onSaved: (updated: Record<string, unknown>) => void
}

interface FaqItem {
  question: string
  answer: string
}

const MAX_FAQ = 15
const MIN_QUESTION_LENGTH = 5
const MIN_ANSWER_LENGTH = 10

const FIELDS = ['faq'] as const

export function FaqSection({ provider, onSaved }: FaqSectionProps) {
  const { formData, setField, isDirty, saving, error, success, handleSave } = useAttorneyForm(provider, FIELDS)

  const onSave = async () => {
    const updated = await handleSave()
    if (updated) onSaved(updated)
  }

  const faqItems = (formData.faq as FaqItem[]) || []

  const addFaq = () => {
    if (faqItems.length >= MAX_FAQ) return
    setField('faq', [...faqItems, { question: '', answer: '' }])
  }

  const updateFaq = (index: number, field: keyof FaqItem, value: string) => {
    const updated = faqItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setField('faq', updated)
  }

  const removeFaq = (index: number) => {
    setField('faq', faqItems.filter((_, i) => i !== index))
  }

  const faqAtMax = faqItems.length >= MAX_FAQ

  return (
    <SectionCard
      title="Frequently Asked Questions"
      icon={HelpCircle}
      onSave={onSave}
      saving={saving}
      isDirty={isDirty}
      error={error}
      success={success}
    >
      <div className="space-y-6">
        {/* Header with counter and add button */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {faqItems.length}/{MAX_FAQ} questions
          </span>
          <button
            type="button"
            onClick={addFaq}
            disabled={faqAtMax}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {faqAtMax ? 'Limit reached' : 'Add a question'}
          </button>
        </div>

        {/* Empty state */}
        {faqItems.length === 0 && (
          <p className="text-sm text-gray-500 italic bg-gray-50 px-4 py-3 rounded-lg">
            Add frequently asked questions to help your clients better understand your services.
          </p>
        )}

        {/* FAQ items */}
        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const questionTooShort = item.question.trim().length > 0 && item.question.trim().length < MIN_QUESTION_LENGTH
            const answerTooShort = item.answer.trim().length > 0 && item.answer.trim().length < MIN_ANSWER_LENGTH
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                  aria-label={`Delete question ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-3 pr-6">
                  <div>
                    <label htmlFor={`faq-question-${index}`} className="block text-xs text-gray-500 mb-1">
                      Question *
                    </label>
                    <input
                      id={`faq-question-${index}`}
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      maxLength={200}
                      minLength={MIN_QUESTION_LENGTH}
                      placeholder="E.g.: What are your response times?"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        questionTooShort ? 'border-amber-300' : 'border-gray-300'
                      }`}
                    />
                    {questionTooShort && (
                      <p className="text-xs text-amber-600 mt-0.5">{MIN_QUESTION_LENGTH} characters minimum</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`faq-answer-${index}`} className="block text-xs text-gray-500 mb-1">
                      Answer *
                    </label>
                    <textarea
                      id={`faq-answer-${index}`}
                      value={item.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      maxLength={2000}
                      minLength={MIN_ANSWER_LENGTH}
                      rows={3}
                      placeholder="Your detailed answer..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y ${
                        answerTooShort ? 'border-amber-300' : 'border-gray-300'
                      }`}
                    />
                    {answerTooShort && (
                      <p className="text-xs text-amber-600 mt-0.5">{MIN_ANSWER_LENGTH} characters minimum</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}
