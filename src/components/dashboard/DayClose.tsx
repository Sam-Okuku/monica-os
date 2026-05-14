'use client'

import { useState } from 'react'
import { db } from '@/lib/db'
import { todayDate } from '@/lib/utils'

interface DayCloseProps {
  doneTodayCount: number
  pendingCount: number
  onClose: () => void
}

export function DayClose({ doneTodayCount, pendingCount, onClose }: DayCloseProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const wins = [
    doneTodayCount > 0 ? `${doneTodayCount} task${doneTodayCount > 1 ? 's' : ''} completed` : null,
    `Follow-up radar monitored`,
    `Day organised and tracked`,
  ].filter(Boolean)

  const hour = new Date().getHours()
  const affirmation = hour < 17
    ? 'The afternoon is still yours.'
    : 'Today was handled. Tomorrow is ready.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-sm mx-4 mb-6 sm:mb-0 bg-white rounded-2xl border border-gray-100 shadow-sm slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {step === 1 && (
          <div className="p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#F0EFFE' }}
            >
              <span className="text-[#6C63B6]">★</span>
            </div>
            <p className="text-[10px] font-medium text-gray-400 tracking-[0.08em] uppercase mb-1">
              Invisible wins today
            </p>
            <p className="text-[15px] font-medium text-gray-800 mb-4" style={{ letterSpacing: '-0.01em' }}>
              Here is what you handled
            </p>
            <div className="space-y-2 mb-6">
              {wins.map((w, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                      <path d="M1 2.5L2.5 4L6 1" stroke="#1D9E75" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-[12px] text-gray-600">{w}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium text-white transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ background: '#FEF3E2' }}
            >
              <span className="text-[#D4860A] text-sm">◻</span>
            </div>
            <p className="text-[10px] font-medium text-gray-400 tracking-[0.08em] uppercase mb-1">
              Still open
            </p>
            <p className="text-[15px] font-medium text-gray-800 mb-2" style={{ letterSpacing: '-0.01em' }}>
              {pendingCount > 0 ? `${pendingCount} item${pendingCount > 1 ? 's' : ''} carry forward` : 'Everything handled'}
            </p>
            <p className="text-[12px] text-gray-400 leading-relaxed mb-6">
              {pendingCount > 0
                ? 'These will be waiting for you tomorrow morning, prioritised and ready.'
                : 'Remarkable. The board is completely clear.'}
            </p>
            <button
              onClick={() => setStep(3)}
              className="w-full py-2.5 rounded-xl text-[13px] font-medium text-white transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              Close the day →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#E4F5EE' }}
            >
              <span className="text-emerald-500 text-lg">✓</span>
            </div>
            <p className="text-[16px] font-medium text-gray-800 mb-2" style={{ letterSpacing: '-0.01em' }}>
              Day closed
            </p>
            <p className="text-[12px] text-gray-400 leading-relaxed mb-6 max-w-[220px] mx-auto">
              {affirmation}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}