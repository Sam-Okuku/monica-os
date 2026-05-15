'use client'

import { FollowUp } from '@/lib/db'
import { resolveFollowUp, nudgeFollowUp, deferFollowUp } from '@/lib/db.queries'
import { hoursAgo, getFollowUpAgeColor } from '@/lib/utils'

interface FollowUpItemProps {
  followUp: FollowUp
  onUpdate: () => void
}

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉', whatsapp: '◎', call: '◷', verbal: '◈', other: '○',
}

export function FollowUpItem({ followUp, onUpdate }: FollowUpItemProps) {
  const hours = hoursAgo(followUp.sent_at)
  const ageColor = getFollowUpAgeColor(followUp.sent_at, followUp.expected_by)
  const isResolved = followUp.status === 'resolved'

  const handleResolve = async () => { await resolveFollowUp(followUp.id!); onUpdate() }
  const handleNudge = async () => { await nudgeFollowUp(followUp.id!); onUpdate() }
  const handleDefer = async () => { await deferFollowUp(followUp.id!); onUpdate() }

  return (
    <div
      className="py-3 border-b last:border-0 transition-all"
      style={{ borderColor: '#F3F4F6', opacity: isResolved ? 0.4 : 1 }}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] flex-shrink-0" style={{ color: '#9CA3AF' }}>
            {CHANNEL_ICONS[followUp.channel] ?? '○'}
          </span>
          <p className="text-[13px] font-semibold truncate" style={{ color: '#1E1B4B', letterSpacing: '-0.01em' }}>
            {followUp.contact_name}
          </p>
          {followUp.status === 'nudged' && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#EDE9FE', color: '#4C1D95' }}
            >
              nudged
            </span>
          )}
        </div>
        <span className={`text-[12px] font-bold tabular-nums flex-shrink-0 ${ageColor}`}>
          {Math.round(hours)}h
        </span>
      </div>

      <p className="text-[12px] mb-2.5 ml-5 leading-relaxed" style={{ color: '#4B5563' }}>
        {followUp.context}
      </p>

      {!isResolved && (
        <div className="flex gap-1.5 ml-5">
          <button
            onClick={handleNudge}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            Nudge
          </button>
          <button
            onClick={handleDefer}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            Defer
          </button>
          <button
            onClick={handleResolve}
            className="px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors"
            style={{ background: '#D4EDDA', color: '#1A7A3A' }}
          >
            Resolved ✓
          </button>
        </div>
      )}
      {isResolved && (
        <p className="text-[10px] font-semibold ml-5" style={{ color: '#4CAF50' }}>✓ Resolved</p>
      )}
    </div>
  )
}