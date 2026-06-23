'use client'

import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { SignalCard } from './SignalCard'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function SignalReviewModal({ isOpen, onClose }: Props) {
  const signals = useLiveQuery(
    () => db.executive_signals.where('status').equals('pending').reverse().sortBy('receivedAt'),
    []
  ) ?? []

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(30,27,75,0.5)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl overflow-hidden slide-up"
        style={{ background: '#F0EFFF', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ background: '#1E1B4B' }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Executive Signals
            </p>
            <p className="text-[16px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {signals.length} awaiting review
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none transition-opacity hover:opacity-60"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {signals.length === 0 ? (
            <div className="py-12 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"
                style={{ background: '#D4EDDA' }}
              >
                ✓
              </div>
              <p className="text-[14px] font-bold mb-1" style={{ color: '#1E1B4B' }}>
                All signals reviewed
              </p>
              <p className="text-[12px] font-medium" style={{ color: '#6B7280' }}>
                Nothing awaiting your attention.
              </p>
            </div>
          ) : (
            signals.map(s => (
              <SignalCard key={s.id} signal={s} onUpdate={() => {}} />
            ))
          )}
        </div>

        {signals.length > 0 && (
          <div
            className="px-6 py-4 flex-shrink-0"
            style={{ borderTop: '0.5px solid #E5E7EB', background: '#FFFFFF' }}
          >
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              style={{ background: '#1E1B4B', color: '#FFFFFF' }}
            >
              Review later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}