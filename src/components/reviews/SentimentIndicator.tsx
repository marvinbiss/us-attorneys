import { ThumbsUp, ThumbsDown, Minus, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SentimentIndicatorProps {
  score: number // -1 to 1
  label?: 'positive' | 'neutral' | 'negative' | 'mixed'
  keywords?: string[]
  showScore?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SENTIMENT_CONFIG = {
  positive: {
    icon: ThumbsUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Positive',
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Neutral',
  },
  negative: {
    icon: ThumbsDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Negative',
  },
  mixed: {
    icon: TrendingUp,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Mixed',
  },
}

const SIZE_CONFIG = {
  sm: {
    container: 'gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs',
    keyword: 'text-xs px-1.5 py-0.5',
  },
  md: {
    container: 'gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm',
    keyword: 'text-xs px-2 py-0.5',
  },
  lg: {
    container: 'gap-2',
    icon: 'w-5 h-5',
    text: 'text-base',
    keyword: 'text-sm px-2 py-1',
  },
}

function getSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' | 'mixed' {
  if (score >= 0.3) return 'positive'
  if (score <= -0.3) return 'negative'
  if (score > -0.1 && score < 0.1) return 'neutral'
  return 'mixed'
}

export function SentimentIndicator({
  score,
  label,
  keywords = [],
  showScore = false,
  size = 'md',
  className,
}: SentimentIndicatorProps) {
  const sentimentLabel = label || getSentimentLabel(score)
  const config = SENTIMENT_CONFIG[sentimentLabel]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <div className={cn('flex flex-col', sizeConfig.container, className)}>
      {/* Main indicator */}
      <div className={cn(
        'inline-flex items-center rounded-full border px-2 py-1',
        config.bgColor,
        config.borderColor,
        sizeConfig.container
      )}>
        <Icon className={cn(sizeConfig.icon, config.color)} />
        <span className={cn(sizeConfig.text, config.color, 'font-medium')}>
          {config.label}
        </span>
        {showScore && (
          <span className={cn(sizeConfig.text, 'text-gray-400')}>
            ({(score * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {keywords.slice(0, 5).map((keyword) => (
            <span
              key={keyword}
              className={cn(
                'rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
                sizeConfig.keyword
              )}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Topic-based sentiment display
interface TopicSentimentProps {
  topics: Record<string, number> // {quality: 0.8, price: -0.2}
  size?: 'sm' | 'md'
  className?: string
}

const TOPIC_LABELS: Record<string, string> = {
  quality: 'Quality',
  price: 'Price',
  punctuality: 'Punctuality',
  communication: 'Communication',
  cleanliness: 'Cleanliness',
  professionalism: 'Professionalism',
  value: 'Value for money',
}

export function TopicSentiment({ topics, size = 'sm', className }: TopicSentimentProps) {
  const entries = Object.entries(topics)
  if (entries.length === 0) return null

  return (
    <div className={cn('space-y-1', className)}>
      {entries.map(([topic, score]) => {
        const label = TOPIC_LABELS[topic] || topic
        const sentiment = getSentimentLabel(score)
        const config = SENTIMENT_CONFIG[sentiment]

        return (
          <div key={topic} className="flex items-center gap-2">
            <span className={cn(
              'text-gray-600 dark:text-gray-400 min-w-[100px]',
              size === 'sm' ? 'text-xs' : 'text-sm'
            )}>
              {label}
            </span>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  score >= 0 ? 'bg-green-500' : 'bg-red-500'
                )}
                style={{
                  width: `${Math.abs(score) * 100}%`,
                  marginLeft: score < 0 ? `${(1 + score) * 50}%` : '50%',
                }}
              />
            </div>
            <span className={cn(
              config.color,
              size === 'sm' ? 'text-xs' : 'text-sm',
              'min-w-[40px] text-right'
            )}>
              {score >= 0 ? '+' : ''}{(score * 100).toFixed(0)}%
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default SentimentIndicator
