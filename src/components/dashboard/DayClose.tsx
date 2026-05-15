'use client'

import { useState } from 'react'

interface DayCloseProps {
  doneTodayCount: number
  pendingCount: number
  onClose: () => void
}

export function DayClose({ doneTodayCount, pendingCount, onClose }: DayCloseProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const wins = [
    doneTodayCount > 0 ? `${doneTodayCount} task${doneTodayCount > 1 ? 's' : ''} completed today` : null,
    'Follow-up radar monitored',
    'Operational tracker updated',
  ].filter(Boolean) as string[]

  const hour = new Date().getHours()
  const affirmation = hour < 17 ? 'The afternoon is still yours.' : 'Today was handled. Tomorrow is ready.'

  const btnStyle = { background: '#7C3AED', color: '#FFFFFF' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(30,27,75,0.35)' }} />
      <div
        className="relative w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-2xl overflow-hidden slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        onClick={e => e.stopPropagation()}
      >
        {step === 1 && (
          <div className="p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#D4EDDA' }}
            >
              <span style={{ color: '#1A7A3A', fontSize: '16px' }}>★</span>
            </div>
            <p className="text-[10px] font-bold tracking-[0.09em] uppercase mb-1" style={{ color: '#7C3AED' }}>
              Invisible wins today
            </p>
            <p className="text-[16px] font-bold mb-4" style={{ color: '#1E1B4B', letterSpacing: '-0.02em' }}>
              Here is what you handled
            </p>
            <div className="space-y-2 mb-6">
              {wins.map((w, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#D4EDDA' }}
                  >
                    <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                      <path d="M1 2.5L2.5 4L6 1" stroke="#1A7A3A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[12px] font-medium" style={{ color: '#374151' }}>{w}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              style={btnStyle}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#FEF3C7' }}
            >
              <span style={{ color: '#92400E', fontSize: '14px' }}>◻</span>
            </div>
            <p className="text-[10px] font-bold tracking-[0.09em] uppercase mb-1" style={{ color: '#7C3AED' }}>
              Still open
            </p>
            <p className="text-[16px] font-bold mb-2" style={{ color: '#1E1B4B', letterSpacing: '-0.02em' }}>
              {pendingCount > 0
                ? `${pendingCount} item${pendingCount > 1 ? 's' : ''} carry forward`
                : 'Everything handled'}
            </p>
            <p className="text-[12px] font-medium mb-6 leading-relaxed" style={{ color: '#4B5563' }}>
              {pendingCount > 0
                ? 'These will be waiting tomorrow, prioritised and ready.'
                : 'Remarkable. The board is completely clear.'}
            </p>
            <button
              onClick={() => setStep(3)}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              style={btnStyle}
            >
              Close the day →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#D4EDDA' }}
            >
              <span style={{ color: '#4CAF50', fontSize: '20px' }}>✓</span>
            </div>
            <p className="text-[17px] font-bold mb-2" style={{ color: '#1E1B4B', letterSpacing: '-0.02em' }}>
              Day closed
            </p>
            <p className="text-[12px] font-medium leading-relaxed mb-6 max-w-[200px] mx-auto" style={{ color: '#4B5563' }}>
              {affirmation}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              style={btnStyle}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}