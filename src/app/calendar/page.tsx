'use client'

import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { EmptyState } from '@/components/shared/EmptyState'
import { createEvent, updateEvent } from '@/lib/db.queries'
import { todayDate, formatTime, cn } from '@/lib/utils'
import { CalendarEvent } from '@/lib/db'

function getDuration(starts: string, ends: string): number {
  try {
    return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000)
  } catch { return 60 }
}

const EVENT_STYLES: Record<string, { border: string; bg: string; titleColor: string }> = {
  meeting: { border: '#6C63B6', bg: '#F8F7FF', titleColor: '#4A4390' },
  buffer: { border: '#ECEAE5', bg: '#FAFAF9', titleColor: '#A8A6A0' },
  deadline: { border: '#C94F2C', bg: '#FEF5F2', titleColor: '#C94F2C' },
  shadow: { border: '#F2F0EB', bg: '#FAFAF9', titleColor: '#C8C6C0' },
  prep: { border: '#D4860A', bg: '#FFFBF2', titleColor: '#D4860A' },
}

function TimelineEvent({ event, onUpdate }: { event: CalendarEvent; onUpdate: () => void }) {
  const style = EVENT_STYLES[event.event_type] ?? EVENT_STYLES.meeting
  const duration = getDuration(event.starts_at, event.ends_at)
  const isBuffer = event.is_shadow || event.event_type === 'buffer'

  const toggleBrief = async () => {
    await updateEvent(event.id!, { brief_sent: !event.brief_sent })
    onUpdate()
  }

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center" style={{ width: '52px', flexShrink: 0 }}>
        <p className="text-[11px] font-medium text-gray-400 text-right w-full">{formatTime(event.starts_at)}</p>
        {duration > 0 && (
          <p className="text-[9px] text-gray-300 text-right w-full mt-0.5">{duration}m</p>
        )}
      </div>

      <div
        className="flex-1 mb-3 rounded-xl px-4 py-3 border-l-2 transition-all"
        style={{
          borderLeftColor: style.border,
          background: style.bg,
          opacity: isBuffer ? 0.5 : 1,
        }}
      >
        <p
          className="text-[13px] font-medium mb-1"
          style={{ color: style.titleColor, letterSpacing: '-0.005em' }}
        >
          {event.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {event.is_shadow ? (
            <span className="text-[9px] italic" style={{ color: '#C8C6C0' }}>buffer window</span>
          ) : (
            <>
              {event.prep_needed && (
                <button
                  onClick={toggleBrief}
                  className={cn(
                    'text-[9px] font-medium px-2 py-0.5 rounded-full transition-colors',
                    event.brief_sent
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  )}
                >
                  {event.brief_sent ? '✓ Briefed' : '! Brief needed'}
                </button>
              )}
              {event.location && (
                <span className="text-[9px] text-gray-400">◎ {event.location}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [adding, setAdding] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [form, setForm] = useState({
    title: '', event_type: 'meeting', starts_at: '',
    ends_at: '', prep_needed: false, is_shadow: false, location: ''
  })
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  const todaysEvents = useLiveQuery(async () => {
    const today = todayDate()
    const all = await db.events.toArray()
    return all
      .filter(e => e.starts_at.startsWith(today))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [refresh]) ?? []

  const upcomingEvents = useLiveQuery(async () => {
    const today = todayDate()
    const all = await db.events.toArray()
    return all
      .filter(e => !e.starts_at.startsWith(today) && new Date(e.starts_at) > new Date())
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 8)
  }, [refresh]) ?? []

  const prepNeededCount = todaysEvents.filter(e => e.prep_needed && !e.brief_sent).length
  const briefedCount = todaysEvents.filter(e => e.prep_needed && e.brief_sent).length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createEvent({
      ...form,
      event_type: form.event_type as any,
      brief_sent: false,
      ends_at: form.ends_at || form.starts_at,
    })
    setForm({ title: '', event_type: 'meeting', starts_at: '', ends_at: '', prep_needed: false, is_shadow: false, location: '' })
    setAdding(false)
    forceRefresh()
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F0EFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="monica-page-title">Shadow agenda</h1>
              <p className="monica-page-sub">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button
              onClick={() => setAdding(a => !a)}
              className="text-white text-[11px] font-medium px-4 py-2 rounded-full transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              + Add event
            </button>
          </div>

          {(prepNeededCount > 0 || briefedCount > 0) && (
            <div className="flex gap-2">
              {prepNeededCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: '#FEF3E2', color: '#D4860A' }}
                >
                  ! {prepNeededCount} need{prepNeededCount === 1 ? 's' : ''} brief
                </div>
              )}
              {briefedCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: '#E4F5EE', color: '#1D9E75' }}
                >
                  ✓ {briefedCount} briefed
                </div>
              )}
            </div>
          )}
        </div>

        {adding && (
          <div className="mx-4 mt-4 p-5 bg-white rounded-xl border border-gray-100 slide-up">
            <p className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">Add event</p>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title"
                className="w-full text-[13px] text-gray-700 border-b border-gray-100 pb-2 focus:border-purple-200 transition-colors placeholder-gray-300"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="text-[11px] border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-500"
                />
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="text-[11px] border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-500"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <select
                  value={form.event_type}
                  onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="text-[11px] border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-500"
                >
                  {['meeting', 'buffer', 'deadline', 'prep', 'shadow'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.prep_needed}
                    onChange={e => setForm(f => ({ ...f, prep_needed: e.target.checked }))}
                  />
                  Prep needed
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_shadow}
                    onChange={e => setForm(f => ({ ...f, is_shadow: e.target.checked }))}
                  />
                  Buffer/shadow
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 text-white text-[12px] font-medium rounded-lg active:scale-95"
                  style={{ background: '#6C63B6' }}
                >
                  Add
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

        <main className="flex-1 p-4 lg:p-6 max-w-3xl mx-auto w-full space-y-4">

          <div className="monica-card overflow-hidden">
            <div className="monica-section-head">
              <p className="monica-label">Today</p>
              <p className="text-[12px] text-gray-500">
                {todaysEvents.filter(e => !e.is_shadow).length} meetings scheduled
              </p>
            </div>
            <div className="p-4 pt-5">
              {todaysEvents.length === 0 ? (
                <EmptyState
                  icon="◻"
                  title="No events today"
                  description="Add events to build your shadow agenda"
                  action={{ label: 'Add first event', onClick: () => setAdding(true) }}
                />
              ) : (
                <div>
                  {todaysEvents.map(event => (
                    <TimelineEvent key={event.id} event={event} onUpdate={forceRefresh} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {upcomingEvents.length > 0 && (
            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Upcoming</p>
              </div>
              <div className="p-4 pt-5">
                {upcomingEvents.map(event => (
                  <TimelineEvent key={event.id} event={event} onUpdate={forceRefresh} />
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
      <BottomNav />
    </div>
  )
}