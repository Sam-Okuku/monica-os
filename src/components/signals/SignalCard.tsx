'use client'

import { useState } from 'react'
import { ExecutiveSignal, SignalDestination } from '@/lib/signals/types'
import { SignalConfidenceBadge } from './SignalConfidenceBadge'
import { SignalImpactBadge } from './SignalImpactBadge'
import { acceptSignal, dismissSignal } from '@/lib/signals/signalActions'

interface Props {
  signal: ExecutiveSignal
  onUpdate: () => void
  compact?: boolean
}

const DESTINATIONS: { key: SignalDestination; label: string }[] = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'task', label: 'Task' },
  { key: 'followup', label: 'Follow-up' },
  { key: 'tracker', label: 'Tracker' },
  { key: 'note', label: 'Note' },
  { key: 'skip', label: 'Skip' },
]

export function SignalCard({ signal, onUpdate, compact = false }: Props) {
  const [reassigning, setReassigning] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [loading, setLoading] = useState(false)
  const startTime = Date.now()

  const handleAccept = async (destination?: SignalDestination) => {
    setLoading(true)
    const dest = destination ?? signal.suggestedDestination
    await acceptSignal(signal, dest, Date.now() - startTime)
    onUpdate()
    setLoading(false)
  }

  const handleDismiss = async (learnSkip = false) => {
    setLoading(true)
    await dismissSignal(signal, learnSkip, Date.now() - startTime)
    onUpdate()
    setLoading(false)
    setDismissing(false)
  }

  if (compact) {
    return (
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b last:border-0 transition-all"
        style={{ borderColor: '#F3F4F6' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <SignalImpactBadge destination={signal.suggestedDestination} />
          <p className="text-[12px] font-medium truncate" style={{ color: '#1E1B4B' }}>
            {signal.subject}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleAccept()}
            disabled={loading}
            className="text-[10px] font-bold px-3 py-1.5 rounded-full text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: '#7C3AED' }}
          >
            Accept
          </button>
          <button
            onClick={() => handleDismiss(false)}
            disabled={loading}
            className="text-[10px] font-bold px-2 py-1.5 rounded-full transition-all"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4 slide-up"
      style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{ background: '#1E1B4B', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {signal.senderName} · {new Date(signal.receivedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-[14px] font-bold text-white leading-tight" style={{ letterSpacing: '-0.01em' }}>
              {signal.subject}
            </p>
          </div>
          <SignalConfidenceBadge confidence={signal.confidence} />
        </div>
      </div>

      {/* Body excerpt */}
      {signal.bodyExcerpt && (
        <div className="px-5 py-3" style={{ background: '#FAFAFE', borderBottom: '0.5px solid #F3F4F6' }}>
          <p className="text-[12px] leading-relaxed" style={{ color: '#6B7280' }}>
            "{signal.bodyExcerpt.slice(0, 180)}{signal.bodyExcerpt.length > 180 ? '…' : ''}"
          </p>
        </div>
      )}

      {/* Impact */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#7C3AED' }}>
            Suggested
          </p>
          <SignalImpactBadge destination={signal.suggestedDestination} />
        </div>

        {signal.impact.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {signal.impact.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[11px] mt-0.5 flex-shrink-0" style={{ color: '#4CAF50' }}>✓</span>
                <p className="text-[12px] font-medium" style={{ color: '#374151' }}>{item}</p>
              </div>
            ))}
            {signal.conflictDetail && (
              <div className="flex items-start gap-2">
                <span className="text-[11px] mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }}>⚠</span>
                <p className="text-[12px] font-medium" style={{ color: '#EF4444' }}>{signal.conflictDetail}</p>
              </div>
            )}
          </div>
        )}

        {/* Relief language */}
        <p className="text-[11px] italic mb-4" style={{ color: '#9CA3AF' }}>
          Once accepted, you will not need to remember this.
        </p>

        {/* Actions */}
        {reassigning ? (
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: '#7C3AED' }}>
              Route to:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {DESTINATIONS.filter(d => d.key !== signal.suggestedDestination).map(d => (
                <button
                  key={d.key}
                  onClick={() => handleAccept(d.key)}
                  disabled={loading}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all active:scale-95"
                  style={{ borderColor: '#E5E7EB', color: '#374151', background: '#F9FAFB' }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setReassigning(false)}
              className="text-[11px] text-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : dismissing ? (
          <div
            className="rounded-xl p-4"
            style={{ background: '#FEF3C7', border: '0.5px solid #FDE68A' }}
          >
            <p className="text-[12px] font-semibold mb-3" style={{ color: '#92400E' }}>
              Skip this signal from {signal.senderName}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDismiss(false)}
                disabled={loading}
                className="flex-1 py-2 text-[11px] font-bold rounded-xl transition-all active:scale-95"
                style={{ background: '#F3F4F6', color: '#374151' }}
              >
                Skip once
              </button>
              <button
                onClick={() => handleDismiss(true)}
                disabled={loading}
                className="flex-1 py-2 text-[11px] font-bold rounded-xl transition-all active:scale-95"
                style={{ background: '#1E1B4B', color: '#FFFFFF' }}
              >
                Always skip from {signal.senderName.split(' ')[0]}
              </button>
            </div>
            <button onClick={() => setDismissing(false)} className="mt-2 text-[11px] text-gray-400 block">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept()}
              disabled={loading}
              className="flex-1 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#7C3AED' }}
            >
              {loading ? 'Accepting…' : 'Accept →'}
            </button>
            <button
              onClick={() => setReassigning(true)}
              disabled={loading}
              className="px-4 py-2.5 text-[12px] font-bold rounded-xl transition-all"
              style={{ background: '#F3F4F6', color: '#374151' }}
            >
              Reassign
            </button>
            <button
              onClick={() => setDismissing(true)}
              disabled={loading}
              className="px-4 py-2.5 text-[12px] font-bold rounded-xl transition-all"
              style={{ background: '#FCE4EC', color: '#9C1B3E' }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}