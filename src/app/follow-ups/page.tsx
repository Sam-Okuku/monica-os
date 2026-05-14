'use client'

import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { FollowUpItem } from '@/components/followups/FollowUpItem'
import { EmptyState } from '@/components/shared/EmptyState'
import { createFollowUp } from '@/lib/db.queries'
import { nowISO, hoursAgo } from '@/lib/utils'

export default function FollowUpsPage() {
  const [showResolved, setShowResolved] = useState(false)
  const [adding, setAdding] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [form, setForm] = useState({
    contact_name: '', context: '', channel: 'email', expected_by: '', confidence: 3
  })
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  const followUps = useLiveQuery(async () => {
    if (showResolved) return db.follow_ups.orderBy('sent_at').reverse().toArray()
    return db.follow_ups.where('status').anyOf(['waiting', 'nudged']).toArray()
  }, [showResolved, refresh]) ?? []

  const sorted = [...followUps].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  )

  const dangerCount = followUps.filter(f => hoursAgo(f.sent_at) >= 36).length
  const warningCount = followUps.filter(f => {
    const h = hoursAgo(f.sent_at)
    return h >= 24 && h < 36
  }).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createFollowUp({ ...form, channel: form.channel as any, sent_at: nowISO(), status: 'waiting' })
    setForm({ contact_name: '', context: '', channel: 'email', expected_by: '', confidence: 3 })
    setAdding(false)
    forceRefresh()
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F6F3' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="monica-page-title">Follow-up radar</h1>
              <p className="monica-page-sub">
                {followUps.filter(f => f.status !== 'resolved').length} awaiting response
              </p>
            </div>
            <button
              onClick={() => setAdding(a => !a)}
              className="text-white text-[11px] font-medium px-4 py-2 rounded-full transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              + Track new
            </button>
          </div>

          {(dangerCount > 0 || warningCount > 0) && (
            <div className="flex gap-2 mb-3">
              {dangerCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: '#FDEEE9', color: '#C94F2C' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  {dangerCount} overdue
                </div>
              )}
              {warningCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: '#FEF3E2', color: '#D4860A' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  {warningCount} aging
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowResolved(s => !s)}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showResolved ? '← Active only' : 'Show resolved →'}
          </button>
        </div>

        {adding && (
          <div className="mx-4 mt-4 p-5 bg-white rounded-xl border border-gray-100 slide-up">
            <p className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">
              Track a follow-up
            </p>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                required
                value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                placeholder="Who are you waiting on?"
                className="w-full text-[13px] text-gray-700 border-b border-gray-100 pb-2 focus:border-purple-300 transition-colors placeholder-gray-300"
              />
              <input
                required
                value={form.context}
                onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
                placeholder="What are you waiting for?"
                className="w-full text-[13px] text-gray-700 border-b border-gray-100 pb-2 focus:border-purple-300 transition-colors placeholder-gray-300"
              />
              <div className="flex gap-3 pt-1">
                <select
                  value={form.channel}
                  onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  className="text-[12px] border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-500"
                >
                  {['email', 'whatsapp', 'call', 'verbal', 'other'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.expected_by}
                  onChange={e => setForm(f => ({ ...f, expected_by: e.target.value }))}
                  className="text-[12px] border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 text-white text-[12px] font-medium rounded-lg active:scale-95"
                  style={{ background: '#6C63B6' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-4 py-2 text-[12px] text-gray-400 bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full">
          <div className="monica-card overflow-hidden">
            {sorted.length === 0 ? (
              <EmptyState
                icon="◎"
                title="Radar clear"
                description="Nothing is awaiting a response right now"
              />
            ) : (
              <div className="px-4 py-1">
                {sorted.map(f => (
                  <FollowUpItem key={f.id} followUp={f} onUpdate={forceRefresh} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}