'use client'

export function RequestConsultationButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('sa:open-estimation'))}
      className="inline-flex items-center gap-2 bg-clay-400 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-clay-600 transition-colors"
    >
      Request a Free Consultation
    </button>
  )
}
