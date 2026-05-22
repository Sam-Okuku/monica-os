'use client'

import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { EventItem } from '@/components/calendar/EventItem'
import { EmptyState } from '@/components/shared/EmptyState'
import { createEvent } from '@/lib/db.queries'
import { todayDate } from '@/lib/utils'

type TabType = 'today' | 'upcoming' | 'history'

export default function CalendarPage() {
  const [adding, setAdding] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [refresh, setRefresh] = useState(0)
  const [form, setForm] = useState({
    title: '',
    event_type: 'meeting',
    starts_at: '',
    ends_at: '',
    prep_needed: false,
    is_shadow: false,
    location: '',
  })
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  const todaysEvents = useLiveQuery(async () => {
    const today = todayDate()
    const all = await db.events.toArray()
    return all
      .filter(e =>
        e.starts_at.startsWith(today) &&
        e.lifecycle !== 'cancelled' &&
        e.lifecycle !== 'archived'
      )
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [refresh]) ?? []

  const upcomingEvents = useLiveQuery(async () => {
    const today = todayDate()
    const all = await db.events.toArray()
    return all
      .filter(e =>
        !e.starts_at.startsWith(today) &&
        new Date(e.starts_at) > new Date() &&
        e.lifecycle === 'active'
      )
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 10)
  }, [refresh]) ?? []

  const historyEvents = useLiveQuery(async () => {
    const all = await db.events.toArray()
    return all
      .filter(e =>
        e.lifecycle === 'completed' ||
        e.lifecycle === 'cancelled' ||
        e.lifecycle === 'archived'
      )
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
  }, [refresh]) ?? []

  const prepNeededCount = todaysEvents.filter(e => e.prep_needed && !e.brief_sent && e.lifecycle === 'active').length
  const briefedCount = todaysEvents.filter(e => e.prep_needed && e.brief_sent).length
  const completedToday = todaysEvents.filter(e => e.lifecycle === 'completed').length

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await createEvent({
      ...form,
      event_type: form.event_type as any,
      brief_sent: false,
      ends_at: form.ends_at || form.starts_at,
      lifecycle: 'active',
    })
    setForm({ title: '', event_type: 'meeting', starts_at: '', ends_at: '', prep_needed: false, is_shadow: false, location: '' })
    setAdding(false)
    forceRefresh()
  }

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'today', label: 'Today', count: todaysEvents.filter(e => e.lifecycle === 'active').length },
    { key: 'upcoming', label: 'Upcoming', count: upcomingEvents.length },
    { key: 'history', label: 'History', count: historyEvents.length },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#F0EFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">

        <div className="bg-white px-6 py-5" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="monica-page-title">Shadow agenda</h1>
              <p className="monica-page-sub">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <button
              onClick={() => setAdding(a => !a)}
              className="text-white text-[11px] font-bold px-4 py-2 rounded-full transition-all active:scale-95"
              style={{ background: '#7C3AED' }}
            >
              + Add event
            </button>
          </div>

          <div className="flex items-center gap-4 mb-1">
            {(prepNeededCount > 0 || briefedCount > 0 || completedToday > 0) && (
              <div className="flex gap-2 flex-wrap mb-3">
                {prepNeededCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#FEF3C7', color: '#92400E' }}
                  >
                    ! {prepNeededCount} need{prepNeededCount === 1 ? 's' : ''} brief
                  </span>
                )}
                {briefedCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#D4EDDA', color: '#1A7A3A' }}
                  >
                    ✓ {briefedCount} briefed
                  </span>
                )}
                {completedToday > 0 && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#EDE9FE', color: '#4C1D95' }}
                  >
                    ✓ {completedToday} completed today
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-1.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-4 py-1.5 rounded-full text-[11px] font-bold transition-all"
                style={activeTab === tab.key
                  ? { background: '#1E1B4B', color: '#FFFFFF' }
                  : { background: '#F3F4F6', color: '#374151' }
                }
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 opacity-70">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {adding && (
          <div
            className="mx-4 mt-4 p-5 rounded-xl slide-up"
            style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
          >
            <p className="text-[11px] font-bold tracking-wider uppercase mb-4" style={{ color: '#7C3AED' }}>
              Add event
            </p>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title"
                className="w-full text-[13px] font-semibold border-b pb-2 transition-colors"
                style={{ color: '#1E1B4B', borderColor: '#E5E7EB' }}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="text-[11px] border rounded-lg px-2.5 py-1.5"
                  style={{ color: '#374151', borderColor: '#E5E7EB' }}
                />
                <input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                  className="text-[11px] border rounded-lg px-2.5 py-1.5"
                  style={{ color: '#374151', borderColor: '#E5E7EB' }}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <select
                  value={form.event_type}
                  onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="text-[11px] border rounded-lg px-2.5 py-1.5"
                  style={{ color: '#374151', borderColor: '#E5E7EB' }}
                >
                  {['meeting', 'buffer', 'deadline', 'prep', 'shadow'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Location (optional)"
                  className="text-[11px] border rounded-lg px-2.5 py-1.5 w-40"
                  style={{ color: '#374151', borderColor: '#E5E7EB' }}
                />
                <label className="flex items-center gap-1.5 text-[11px] font-medium cursor-pointer" style={{ color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={form.prep_needed}
                    onChange={e => setForm(f => ({ ...f, prep_needed: e.target.checked }))}
                  />
                  Prep needed
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-medium cursor-pointer" style={{ color: '#374151' }}>
                  <input
                    type="checkbox"
                    checked={form.is_shadow}
                    onChange={e => setForm(f => ({ ...f, is_shadow: e.target.checked }))}
                  />
                  Buffer
                </label>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 text-white text-[12px] font-bold rounded-xl active:scale-95"
                  style={{ background: '#7C3AED' }}
                >
                  Add event
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-5 py-2 text-[12px] font-medium rounded-xl"
                  style={{ background: '#F3F4F6', color: '#374151' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-5 max-w-3xl mx-auto w-full space-y-4">

          {activeTab === 'today' && (
            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Today</p>
                <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                  {todaysEvents.filter(e => e.lifecycle === 'active' && !e.is_shadow).length} active
                  {completedToday > 0 && ` · ${completedToday} done`}
                </p>
              </div>
              <div className="p-4">
                {todaysEvents.length === 0 ? (
                  <EmptyState
                    icon="◻"
                    title="No events today"
                    description="Add events to build your agenda"
                    action={{ label: 'Add first event', onClick: () => setAdding(true) }}
                  />
                ) : (
                  todaysEvents.map(e => (
                    <EventItem key={e.id} event={e} onUpdate={forceRefresh} />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Upcoming</p>
                <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                  {upcomingEvents.length} scheduled
                </p>
              </div>
              <div className="p-4">
                {upcomingEvents.length === 0 ? (
                  <EmptyState
                    icon="◻"
                    title="Nothing upcoming"
                    description="Future events will appear here"
                    action={{ label: 'Add event', onClick: () => setAdding(true) }}
                  />
                ) : (
                  upcomingEvents.map(e => (
                    <EventItem key={e.id} event={e} onUpdate={forceRefresh} />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">History</p>
                <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                  Completed · cancelled · archived
                </p>
              </div>
              <div className="p-4">
                {historyEvents.length === 0 ? (
                  <EmptyState
                    icon="◫"
                    title="No history yet"
                    description="Completed and cancelled events appear here"
                  />
                ) : (
                  historyEvents.map(e => (
                    <EventItem key={e.id} event={e} onUpdate={forceRefresh} />
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>
      <BottomNav />
    </div>
  )
}