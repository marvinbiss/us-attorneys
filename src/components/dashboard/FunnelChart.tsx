interface FunnelStep {
  stage: string
  count: number
  rate: number
}

interface FunnelChartProps {
  steps: FunnelStep[]
  title?: string
}

const stageColors: Record<string, string> = {
  created: 'bg-blue-500',
  dispatched: 'bg-indigo-500',
  viewed: 'bg-yellow-500',
  quoted: 'bg-green-500',
  accepted: 'bg-emerald-500',
  completed: 'bg-green-700',
  declined: 'bg-gray-400',
  expired: 'bg-orange-400',
}

const stageLabels: Record<string, string> = {
  created: 'Created',
  dispatched: 'Dispatched',
  viewed: 'Viewed',
  quoted: 'Quoted',
  accepted: 'Accepted',
  completed: 'Completed',
  declined: 'Declined',
  expired: 'Expired',
}

export function FunnelChart({ steps, title }: FunnelChartProps) {
  const maxCount = Math.max(...steps.map((s) => s.count), 1)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <div className="space-y-3">
        {steps.map((step) => {
          const widthPct = Math.max((step.count / maxCount) * 100, 2)
          const color = stageColors[step.stage] || 'bg-gray-400'
          const label = stageLabels[step.stage] || step.stage

          return (
            <div key={step.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {step.count}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums w-12 text-right">
                    {step.rate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
