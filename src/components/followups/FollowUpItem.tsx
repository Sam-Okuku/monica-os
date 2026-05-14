'use client'

import { FollowUp } from '@/lib/db'
import { resolveFollowUp, nudgeFollowUp, deferFollowUp } from '@/lib/db.queries'
import { hoursAgo, getFollowUpAgeColor } from '@/lib/utils'

interface FollowUpItemProps {
  followUp: FollowUp
  onUpdate: () => void
}

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉',
  whatsapp: '◎',
  call: '◷',
  verbal: '◈',
  other: '○',
}

export function FollowUpItem({ followUp, onUpdate }: FollowUpItemProps) {
  const hours = hoursAgo(followUp.sent_at)
  const ageColor = getFollowUpAgeColor(followUp.sent_at, followUp.expected_by)
  const isResolved = followUp.status === 'resolved'

  const handleResolve = async () => { await resolveFollowUp(followUp.id!); onUpdate() }
  const handleNudge = async () => { await nudgeFollowUp(followUp.id!); onUpdate() }
  const handleDefer = async () => { await deferFollowUp(followUp.id!); onUpdate() }

  return (
    <div className={`py-3.5 border-b border-gray-50 last:border-0 transition-all ${isResolved ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-200 text-xs flex-shrink-0">
            {CHANNEL_ICONS[followUp.channel] ?? '○'}
          </span>
          <p className="text-[13px] font-medium text-gray-700 truncate" style={{ letterSpacing: '-0.005em' }}>
            {followUp.contact_name}
          </p>
          {followUp.status === 'nudged' && (
            <span className="text-[9px] bg-blue-50 text-blue-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
              nudged
            </span>
          )}
        </div>
        <span className={`text-[11px] font-semibold tabular-nums flex-shrink-0 ${ageColor}`}>
          {Math.round(hours)}h
        </span>
      </div>

      <p className="text-[11px] text-gray-400 mb-2.5 ml-4 leading-relaxed">{followUp.context}</p>

      {!isResolved && (
        <div className="flex gap-1.5 ml-4">
          <button
            onClick={handleNudge}
            className="px-2.5 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Nudge
          </button>
          <button
            onClick={handleDefer}
            className="px-2.5 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Defer
          </button>
          <button
            onClick={handleResolve}
            className="px-2.5 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Resolved ✓
          </button>
        </div>
      )}
      {isResolved && (
        <p className="text-[10px] text-emerald-500 ml-4">✓ Resolved</p>
      )}
    </div>
  )
}