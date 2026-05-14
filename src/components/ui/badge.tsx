import { cn } from '@/lib/utils'
import { PRIORITY_COLORS, CATEGORY_COLORS } from '@/lib/constants'

interface BadgeProps {
  variant?: 'priority' | 'category' | 'status' | 'custom'
  value?: string
  children?: React.ReactNode
  className?: string
}

export function Badge({ variant, value, children, className }: BadgeProps) {
  let colorClass = 'bg-gray-50 text-gray-500 border-gray-200'

  if (variant === 'priority' && value) {
    colorClass = PRIORITY_COLORS[value] ?? colorClass
  } else if (variant === 'category' && value) {
    colorClass = CATEGORY_COLORS[value] ?? colorClass
  } else if (variant === 'status') {
    if (value === 'done') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (value === 'pending') colorClass = 'bg-blue-50 text-blue-600 border-blue-200'
    if (value === 'deferred') colorClass = 'bg-gray-50 text-gray-400 border-gray-200'
    if (value === 'waiting') colorClass = 'bg-amber-50 text-amber-700 border-amber-200'
    if (value === 'resolved') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
      colorClass,
      className
    )}>
      {children ?? value}
    </span>
  )
}