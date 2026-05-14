'use client'

import { CalendarEvent } from '@/lib/db'
import { formatTime, cn } from '@/lib/utils'
import { updateEvent } from '@/lib/db.queries'

interface EventItemProps {
  event: CalendarEvent
  onUpdate: () => void
  showTimeline?: boolean
}

const EVENT_CONFIG: Record<string, { border: string; bg: string; label: string }> = {
  meeting: { border: '#6C63B6', bg: '#F8F7FF', label: 'Meeting' },
  buffer: { border: '#ECEAE5', bg: '#FAFAF9', label: 'Buffer' },
  deadline: { border: '#C94F2C', bg: '#FEF5F2', label: 'Deadline' },
  shadow: { border: '#ECEAE5', bg: '#FAFAF9', label: 'Shadow' },
  prep: { border: '#D4860A', bg: '#FFFBF2', label: 'Prep' },
}

function getDurationMinutes(starts: string, ends: string): number {
  try {
    return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000)
  } catch { return 0 }
}

export function EventItem({ event, onUpdate, showTimeline = false }: EventItemProps) {
  const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.meeting
  const duration = getDurationMinutes(event.starts_at, event.ends_at)

  const toggleBrief = async () => {
    await updateEvent(event.id!, { brief_sent: !event.brief_sent })
    onUpdate()
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl mb-2 border-l-2 transition-all',
        event.is_shadow && 'opacity-40'
      )}
      style={{
        borderLeftColor: config.border,
        background: config.bg,
      }}
    >
      <div className="flex-shrink-0 text-right" style={{ minWidth: '48px' }}>
        <p className="text-[11px] font-medium text-gray-500">{formatTime(event.starts_at)}</p>
        {duration > 0 && (
          <p className="text-[9px] text-gray-300 mt-0.5">{duration}m</p>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium text-gray-700 truncate mb-1"
          style={{ letterSpacing: '-0.005em' }}
        >
          {event.title}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {event.is_shadow ? (
            <span className="text-[9px] text-gray-300 italic">buffer window</span>
          ) : (
            <>
              {event.prep_needed && (
                <button
                  onClick={toggleBrief}
                  className={cn(
                    'text-[9px] font-medium px-2 py-0.5 rounded-full transition-colors',
                    event.brief_sent
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  )}
                >
                  {event.brief_sent ? '✓ Briefed' : '! Brief needed'}
                </button>
              )}
              {event.location && (
                <span className="text-[9px] text-gray-400">◎ {event.location}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}