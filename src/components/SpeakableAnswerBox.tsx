import { SITE_NAME } from '@/lib/seo/config'

interface SpeakableAnswerBoxProps {
  answer: string
  source?: string
  updatedDate?: string
}

export function SpeakableAnswerBox({ answer, source, updatedDate }: SpeakableAnswerBoxProps) {
  return (
    <div
      data-speakable="true"
      className="speakable-summary mb-8 rounded-xl border border-blue-100 bg-blue-50/50 px-6 py-5"
    >
      <p className="text-base leading-relaxed text-gray-800">
        {answer}
      </p>
      <p className="mt-3 text-xs text-gray-500">
        Source: {source || SITE_NAME} — Verified bar records
        {updatedDate && ` — Updated: ${updatedDate}`}
      </p>
    </div>
  )
}
