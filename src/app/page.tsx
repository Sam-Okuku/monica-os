'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { seedInitialData } from '@/lib/seed'
import {
  getTodaysTasks,
  getTasksCompletedToday,
  getActiveFollowUps,
  getTodaysEvents,
  getRawCaptures,
} from '@/lib/db.queries'
import {
  countDangerFollowUps,
  isActiveEvent,
  isPastActiveEvent,
} from '@/lib/domain'
import { useNow } from '@/hooks/useNow'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { ReadinessScore } from '@/components/dashboard/ReadinessScore'
import { TrackerPulse } from '@/components/dashboard/TrackerPulse'
import { OperationalRhythm } from '@/components/dashboard/OperationalRhythm'
import { ExecutiveSignalsWidget } from '@/components/signals/ExecutiveSignalsWidget'
import { LearnPatternPrompt } from '@/components/signals/LearnPatternPrompt'
import { TaskItem } from '@/components/tasks/TaskItem'
import { FollowUpItem } from '@/components/followups/FollowUpItem'
import { EventItem } from '@/components/calendar/EventItem'
import { QuickCapture } from '@/components/capture/QuickCapture'
import { AddTaskModal } from '@/components/tasks/AddTaskModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { InstallPrompt } from '@/components/shared/InstallPrompt'
import { getDayForecast } from '@/lib/utils'

function getDayMode(): 'opening' | 'active' | 'closing' {
  const h = new Date().getHours()
  if (h >= 6 && h < 10) return 'opening'
  if (h >= 16) return 'closing'
  return 'active'
}

function getDayModeLabel(mode: 'opening' | 'active' | 'closing'): string {
  if (mode === 'opening') return 'Morning briefing'
  if (mode === 'closing') return 'Day closing summary'
  return 'Active operations'
}

export default function Dashboard() {
  const [captureOpen, setCaptureOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [calmMode, setCalmMode] = useState(false)

  const dayMode = getDayMode()
  const now = useNow()

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

  const pendingTasks = useLiveQuery(() => getTodaysTasks()) ?? []
  const doneTasks = useLiveQuery(() => getTasksCompletedToday()) ?? []
  const followUps = useLiveQuery(() => getActiveFollowUps()) ?? []
  const todaysEvents = useLiveQuery(() => getTodaysEvents()) ?? []
  const rawCaptures = useLiveQuery(() => getRawCaptures()) ?? []

  const activeEvents = useMemo(
    () => todaysEvents.filter(e => isActiveEvent(e, now)),
    [todaysEvents, now]
  )

  const completedTodayEvents = useMemo(
    () => todaysEvents.filter(e => e.lifecycle === 'completed'),
    [todaysEvents]
  )

  const pastActiveEvents = useMemo(
    () => todaysEvents.filter(e => isPastActiveEvent(e, now)),
    [todaysEvents, now]
  )

  const dangerFollowUps = countDangerFollowUps(followUps, now)
  const unbriefedMeetings = activeEvents.filter(e => e.prep_needed && !e.brief_sent).length
  const forecast = getDayForecast(pendingTasks.length, followUps.length)

  const invisibleWin = doneTasks.length > 0
    ? `${doneTasks.length} task${doneTasks.length > 1 ? 's' : ''} completed today.`
    : activeEvents.filter(e => e.prep_needed && e.brief_sent).length > 0
    ? 'All prepped meetings are briefed.'
    : null

  const modeColor = dayMode === 'opening' ? '#FDD835' : dayMode === 'closing' ? '#7C3AED' : '#4CAF50'
  const modeBg = dayMode === 'opening' ? '#FFF9C4' : dayMode === 'closing' ? '#EDE9FE' : '#D4EDDA'
  const modeText = dayMode === 'opening' ? '#7A6500' : dayMode === 'closing' ? '#4C1D95' : '#1A7A3A'

  return (
    <div
      className={`flex min-h-screen transition-all duration-700 ${calmMode ? 'saturate-[0.3]' : ''}`}
      style={{ background: '#F0EFFF' }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen pb-20 lg:pb-0">
        <TopBar
          onCaptureOpen={() => setCaptureOpen(true)}
          onCalmMode={() => setCalmMode(m => !m)}
          calmMode={calmMode}
        />

        <main className="flex-1 p-4 lg:p-5 max-w-5xl mx-auto w-full">

          <div
            className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ background: modeBg, border: `0.5px solid ${modeColor}30` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: modeColor }} />
              <span className="text-[11px] font-bold tracking-wide" style={{ color: modeText }}>
                {getDayModeLabel(dayMode)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {dangerFollowUps > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FCE4EC', color: '#9C1B3E' }}>
                  {dangerFollowUps} overdue follow-up{dangerFollowUps > 1 ? 's' : ''}
                </span>
              )}
              {unbriefedMeetings > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  {unbriefedMeetings} brief needed
                </span>
              )}
            </div>
          </div>

          {invisibleWin && !calmMode && (
            <div
              className="mb-4 px-4 py-3 rounded-xl flex items-center gap-3 fade-in"
              style={{ background: '#D4EDDA', border: '0.5px solid #4CAF5040' }}
            >
              <span style={{ color: '#4CAF50', fontSize: '14px' }}>★</span>
              <p className="text-[12px] font-semibold" style={{ color: '#1A7A3A' }}>
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
              style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
            >
              <div className="w-full">
                <p className="monica-label">Day forecast</p>
                <p className="text-[14px] font-bold mb-2" style={{ color: '#1E1B4B', letterSpacing: '-0.01em' }}>
                  {forecast.label}
                </p>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${forecast.load}%`,
                      background: forecast.load < 50 ? '#4CAF50' : forecast.load < 75 ? '#D97706' : '#EF4444'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <TrackerPulse />
          </div>

          <div className="mb-4">
            <ExecutiveSignalsWidget />
          </div>

          <div className="mb-4">
            <LearnPatternPrompt />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head flex items-center justify-between">
                <div>
                  <p className="monica-label">Today's priorities</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                      {pendingTasks.length} pending
                    </span>
                    {doneTasks.length > 0 && (
                      <span className="text-[12px] font-semibold" style={{ color: '#4CAF50' }}>
                        · {doneTasks.length} done
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setAddTaskOpen(true)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-110 active:scale-95"
                  style={{ background: '#EDE9FE', color: '#7C3AED' }}
                >
                  +
                </button>
              </div>
              <div className="px-3 py-1 max-h-72 overflow-y-auto">
                {pendingTasks.length === 0 && doneTasks.length === 0 ? (
                  <EmptyState icon="✓" title="All clear" description="No pending tasks today" />
                ) : (
                  <>
                    {pendingTasks.slice(0, 7).map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                    {doneTasks.slice(0, 2).map(task => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Follow-up radar</p>
                <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                  {followUps.length} awaiting response
                </p>
              </div>
              <div className="px-4 py-1 max-h-72 overflow-y-auto">
                {followUps.length === 0 ? (
                  <EmptyState icon="◎" title="Radar clear" description="No pending follow-ups" />
                ) : (
                  followUps.map(f => (
                    <FollowUpItem key={f.id} followUp={f} />
                  ))
                )}
              </div>
            </div>

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">Today's agenda</p>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                    {activeEvents.filter(e => !e.is_shadow).length} upcoming
                  </p>
                  {(completedTodayEvents.length > 0 || pastActiveEvents.length > 0) && (
                    <span className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                      {completedTodayEvents.length + pastActiveEvents.length} done
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 py-3 max-h-72 overflow-y-auto">
                {activeEvents.length === 0 && completedTodayEvents.length === 0 && pastActiveEvents.length === 0 ? (
                  <EmptyState icon="◻" title="No events today" />
                ) : (
                  <>
                    {activeEvents.map(event => (
                      <EventItem key={event.id} event={event} />
                    ))}
                    {(completedTodayEvents.length > 0 || pastActiveEvents.length > 0) && (
                      <div className="mt-2 pt-2" style={{ borderTop: '0.5px solid #F3F4F6' }}>
                        {completedTodayEvents.map(event => (
                          <EventItem key={event.id} event={event} />
                        ))}
                        {pastActiveEvents.map(event => (
                          <EventItem key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {rawCaptures.length > 0 && (
              <div className="monica-card overflow-hidden">
                <div className="monica-section-head">
                  <p className="monica-label">Inbox</p>
                  <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                    {rawCaptures.length} unprocessed
                  </p>
                </div>
                <div className="px-4 py-2 max-h-44 overflow-y-auto">
                  {rawCaptures.slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      className="flex items-start gap-2 py-2.5 border-b last:border-0"
                      style={{ borderColor: '#F3F4F6' }}
                    >
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 flex-shrink-0"
                        style={{ background: '#EDE9FE', color: '#7C3AED' }}
                      >
                        {c.auto_tag}
                      </span>
                      <p className="text-[12px] font-medium leading-relaxed" style={{ color: '#374151' }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="mt-4">
            <OperationalRhythm />
          </div>

        </main>
      </div>

      <BottomNav />
      <QuickCapture isOpen={captureOpen} onClose={() => setCaptureOpen(false)} />
      <AddTaskModal isOpen={addTaskOpen} onClose={() => setAddTaskOpen(false)} />
      <InstallPrompt />
    </div>
  )
}