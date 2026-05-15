import { PRIORITY_STYLES, CATEGORY_STYLES } from '@/lib/constants'

interface BadgeProps {
  variant: 'priority' | 'category' | 'status' | 'tag'
  value: string
  className?: string
}

export function Badge({ variant, value, className }: BadgeProps) {
  let bg = '#F3F4F6'
  let text = '#374151'
  let label = value

  if (variant === 'priority') {
    const s = PRIORITY_STYLES[value]
    if (s) { bg = s.bg; text = s.text; label = s.label }
  } else if (variant === 'category') {
    const s = CATEGORY_STYLES[value]
    if (s) { bg = s.bg; text = s.text; label = s.label }
  } else if (variant === 'status') {
    if (value === 'completed' || value === 'done') { bg = '#D4EDDA'; text = '#1A7A3A'; label = 'Done' }
    else if (value === 'in-progress' || value === 'pending') { bg = '#FFF9C4'; text = '#7A6500'; label = 'In progress' }
    else if (value === 'tbc' || value === 'deferred') { bg = '#EDE7F6'; text = '#4A3B8C'; label = 'TBC' }
    else if (value === 'not-started') { bg = '#FCE4EC'; text = '#9C1B3E'; label = 'Not started' }
    else if (value === 'waiting') { bg = '#FFF9C4'; text = '#7A6500'; label = 'Waiting' }
    else if (value === 'resolved') { bg = '#D4EDDA'; text = '#1A7A3A'; label = 'Resolved' }
    else if (value === 'nudged') { bg = '#EDE9FE'; text = '#4C1D95'; label = 'Nudged' }
  } else if (variant === 'tag') {
    if (value === 'verbal') { bg = '#EDE9FE'; text = '#4C1D95'; label = 'Verbal' }
    else if (value === 'follow-up') { bg = '#FFF9C4'; text = '#7A6500'; label = 'Follow-up' }
    else if (value === 'note') { bg = '#F3F4F6'; text = '#374151'; label = 'Note' }
    else if (value === 'idea') { bg = '#D4EDDA'; text = '#1A7A3A'; label = 'Idea' }
    else { bg = '#F3F4F6'; text = '#374151'; label = 'Task' }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${className ?? ''}`}
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  )
}