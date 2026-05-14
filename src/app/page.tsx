'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, seedInitialData } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { ReadinessScore } from '@/components/dashboard/ReadinessScore'
import { StreakRow } from '@/components/dashboard/StreakRow'
import { DayClose } from '@/components/dashboard/DayClose'
import { TaskItem } from '@/components/tasks/TaskItem'
import { FollowUpItem } from '@/components/followups/FollowUpItem'
import { EventItem } from '@/components/calendar/EventItem'
import { QuickCapture } from '@/components/capture/QuickCapture'
import { AddTaskModal } from '@/components/tasks/AddTaskModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { InstallPrompt } from '@/components/shared/InstallPrompt'
import { getDayForecast, todayDate } from '@/lib/utils'

export default function Dashboard() {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [dayCloseOpen, setDayCloseOpen] = useState(false)
  const [calmMode, setCalmMode] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  useEffect(() => { seedInitialData() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCaptureOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pendingTasks = useLiveQuery(
    () => db.tasks.where('status').equals('pending').toArray(), [refresh]
  ) ?? []

  const doneTasks = useLiveQuery(async () => {
    const today = todayDate()
    const all = await db.tasks.where('status').equals('done').toArray()
    return all.filter(t => t.completed_at?.startsWith(today))
  }, [refresh]) ?? []

  const followUps = useLiveQuery(
    () => db.follow_ups.where('status').anyOf(['waiting', 'nudged']).toArray(), [refresh]
  ) ?? []

  const todaysEvents = useLiveQuery(async () => {
    const today = todayDate()
    const all = await db.events.toArray()
    return all
      .filter(e => e.starts_at.startsWith(today))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [refresh]) ?? []

  const rawCaptures = useLiveQuery(
    () => db.captures.where('status').equals('raw').toArray(), [refresh]
  ) ?? []

  const bossTasks = pendingTasks.filter(t => t.is_boss_priority)

  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const p: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
    if (a.is_boss_priority !== b.is_boss_priority) return a.is_boss_priority ? -1 : 1
    return (p[a.priority] ?? 2) - (p[b.priority] ?? 2)
  })

  const sortedFollowUps = [...followUps].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  )

  const forecast = getDayForecast(pendingTasks.length, followUps.length)

  const invisibleWin = doneTasks.length > 0
    ? `You completed ${doneTasks.length} task${doneTasks.length > 1 ? 's' : ''} today.`
    : todaysEvents.filter(e => e.prep_needed && e.brief_sent).length > 0
    ? 'All prepped meetings are briefed.'
    : null

  return (
    <div
      className={`flex min-h-screen transition-all duration-700 ${calmMode ? 'saturate-[0.4] brightness-[1.03]' : ''}`}
      style={{ background: '#F7F6F3' }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen pb-20 lg:pb-0">
        <TopBar
          onCaptureOpen={() => setCaptureOpen(true)}
          onCalmMode={() => setCalmMode(m => !m)}
          calmMode={calmMode}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-5xl mx-auto w-full">

          {invisibleWin && !calmMode && (
            <div
              className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 fade-in"
              style={{ background: '#E4F5EE', border: '0.5px solid #9FE1CB' }}
            >
              <span style={{ color: '#1D9E75', fontSize: '14px' }}>★</span>
              <p className="text-[12px] leading-relaxed" style={{ color: '#085041' }}>
                {invisibleWin}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <ReadinessScore />
            </div>
            <div
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
            >
              <div className="w-full">
                <p className="monica-label">Day forecast</p>
                <p className="text-[14px] font-medium mb-2" style={{ color: '#1C1B1A', letterSpacing: '-0.01em' }}>
                  {forecast.label}
                </p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F2F0EB' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${forecast.load}%`,
                      background: forecast.load < 50 ? '#1D9E75' : forecast.load < 75 ? '#D4860A' : '#C94F2C'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head flex items-center justify-between">
                <div>
                  <p className="monica-label">Today's priorities</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-500">{pendingTasks.length} pending</span>
                    {doneTasks.length > 0 && (
                      <span className="text-[12px]" style={{ color: '#1D9E75' }}>
                        · {doneTasks.length} done
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setAddTaskOpen(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-light transition-all hover:scale-110 active:scale-95"
                  style={{ background: '#F0EFFE', color: '#6C63B6' }}
                >
                  +
                </button>
              </div>
              <div className="px-3 py-1 max-h-80 overflow-y-auto">
                {sortedTasks.length === 0 && doneTasks.length === 0 ? (
                  <EmptyState icon="✓" title="All clear" description="No pending tasks today" />
                ) : (
                  <>
                    {sortedTasks.slice(0, 7).map(task => (
                      <TaskItem key={task.id} task={task} onUpdate={forceRefresh} />
                    ))}
                    {doneTasks.slice(0, 2).map(task => (
                      <TaskItem key={task.id} task={task} onUpdate={forceRefresh} />
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Follow-up radar</p>
                <p className="text-[12px] text-gray-500">
                  {sortedFollowUps.length} awaiting response
                </p>
              </div>
              <div className="px-4 py-1 max-h-80 overflow-y-auto">
                {sortedFollowUps.length === 0 ? (
                  <EmptyState icon="◎" title="Radar clear" description="No pending follow-ups" />
                ) : (
                  sortedFollowUps.map(f => (
                    <FollowUpItem key={f.id} followUp={f} onUpdate={forceRefresh} />
                  ))
                )}
              </div>
            </div>

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Today's agenda</p>
                <p className="text-[12px] text-gray-500">
                  {todaysEvents.filter(e => !e.is_shadow).length} meetings
                </p>
              </div>
              <div className="px-4 py-3 max-h-80 overflow-y-auto">
                {todaysEvents.length === 0 ? (
                  <EmptyState icon="◻" title="No events today" />
                ) : (
                  todaysEvents.map(event => (
                    <EventItem key={event.id} event={event} onUpdate={forceRefresh} />
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <StreakRow />
            </div>

            {rawCaptures.length > 0 && (
              <div className="monica-card overflow-hidden">
                <div className="monica-section-head">
                  <p className="monica-label">Inbox</p>
                  <p className="text-[12px] text-gray-500">{rawCaptures.length} unprocessed</p>
                </div>
                <div className="px-4 py-2 max-h-44 overflow-y-auto">
                  {rawCaptures.slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      className="flex items-start gap-2 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full mt-0.5 flex-shrink-0 font-medium"
                        style={{ background: '#F0EFFE', color: '#6C63B6' }}
                      >
                        {c.auto_tag}
                      </span>
                      <p className="text-[12px] text-gray-600 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div
            className="mt-4 flex items-center justify-between px-5 py-3.5 rounded-xl"
            style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
          >
            <p className="text-[12px] italic" style={{ color: '#A8A6A0' }}>
              {doneTasks.length === 0
                ? 'Your day is set. Start with the starred priorities.'
                : `Today ran well. ${doneTasks.length} thing${doneTasks.length > 1 ? 's' : ''} handled.`}
            </p>
            <button
              onClick={() => setDayCloseOpen(true)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: '#F0EFFE', color: '#6C63B6' }}
            >
              Close day →
            </button>
          </div>

        </main>
      </div>

      <BottomNav />
      <QuickCapture isOpen={captureOpen} onClose={() => setCaptureOpen(false)} />
      <AddTaskModal isOpen={addTaskOpen} onClose={() => setAddTaskOpen(false)} onAdded={forceRefresh} />
      <InstallPrompt />
      {dayCloseOpen && (
        <DayClose
          doneTodayCount={doneTasks.length}
          pendingCount={pendingTasks.length}
          onClose={() => setDayCloseOpen(false)}
        />
      )}
    </div>
  )
}