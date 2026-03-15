'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type {
  ServiceStructuredData,
  HomepageStructuredData,
  FaqStructuredData,
} from '@/types/cms'

// Maximum number of items allowed per structured field type
const STRUCTURED_LIMITS = {
  faqItems: 50,
  commonTasks: 30,
  tips: 20,
  certifications: 20,
  homepageSections: 20,
} as const

interface StructuredFieldsEditorProps {
  value: Record<string, unknown>
  pageType: string
  onChange: (data: Record<string, unknown>) => void
}

export function StructuredFieldsEditor({ value, pageType, onChange }: StructuredFieldsEditorProps) {
  const update = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val })
  }

  switch (pageType) {
    case 'service':
      return <ServiceFields data={value as unknown as ServiceStructuredData} update={update} />
    case 'faq':
      return <FaqFields data={value as unknown as FaqStructuredData} update={update} />
    case 'homepage':
      return <HomepageFields data={value as unknown as HomepageStructuredData} update={update} />
    default:
      return (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          No structured fields available for page type &laquo;{pageType}&raquo;.
        </div>
      )
  }
}

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Service fields                                                      */
/* ------------------------------------------------------------------ */

interface ServiceFieldsProps {
  data: ServiceStructuredData
  update: (key: string, value: unknown) => void
}

function ServiceFields({ data, update }: ServiceFieldsProps) {
  const certInputRef = useRef<HTMLInputElement>(null)
  const priceRange = data.priceRange || { min: 0, max: 0, unit: 'USD' }
  const commonTasks = data.commonTasks || []
  const tips = data.tips || []
  const faq = data.faq || []
  const certifications = data.certifications || []

  // Validation state for FAQ items
  const [faqTouched, setFaqTouched] = useState<Record<number, { question?: boolean; answer?: boolean }>>({})
  // Validation state for common tasks
  const [taskTouched, setTaskTouched] = useState<Record<number, { name?: boolean }>>({})

  const priceRangeError =
    priceRange.min < 0
      ? 'Minimum must be >= 0'
      : priceRange.max < 0
        ? 'Maximum must be >= 0'
        : priceRange.min > priceRange.max && priceRange.max > 0
          ? 'Minimum cannot exceed maximum'
          : null

  return (
    <div className="space-y-8">
      {/* Price range */}
      <div>
        <SectionHeader title="Price range" description="Minimum and maximum price for the service" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min</label>
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) =>
                update('priceRange', { ...priceRange, min: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Max</label>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) =>
                update('priceRange', { ...priceRange, max: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="0"
              min={0}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Unit</label>
            <input
              type="text"
              value={priceRange.unit}
              onChange={(e) =>
                update('priceRange', { ...priceRange, unit: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="EUR"
            />
          </div>
        </div>
        {priceRangeError && (
          <p className="mt-1 text-xs text-red-600">{priceRangeError}</p>
        )}
      </div>

      {/* Common tasks */}
      <div>
        <SectionHeader title="Common tasks" description="Services with price range" />
        <div className="space-y-2">
          {/* key={index} is safe: items are added at end and removed by explicit index */}
          {commonTasks.map((task, index) => {
            const nameEmpty = taskTouched[index]?.name && !task.name.trim()
            const taskPriceError =
              task.priceMin < 0
                ? 'Minimum must be >= 0'
                : task.priceMax < 0
                  ? 'Maximum must be >= 0'
                  : task.priceMin > task.priceMax && task.priceMax > 0
                    ? 'Minimum cannot exceed maximum'
                    : null

            return (
              <div key={index}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => {
                        const updated = [...commonTasks]
                        updated[index] = { ...task, name: e.target.value }
                        update('commonTasks', updated)
                      }}
                      onBlur={() =>
                        setTaskTouched((prev) => ({
                          ...prev,
                          [index]: { ...prev[index], name: true },
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        nameEmpty ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Task name"
                    />
                    {nameEmpty && (
                      <p className="mt-0.5 text-xs text-red-600">Name required</p>
                    )}
                  </div>
                  <input
                    type="number"
                    value={task.priceMin}
                    onChange={(e) => {
                      const updated = [...commonTasks]
                      updated[index] = { ...task, priceMin: Number(e.target.value) }
                      update('commonTasks', updated)
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Min"
                    min={0}
                  />
                  <input
                    type="number"
                    value={task.priceMax}
                    onChange={(e) => {
                      const updated = [...commonTasks]
                      updated[index] = { ...task, priceMax: Number(e.target.value) }
                      update('commonTasks', updated)
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Max"
                    min={0}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = commonTasks.filter((_, i) => i !== index)
                      update('commonTasks', updated)
                      // Clean up touched state
                      setTaskTouched((prev) => {
                        const next = { ...prev }
                        delete next[index]
                        return next
                      })
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                    aria-label="Delete this item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {taskPriceError && (
                  <p className="mt-0.5 text-xs text-red-600">{taskPriceError}</p>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            update('commonTasks', [...commonTasks, { name: '', priceMin: 0, priceMax: 0 }])
          }
          disabled={commonTasks.length >= STRUCTURED_LIMITS.commonTasks}
          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            commonTasks.length >= STRUCTURED_LIMITS.commonTasks
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add a task ({commonTasks.length}/{STRUCTURED_LIMITS.commonTasks})
        </button>
      </div>

      {/* Tips */}
      <div>
        <SectionHeader title="Tips" description="Useful tips for clients" />
        <div className="space-y-2">
          {/* key={index} is safe: items are added at end and removed by explicit index */}
          {tips.map((tip, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={tip}
                onChange={(e) => {
                  const updated = [...tips]
                  updated[index] = e.target.value
                  update('tips', updated)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Tip..."
              />
              <button
                type="button"
                onClick={() => {
                  const updated = tips.filter((_, i) => i !== index)
                  update('tips', updated)
                }}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => update('tips', [...tips, ''])}
          disabled={tips.length >= STRUCTURED_LIMITS.tips}
          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            tips.length >= STRUCTURED_LIMITS.tips
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add a tip ({tips.length}/{STRUCTURED_LIMITS.tips})
        </button>
      </div>

      {/* FAQ */}
      <div>
        <SectionHeader title="FAQ" description="Frequently asked questions" />
        <div className="space-y-3">
          {/* key={index} is safe: items are added at end and removed by explicit index */}
          {faq.map((item, index) => {
            const questionEmpty = faqTouched[index]?.question && !item.question.trim()
            const answerEmpty = faqTouched[index]?.answer && !item.answer.trim()

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...faq]
                        updated[index] = { ...item, question: e.target.value }
                        update('faq', updated)
                      }}
                      onBlur={() =>
                        setFaqTouched((prev) => ({
                          ...prev,
                          [index]: { ...prev[index], question: true },
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white ${
                        questionEmpty ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Question"
                    />
                    {questionEmpty && (
                      <p className="mt-0.5 text-xs text-red-600">Question required</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = faq.filter((_, i) => i !== index)
                      update('faq', updated)
                      setFaqTouched((prev) => {
                        const next = { ...prev }
                        delete next[index]
                        return next
                      })
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                    aria-label="Delete this item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...faq]
                    updated[index] = { ...item, answer: e.target.value }
                    update('faq', updated)
                  }}
                  onBlur={() =>
                    setFaqTouched((prev) => ({
                      ...prev,
                      [index]: { ...prev[index], answer: true },
                    }))
                  }
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white ${
                    answerEmpty ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Answer"
                />
                {answerEmpty && (
                  <p className="mt-0.5 text-xs text-red-600">Answer required</p>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => update('faq', [...faq, { question: '', answer: '' }])}
          disabled={faq.length >= STRUCTURED_LIMITS.faqItems}
          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            faq.length >= STRUCTURED_LIMITS.faqItems
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add a question ({faq.length}/{STRUCTURED_LIMITS.faqItems})
        </button>
      </div>

      {/* Certifications */}
      <div>
        <SectionHeader title="Certifications" description="Provider labels and certifications" />
        <div className="flex flex-wrap gap-2 mb-2">
          {/* key={index} is safe: items are added at end and removed by explicit index */}
          {certifications.map((cert, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
            >
              {cert}
              <button
                type="button"
                onClick={() => {
                  const updated = certifications.filter((_, i) => i !== index)
                  update('certifications', updated)
                }}
                className="text-blue-400 hover:text-blue-700 ml-0.5"
                aria-label={`Remove certification ${cert}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            ref={certInputRef}
            placeholder="New certification..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (certifications.length >= STRUCTURED_LIMITS.certifications) return
                const input = e.target as HTMLInputElement
                const value = input.value.trim()
                if (value && !certifications.includes(value)) {
                  update('certifications', [...certifications, value])
                  input.value = ''
                }
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (certifications.length >= STRUCTURED_LIMITS.certifications) return
              const input = certInputRef.current
              const value = input?.value.trim()
              if (value && !certifications.includes(value)) {
                update('certifications', [...certifications, value])
                if (input) input.value = ''
              }
            }}
            disabled={certifications.length >= STRUCTURED_LIMITS.certifications}
            aria-label="Add certification"
            className={`px-3 py-2 text-white text-sm rounded-lg transition-colors ${
              certifications.length >= STRUCTURED_LIMITS.certifications
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {certifications.length >= STRUCTURED_LIMITS.certifications ? (
          <p className="mt-1 text-xs text-gray-500">
            Limit reached ({certifications.length}/{STRUCTURED_LIMITS.certifications})
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-400">
            {certifications.length}/{STRUCTURED_LIMITS.certifications}
          </p>
        )}
      </div>

      {/* Average response time */}
      <div>
        <SectionHeader title="Average response time" />
        <input
          type="text"
          value={data.averageResponseTime || ''}
          onChange={(e) => update('averageResponseTime', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="E.g.: 30 minutes"
        />
      </div>

      {/* Emergency info */}
      <div>
        <SectionHeader title="Emergency information" />
        <textarea
          value={data.emergencyInfo || ''}
          onChange={(e) => update('emergencyInfo', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y"
          placeholder="E.g.: Available 24/7"
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FAQ fields                                                          */
/* ------------------------------------------------------------------ */

interface FaqFieldsProps {
  data: FaqStructuredData
  update: (key: string, value: unknown) => void
}

function FaqFields({ data, update }: FaqFieldsProps) {
  const categoryName = data.categoryName || ''
  const items = data.items || []
  const [touched, setTouched] = useState<Record<number, { question?: boolean; answer?: boolean }>>({})

  return (
    <div className="space-y-6">
      {/* Category name */}
      <div>
        <SectionHeader title="Category name" />
        <input
          type="text"
          value={categoryName}
          onChange={(e) => update('categoryName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="E.g.: General questions, Pricing..."
        />
      </div>

      {/* Q&A items */}
      <div>
        <SectionHeader title="Questions / Answers" />
        <div className="space-y-3">
          {/* key={index} is safe: items are added at end and removed by explicit index */}
          {items.map((item, index) => {
            const questionEmpty = touched[index]?.question && !item.question.trim()
            const answerEmpty = touched[index]?.answer && !item.answer.trim()

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...items]
                        updated[index] = { ...item, question: e.target.value }
                        update('items', updated)
                      }}
                      onBlur={() =>
                        setTouched((prev) => ({
                          ...prev,
                          [index]: { ...prev[index], question: true },
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white ${
                        questionEmpty ? 'border-red-400' : 'border-gray-300'
                      }`}
                      placeholder="Question"
                    />
                    {questionEmpty && (
                      <p className="mt-0.5 text-xs text-red-600">Question required</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = items.filter((_, i) => i !== index)
                      update('items', updated)
                      setTouched((prev) => {
                        const next = { ...prev }
                        delete next[index]
                        return next
                      })
                    }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                    aria-label="Delete this item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...items]
                    updated[index] = { ...item, answer: e.target.value }
                    update('items', updated)
                  }}
                  onBlur={() =>
                    setTouched((prev) => ({
                      ...prev,
                      [index]: { ...prev[index], answer: true },
                    }))
                  }
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y bg-white ${
                    answerEmpty ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="Answer (rich text supported)"
                />
                {answerEmpty && (
                  <p className="mt-0.5 text-xs text-red-600">Answer required</p>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => update('items', [...items, { question: '', answer: '' }])}
          disabled={items.length >= STRUCTURED_LIMITS.faqItems}
          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            items.length >= STRUCTURED_LIMITS.faqItems
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add a question ({items.length}/{STRUCTURED_LIMITS.faqItems})
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Homepage fields                                                     */
/* ------------------------------------------------------------------ */

interface HomepageFieldsProps {
  data: HomepageStructuredData
  update: (key: string, value: unknown) => void
}

function HomepageFields({ data, update }: HomepageFieldsProps) {
  const sections = data.sections || []

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Section Hero"
        description="Main content displayed at the top of the homepage"
      />

      <div>
        <label className="block text-xs text-gray-500 mb-1">Hero Title</label>
        <input
          type="text"
          value={data.heroTitle || ''}
          onChange={(e) => update('heroTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Main homepage title"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Hero Subtitle</label>
        <textarea
          value={data.heroSubtitle || ''}
          onChange={(e) => update('heroSubtitle', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          placeholder="Subtitle or tagline"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">CTA button text</label>
          <input
            type="text"
            value={data.heroCtaText || ''}
            onChange={(e) => update('heroCtaText', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="E.g.: Request a consultation"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">CTA button URL</label>
          <input
            type="text"
            value={data.heroCtaUrl || ''}
            onChange={(e) => update('heroCtaUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="/quotes"
          />
        </div>
      </div>

      {/* Sections */}
      <div>
        <SectionHeader title="Sections" description="Homepage sections" />
        <div className="space-y-3">
          {/* key={index} is safe: items are added at end and removed by explicit index */}
          {sections.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Identifier</label>
                    <input
                      type="text"
                      value={section.id}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[index] = { ...section, id: e.target.value }
                        update('sections', updated)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      placeholder="E.g.: services, testimonials"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[index] = { ...section, title: e.target.value }
                        update('sections', updated)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      placeholder="Section title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Subtitle (optional)</label>
                    <input
                      type="text"
                      value={section.subtitle || ''}
                      onChange={(e) => {
                        const updated = [...sections]
                        updated[index] = { ...section, subtitle: e.target.value || undefined }
                        update('sections', updated)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      placeholder="Section subtitle"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = sections.filter((_, i) => i !== index)
                    update('sections', updated)
                  }}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            update('sections', [...sections, { id: '', title: '', subtitle: undefined }])
          }
          disabled={sections.length >= STRUCTURED_LIMITS.homepageSections}
          className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            sections.length >= STRUCTURED_LIMITS.homepageSections
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add a section ({sections.length}/{STRUCTURED_LIMITS.homepageSections})
        </button>
      </div>
    </div>
  )
}
