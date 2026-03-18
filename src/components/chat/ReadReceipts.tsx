import { ReadReceipt } from '@/lib/realtime/chat-service'
import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadReceiptsProps {
  receipts: ReadReceipt[]
  isOwn: boolean
  className?: string
}

export function ReadReceipts({ receipts, isOwn, className }: ReadReceiptsProps) {
  const hasBeenRead = receipts.length > 0

  if (!isOwn) return null

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const latestReceipt = receipts.sort(
    (a, b) => new Date(b.read_at).getTime() - new Date(a.read_at).getTime()
  )[0]

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs',
        hasBeenRead ? 'text-blue-400' : 'text-gray-400',
        className
      )}
      title={
        hasBeenRead && latestReceipt
          ? `Read at ${formatTime(latestReceipt.read_at)}`
          : 'Unread'
      }
    >
      {hasBeenRead ? (
        <CheckCheck className="w-3.5 h-3.5" />
      ) : (
        <Check className="w-3.5 h-3.5" />
      )}
    </div>
  )
}

export default ReadReceipts
