import { cn } from '@/lib/utils'
import { PRIORITY_STYLES, CATEGORY_STYLES } from '@/lib/constants'

interface BadgeProps {
  variant: 'priority' | 'category' | 'status' | 'tag'
  value: string
  className?: string
}

export function Badge({ variant, value, className }: BadgeProps) {
  let bg = 'bg-gray-50'
  let text = 'text-gray-400'
  let label = value

  if (variant === 'priority') {
    const s = PRIORITY_STYLES[value]
    if (s) { bg = s.bg; text = s.text; label = s.label }
  } else if (variant === 'category') {
    const s = CATEGORY_STYLES[value]
    if (s) { bg = s.bg; text = s.text; label = s.label }
  } else if (variant === 'status') {
    if (value === 'done') { bg = 'bg-emerald-50'; text = 'text-emerald-600'; label = 'Done' }
    else if (value === 'pending') { bg = 'bg-blue-50'; text = 'text-blue-500'; label = 'Pending' }
    else if (value === 'deferred') { bg = 'bg-gray-50'; text = 'text-gray-400'; label = 'Deferred' }
    else if (value === 'waiting') { bg = 'bg-amber-50'; text = 'text-amber-600'; label = 'Waiting' }
    else if (value === 'resolved') { bg = 'bg-emerald-50'; text = 'text-emerald-600'; label = 'Resolved' }
    else if (value === 'nudged') { bg = 'bg-blue-50'; text = 'text-blue-500'; label = 'Nudged' }
  } else if (variant === 'tag') {
    if (value === 'verbal') { bg = 'bg-purple-50'; text = 'text-purple-500'; label = 'Verbal' }
    else if (value === 'follow-up') { bg = 'bg-amber-50'; text = 'text-amber-600'; label = 'Follow-up' }
    else if (value === 'note') { bg = 'bg-gray-50'; text = 'text-gray-500'; label = 'Note' }
    else if (value === 'idea') { bg = 'bg-emerald-50'; text = 'text-emerald-600'; label = 'Idea' }
    else { bg = 'bg-gray-50'; text = 'text-gray-400'; label = 'Task' }
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide',
      bg, text, className
    )}>
      {label}
    </span>
  )
}