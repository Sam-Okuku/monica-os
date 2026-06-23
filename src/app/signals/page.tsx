'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SignalCard } from '@/components/signals/SignalCard'

export default function SignalsPage() {
  const pending = useLiveQuery(
    () => db.executive_signals.where('status').equals('pending').reverse().sortBy('receivedAt'),
    []
  ) ?? []

  const today = new Date().toISOString().split('T')[0]
  const acceptedToday = useLiveQuery(
    () => db.executive_signals.where('acceptedAt').startsWith(today).toArray(),
    []
  ) ?? []

  return (
    <div className="flex min-h-screen" style={{ background: '#F0EFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <div className="bg-white px-6 py-5" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
          <h1 className="monica-page-title">Executive Signals</h1>
          <p className="monica-page-sub">
            {pending.length} pending · {acceptedToday.length} handled today
          </p>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full">
          {pending.length === 0 ? (
            <div className="monica-card p-8 text-center">
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
                Nothing awaiting your attention right now.
              </p>
            </div>
          ) : (
            pending.map(s => (
              <SignalCard key={s.id} signal={s} onUpdate={() => {}} />
            ))
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}