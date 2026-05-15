'use client'

import { CalendarEvent } from '@/lib/db'
import { formatTime } from '@/lib/utils'
import { updateEvent } from '@/lib/db.queries'

interface EventItemProps {
  event: CalendarEvent
  onUpdate: () => void
}

const EVENT_STYLES: Record<string, { border: string; bg: string; titleColor: string }> = {
  meeting: { border: '#7C3AED', bg: '#F5F3FF', titleColor: '#4C1D95' },
  buffer: { border: '#E5E7EB', bg: '#F9FAFB', titleColor: '#9CA3AF' },
  deadline: { border: '#EF4444', bg: '#FEF2F2', titleColor: '#991B1B' },
  shadow: { border: '#E5E7EB', bg: '#F9FAFB', titleColor: '#D1D5DB' },
  prep: { border: '#D97706', bg: '#FFFBEB', titleColor: '#92400E' },
}

function getDuration(starts: string, ends: string): number {
  try {
    return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000)
  } catch { return 0 }
}

function isPast(endsAt: string): boolean {
  try { return new Date(endsAt).getTime() < Date.now() } catch { return false }
}

export function EventItem({ event, onUpdate }: EventItemProps) {
  const style = EVENT_STYLES[event.event_type] ?? EVENT_STYLES.meeting
  const duration = getDuration(event.starts_at, event.ends_at)
  const past = isPast(event.ends_at)

  const toggleBrief = async () => {
    await updateEvent(event.id!, { brief_sent: !event.brief_sent })
    onUpdate()
  }

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl mb-2 border-l-2 transition-all"
      style={{
        borderLeftColor: style.border,
        background: style.bg,
        opacity: past || event.is_shadow ? 0.4 : 1,
      }}
    >
      <div className="flex-shrink-0 text-right" style={{ minWidth: '44px' }}>
        <p className="text-[11px] font-semibold" style={{ color: '#374151' }}>
          {formatTime(event.starts_at)}
        </p>
        {duration > 0 && (
          <p className="text-[9px] font-medium" style={{ color: '#9CA3AF' }}>{duration}m</p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold truncate mb-1"
          style={{ color: past ? '#9CA3AF' : style.titleColor, letterSpacing: '-0.01em' }}
        >
          {past && <span className="text-[9px] mr-1.5 font-normal">✓</span>}
          {event.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {!event.is_shadow && event.prep_needed && (
            <button
              onClick={toggleBrief}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors"
              style={event.brief_sent
                ? { background: '#D4EDDA', color: '#1A7A3A' }
                : { background: '#FEF3C7', color: '#92400E' }
              }
            >
              {event.brief_sent ? '✓ Briefed' : '! Brief needed'}
            </button>
          )}
          {event.location && (
            <span className="text-[9px] font-medium" style={{ color: '#6B7280' }}>
              ◎ {event.location}
            </span>
          )}
          {event.is_shadow && (
            <span className="text-[9px]" style={{ color: '#D1D5DB' }}>buffer</span>
          )}
        </div>
      </div>
    </div>
  )
}