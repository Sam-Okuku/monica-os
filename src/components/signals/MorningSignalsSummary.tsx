'use client'

import { useState } from 'react'
import { ExecutiveSignal } from '@/lib/signals/types'
import { SignalCard } from './SignalCard'
import { SignalImpactBadge } from './SignalImpactBadge'

interface Props {
  signals: ExecutiveSignal[]
  onSignalHandled: () => void
}

export function MorningSignalsSummary({ signals, onSignalHandled }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [activeSignal, setActiveSignal] = useState<ExecutiveSignal | null>(null)

  if (signals.length === 0) return null

  const risks = signals.filter(s => s.riskLevel === 'high' || s.conflictDetail)
  const calendar = signals.filter(s => s.suggestedDestination === 'calendar')
  const tasks = signals.filter(s => s.suggestedDestination === 'task')
  const rest = signals.filter(
    s => s.suggestedDestination !== 'calendar' && s.suggestedDestination !== 'task'
  )
  const ordered = [...risks, ...calendar, ...tasks, ...rest].filter(
    (s, i, arr) => arr.findIndex(x => x.id === s.id) === i
  )

  if (activeSignal) {
    return (
      <div>
        <button
          onClick={() => setActiveSignal(null)}
          className="flex items-center gap-1.5 mb-3 text-[11px] font-bold transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← Back to signals
        </button>
        <SignalCard
          signal={activeSignal}
          onUpdate={() => { setActiveSignal(null); onSignalHandled() }}
        />
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(124,58,237,0.12)', border: '0.5px solid rgba(124,58,237,0.25)' }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: '#7C3AED' }}
          >
            {signals.length}
          </div>
          <span className="text-[12px] font-bold" style={{ color: '#C4B5FD' }}>
            Executive Signal{signals.length > 1 ? 's' : ''} awaiting review
          </span>
        </div>
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 space-y-2.5 border-t"
          style={{ borderColor: 'rgba(124,58,237,0.2)' }}
        >
          <div className="pt-3" />
          {ordered.map(signal => (
            <button
              key={signal.id}
              onClick={() => setActiveSignal(signal)}
              className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-left transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  {(signal.riskLevel === 'high' || signal.conflictDetail) && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: '#F48FB1', color: '#1E1B4B' }}
                    >
                      RISK
                    </span>
                  )}
                  <p className="text-[12px] font-semibold text-white truncate">{signal.subject}</p>
                </div>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {signal.senderName}
                </p>
              </div>
              <SignalImpactBadge destination={signal.suggestedDestination} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}