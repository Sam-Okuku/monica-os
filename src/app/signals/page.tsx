'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SignalCard } from '@/components/signals/SignalCard'
import { LearnPatternPrompt } from '@/components/signals/LearnPatternPrompt'

export default function SignalsPage() {
  const today = new Date().toISOString().split('T')[0]

  const allSignals = useLiveQuery(
    () => db.executive_signals.toArray(),
    []
  ) ?? []

  const pending = allSignals
    .filter(s => s.status === 'pending')
    .sort((a, b) => {
      if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1
      if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1
      return b.confidence - a.confidence
    })

  const acceptedToday = allSignals.filter(
    s => s.status === 'accepted' && s.acceptedAt?.startsWith(today)
  )

  const dismissedToday = allSignals.filter(
    s => s.status === 'dismissed' && s.dismissedAt?.startsWith(today)
  )

  return (
    <div className="flex min-h-screen" style={{ background: '#F0EFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">

        <div className="bg-white px-6 py-5" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
          <h1 className="monica-page-title">Executive Signals</h1>
          <p className="monica-page-sub">
            {pending.length} pending
            {acceptedToday.length > 0 && ` · ${acceptedToday.length} handled today`}
            {dismissedToday.length > 0 && ` · ${dismissedToday.length} dismissed`}
          </p>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full">

          <LearnPatternPrompt />

          {pending.length === 0 ? (
            <div className="monica-card p-8 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"
                style={{ background: '#D4EDDA' }}
              >
                ✓
              </div>
              <p className="text-[15px] font-bold mb-1" style={{ color: '#1E1B4B' }}>
                All signals reviewed
              </p>
              <p className="text-[12px] font-medium" style={{ color: '#6B7280' }}>
                Nothing awaiting your attention right now.
              </p>

              {acceptedToday.length > 0 && (
                <div
                  className="mt-5 p-4 rounded-xl text-left"
                  style={{ background: '#F0FDF4', border: '0.5px solid #86EFAC' }}
                >
                  <p className="text-[11px] font-bold mb-2" style={{ color: '#1A7A3A' }}>
                    ★ Handled today
                  </p>
                  <p className="text-[12px] font-medium" style={{ color: '#374151' }}>
                    {acceptedToday.length} signal{acceptedToday.length > 1 ? 's' : ''} processed —
                    those items are now tracked in Monica OS.
                  </p>
                  <p className="text-[11px] italic mt-1" style={{ color: '#6B7280' }}>
                    You did not need to remember any of them.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {pending.map(s => (
                <SignalCard key={s.id} signal={s} onUpdate={() => {}} />
              ))}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}