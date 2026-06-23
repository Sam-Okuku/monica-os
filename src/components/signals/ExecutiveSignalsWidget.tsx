'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { ExecutiveSignal } from '@/lib/signals/types'
import { SignalReviewModal } from './SignalReviewModal'

interface SignalStats {
  pending: number
  riskCount: number
  patternsLearned: number
  handledToday: number
  topSignals: ExecutiveSignal[]
}

export function ExecutiveSignalsWidget() {
  const [stats, setStats] = useState<SignalStats | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]

      const [all, patternsCount] = await Promise.all([
        db.executive_signals.toArray(),
        db.signal_learning_patterns.count(),
      ])

      const pending = all.filter(s => s.status === 'pending')
      const riskCount = pending.filter(
        s => s.riskLevel === 'high' || Boolean(s.conflictDetail)
      ).length
      const handledToday = all.filter(
        s => s.status === 'accepted' && s.acceptedAt?.startsWith(today)
      ).length

      const topSignals: ExecutiveSignal[] = [...pending]
        .sort((a, b) => {
          if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1
          if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1
          return b.confidence - a.confidence
        })
        .slice(0, 2)

      setStats({
        pending: pending.length,
        riskCount,
        patternsLearned: patternsCount,
        handledToday,
        topSignals,
      })
    }

    load()
  }, [refresh])

  if (!stats) return null
  if (stats.pending === 0 && stats.handledToday === 0) return null

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #232057 0%, #1E1B4B 55%, #18153D 100%)',
          boxShadow: '0 20px 40px -20px rgba(30,27,75,0.6)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Executive Signals
            </p>
            <p
              className="text-[22px] font-black text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              {stats.pending > 0 ? `${stats.pending} awaiting review` : 'All reviewed ✓'}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}
          >
            Review all →
          </button>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-3 gap-0 mx-5 mb-4 rounded-xl overflow-hidden"
          style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          {[
            {
              label: 'Pending',
              value: stats.pending,
              color: stats.pending > 0 ? '#FDD835' : '#4CAF50',
            },
            {
              label: 'Risks',
              value: stats.riskCount,
              color: stats.riskCount > 0 ? '#F48FB1' : 'rgba(255,255,255,0.3)',
            },
            {
              label: 'Patterns',
              value: stats.patternsLearned,
              color: '#CE93D8',
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="px-4 py-3 text-center"
              style={{
                borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <p
                className="text-[20px] font-black"
                style={{ color: stat.color, letterSpacing: '-0.03em' }}
              >
                {stat.value}
              </p>
              <p
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Top signals preview */}
        {stats.topSignals.length > 0 && (
          <div
            className="mx-5 mb-5 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            {stats.topSignals.map((signal, i) => (
              <div
                key={signal.id}
                className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all"
                style={{
                  borderBottom:
                    i < stats.topSignals.length - 1
                      ? '0.5px solid rgba(255,255,255,0.06)'
                      : 'none',
                }}
                onClick={() => setModalOpen(true)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {(signal.riskLevel === 'high' || signal.conflictDetail) && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: '#F48FB1', color: '#1E1B4B' }}
                    >
                      RISK
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {signal.subject}
                    </p>
                    <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {signal.senderName}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.3)', color: '#C4B5FD' }}
                >
                  {signal.suggestedDestination}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Handled today */}
        {stats.handledToday > 0 && (
          <div
            className="mx-5 mb-5 px-4 py-2.5 rounded-xl flex items-center gap-2"
            style={{
              background: 'rgba(76,175,80,0.12)',
              border: '0.5px solid rgba(76,175,80,0.2)',
            }}
          >
            <span style={{ color: '#4CAF50', fontSize: '12px' }}>★</span>
            <p className="text-[11px] font-medium" style={{ color: '#86EFAC' }}>
              {stats.handledToday} signal{stats.handledToday > 1 ? 's' : ''} handled today — those items are now tracked.
            </p>
          </div>
        )}
      </div>

      <SignalReviewModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setRefresh(r => r + 1)
        }}
      />
    </>
  )
}