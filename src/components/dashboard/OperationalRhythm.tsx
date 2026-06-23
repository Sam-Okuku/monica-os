'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import { todayDate, hoursAgo } from '@/lib/utils'
import { MorningSignalsSummary } from '@/components/signals/MorningSignalsSummary'
import { EveningSignalsSummary } from '@/components/signals/EveningSignalsSummary'
import { TrustDigest } from '@/components/signals/TrustDigest'
import { ExecutiveSignal } from '@/lib/signals/types'

type DayPhase = 'morning' | 'midday' | 'evening'

function getDayPhase(): DayPhase {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 17) return 'evening'
  return 'midday'
}

interface OperationalData {
  pendingTasks: number
  bossTasks: number
  urgentTasks: number
  overdueFollowUps: number
  totalFollowUps: number
  unbriefedMeetings: { id: number; title: string }[]
  atRiskDepts: string[]
  tbcActions: number
  completedTodayTasks: number
  completedTodayMeetings: number
  trackerPct: number
  upcomingMeetings: { title: string; starts_at: string }[]
  carryoverTasks: { title: string; priority: string }[]
  resolvedFollowUpsToday: number
  pendingSignals: ExecutiveSignal[]
}

async function loadOperationalData(): Promise<OperationalData> {
  const today = todayDate()
  const now = Date.now()

  const [tasks, followUps, events, actions, departments, pendingSignals] = await Promise.all([
    db.tasks.toArray(),
    db.follow_ups.toArray(),
    db.events.toArray(),
    db.actions.toArray(),
    db.departments.toArray(),
    db.executive_signals.where('status').equals('pending').toArray(),
  ])

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const bossTasks = pendingTasks.filter(t => t.is_boss_priority)
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent')
  const completedTodayTasks = tasks.filter(t =>
    t.status === 'done' && t.completed_at?.startsWith(today)
  )

  const activeFollowUps = followUps.filter(f => f.status === 'waiting' || f.status === 'nudged')
  const overdueFollowUps = activeFollowUps.filter(f => hoursAgo(f.sent_at) >= 36)
  const resolvedToday = followUps.filter(f =>
    f.status === 'resolved' && f.resolved_at?.startsWith(today)
  )

  const todaysEvents = events.filter(e => e.starts_at.startsWith(today))
  const unbriefed = todaysEvents.filter(e =>
    e.prep_needed && !e.brief_sent &&
    (e.lifecycle === 'active' || !e.lifecycle) &&
    new Date(e.starts_at).getTime() > now
  ).map(e => ({ id: e.id!, title: e.title }))

  const completedMeetings = todaysEvents.filter(e =>
    e.lifecycle === 'completed' || new Date(e.ends_at).getTime() < now
  ).length

  const upcoming = todaysEvents
    .filter(e => new Date(e.starts_at).getTime() > now && (e.lifecycle === 'active' || !e.lifecycle))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 3)
    .map(e => ({ title: e.title, starts_at: e.starts_at }))

  const atRisk: string[] = []
  for (const dept of departments) {
    const deptActions = actions.filter(a => a.department_id === dept.id)
    const total = deptActions.length
    const notDone = deptActions.filter(a => a.status === 'tbc' || a.status === 'not-started').length
    if (total > 0 && notDone / total >= 0.6) atRisk.push(dept.name)
  }

  const total = actions.length
  const completed = actions.filter(a => a.status === 'completed').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const tbc = actions.filter(a => a.status === 'tbc').length

  const carryover = pendingTasks
    .sort((a, b) => {
      const p: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
      return (p[a.priority] ?? 2) - (p[b.priority] ?? 2)
    })
    .slice(0, 4)
    .map(t => ({ title: t.title, priority: t.priority }))

  return {
    pendingTasks: pendingTasks.length,
    bossTasks: bossTasks.length,
    urgentTasks: urgentTasks.length,
    overdueFollowUps: overdueFollowUps.length,
    totalFollowUps: activeFollowUps.length,
    unbriefedMeetings: unbriefed,
    atRiskDepts: atRisk,
    tbcActions: tbc,
    completedTodayTasks: completedTodayTasks.length,
    completedTodayMeetings: completedMeetings,
    trackerPct: pct,
    upcomingMeetings: upcoming,
    carryoverTasks: carryover,
    resolvedFollowUpsToday: resolvedToday.length,
    pendingSignals: pendingSignals.sort((a, b) => {
      if (a.riskLevel === 'high' && b.riskLevel !== 'high') return -1
      if (b.riskLevel === 'high' && a.riskLevel !== 'high') return 1
      return b.confidence - a.confidence
    }),
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch { return '' }
}

function getLivePulse(data: OperationalData, phase: DayPhase): string {
  if (phase === 'morning') {
    if (data.pendingSignals.length > 0)
      return `${data.pendingSignals.length} signal${data.pendingSignals.length > 1 ? 's' : ''} awaiting your review.`
    if (data.unbriefedMeetings.length > 0)
      return `${data.unbriefedMeetings[0].title} needs a brief before it starts.`
    if (data.overdueFollowUps > 0)
      return `${data.overdueFollowUps} follow-up${data.overdueFollowUps > 1 ? 's are' : ' is'} overdue — radar attention needed.`
    if (data.urgentTasks > 0)
      return `${data.urgentTasks} urgent task${data.urgentTasks > 1 ? 's' : ''} waiting for your attention.`
    if (data.bossTasks > 0)
      return `${data.bossTasks} boss priorit${data.bossTasks > 1 ? 'ies' : 'y'} on your list today.`
    return 'All systems clear. Today looks well prepared.'
  }
  if (phase === 'evening') {
    if (data.completedTodayTasks > 0)
      return `You completed ${data.completedTodayTasks} task${data.completedTodayTasks > 1 ? 's' : ''} today.`
    if (data.resolvedFollowUpsToday > 0)
      return `${data.resolvedFollowUpsToday} follow-up${data.resolvedFollowUpsToday > 1 ? 's' : ''} resolved today.`
    return 'Wrapping up the day.'
  }
  if (data.pendingSignals.length > 0)
    return `${data.pendingSignals.length} signal${data.pendingSignals.length > 1 ? 's' : ''} awaiting review.`
  if (data.overdueFollowUps > 0)
    return `${data.overdueFollowUps} follow-up${data.overdueFollowUps > 1 ? 's' : ''} overdue.`
  if (data.upcomingMeetings.length > 0)
    return `${data.upcomingMeetings[0].title} at ${formatTime(data.upcomingMeetings[0].starts_at)}.`
  return 'Operations running smoothly.'
}

function getMorningHeadline(data: OperationalData): string {
  const issues = [
    data.pendingSignals.length > 0 && `${data.pendingSignals.length} signal${data.pendingSignals.length > 1 ? 's' : ''} to review`,
    data.unbriefedMeetings.length > 0 && 'meetings need briefs',
    data.overdueFollowUps > 0 && 'follow-ups overdue',
    data.urgentTasks > 0 && 'urgent tasks waiting',
    data.atRiskDepts.length > 0 && 'departments at risk',
  ].filter(Boolean)

  if (issues.length === 0) return 'You are fully prepared for today.'
  if (issues.length === 1) return `1 operational area needs attention.`
  return `${issues.length} operational areas need attention.`
}

function getEveningHeadline(data: OperationalData): string {
  const total = data.completedTodayTasks + data.resolvedFollowUpsToday + data.completedTodayMeetings
  if (total === 0 && data.pendingTasks === 0) return 'Clean board. Strong day.'
  if (total === 0) return `${data.pendingTasks} item${data.pendingTasks > 1 ? 's' : ''} carry forward to tomorrow.`
  return `You handled ${total} thing${total > 1 ? 's' : ''} today.`
}

// ─── MORNING MODAL ────────────────────────────────────────────────────────────

function MorningModal({
  data,
  onClose,
  onDataChange,
}: {
  data: OperationalData
  onClose: () => void
  onDataChange: () => void
}) {
  const [briefingDone, setBriefingDone] = useState<Set<number>>(new Set())

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const markBriefed = async (id: number) => {
    await db.events.update(id, { brief_sent: true })
    setBriefingDone(prev => new Set([...prev, id]))
    onDataChange()
  }

  const sections = [
    data.unbriefedMeetings.length > 0 && {
      icon: '◻',
      color: '#D97706',
      label: 'Meetings needing briefs',
      content: (
        <div className="space-y-1.5">
          {data.unbriefedMeetings.map(m => (
            <div key={m.id} className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium" style={{ color: '#374151' }}>{m.title}</span>
              <button
                onClick={() => markBriefed(m.id)}
                disabled={briefingDone.has(m.id)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50"
                style={{ background: briefingDone.has(m.id) ? '#D4EDDA' : '#FEF3C7', color: briefingDone.has(m.id) ? '#1A7A3A' : '#92400E' }}
              >
                {briefingDone.has(m.id) ? '✓ Briefed' : 'Mark briefed'}
              </button>
            </div>
          ))}
        </div>
      ),
    },
    data.overdueFollowUps > 0 && {
      icon: '◎',
      color: '#EF4444',
      label: `${data.overdueFollowUps} overdue follow-up${data.overdueFollowUps > 1 ? 's' : ''}`,
      content: (
        <p className="text-[12px] font-medium" style={{ color: '#374151' }}>
          These have been waiting over 36 hours. Check the radar.
        </p>
      ),
    },
    data.urgentTasks > 0 && {
      icon: '✓',
      color: '#7C3AED',
      label: `${data.urgentTasks} urgent task${data.urgentTasks > 1 ? 's' : ''}`,
      content: (
        <p className="text-[12px] font-medium" style={{ color: '#374151' }}>
          {data.bossTasks > 0 ? `${data.bossTasks} flagged as boss priority.` : 'These need action today.'}
        </p>
      ),
    },
    data.atRiskDepts.length > 0 && {
      icon: '▦',
      color: '#EF4444',
      label: `${data.atRiskDepts.length} department${data.atRiskDepts.length > 1 ? 's' : ''} at risk`,
      content: (
        <div className="flex gap-1.5 flex-wrap">
          {data.atRiskDepts.map(d => (
            <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FCE4EC', color: '#9C1B3E' }}>
              {d}
            </span>
          ))}
        </div>
      ),
    },
    data.upcomingMeetings.length > 0 && {
      icon: '◷',
      color: '#1E1B4B',
      label: "Today's upcoming meetings",
      content: (
        <div className="space-y-1">
          {data.upcomingMeetings.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-bold tabular-nums" style={{ color: '#7C3AED', minWidth: '52px' }}>
                {formatTime(m.starts_at)}
              </span>
              <span className="text-[12px] font-medium" style={{ color: '#374151' }}>{m.title}</span>
            </div>
          ))}
        </div>
      ),
    },
    data.tbcActions > 0 && {
      icon: '?',
      color: '#9CA3AF',
      label: `${data.tbcActions} tracker items still TBC`,
      content: (
        <p className="text-[12px] font-medium" style={{ color: '#374151' }}>
          Review the tracker to confirm or escalate these.
        </p>
      ),
    },
  ].filter(Boolean) as Array<{ icon: string; color: string; label: string; content: React.ReactNode }>

  const allClear = sections.length === 0 && data.pendingSignals.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{ background: 'rgba(30,27,75,0.5)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl overflow-hidden slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-6 py-5 flex items-start justify-between"
          style={{ background: '#1E1B4B' }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Morning briefing · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-[18px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {getMorningHeadline(data)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none mt-1 flex-shrink-0 ml-4 transition-opacity hover:opacity-60"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {allClear ? (
            <div className="px-6 py-10 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"
                style={{ background: '#D4EDDA' }}
              >
                ✓
              </div>
              <p className="text-[16px] font-bold mb-2" style={{ color: '#1E1B4B' }}>
                Fully prepared
              </p>
              <p className="text-[13px] font-medium" style={{ color: '#6B7280' }}>
                No outstanding items. Today is set up well.
              </p>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-4">
              {sections.map((section, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: '#FAFAFE', border: '0.5px solid #E5E7EB' }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                      style={{ background: section.color }}
                    >
                      {section.icon}
                    </div>
                    <p className="text-[11px] font-bold tracking-wide" style={{ color: section.color }}>
                      {section.label}
                    </p>
                  </div>
                  {section.content}
                </div>
              ))}

              {data.pendingSignals.length > 0 && (
                <MorningSignalsSummary
                  signals={data.pendingSignals}
                  onSignalHandled={onDataChange}
                />
              )}
            </div>
          )}

          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: '0.5px solid #F3F4F6' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: '#E5E7EB', width: '80px' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${data.trackerPct}%`, background: '#4CAF50' }}
                />
              </div>
              <span className="text-[11px] font-bold" style={{ color: '#1A7A3A' }}>
                {data.trackerPct}% tracker complete
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95"
              style={{ background: '#7C3AED' }}
            >
              Start the day →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── EVENING MODAL ────────────────────────────────────────────────────────────

function EveningModal({
  data,
  onClose,
}: {
  data: OperationalData
  onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const totalHandled = data.completedTodayTasks + data.resolvedFollowUpsToday + data.completedTodayMeetings

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{ background: 'rgba(30,27,75,0.5)', backdropFilter: 'blur(4px)' }}
      />
      <div
        className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl overflow-hidden slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="px-6 py-5 flex items-start justify-between"
          style={{ background: '#1E1B4B' }}
        >
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Day closing · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-[18px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {getEveningHeadline(data)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none mt-1 flex-shrink-0 ml-4 transition-opacity hover:opacity-60"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <div className="px-6 py-5 space-y-4">

            {totalHandled > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: '#F0FDF4', border: '0.5px solid #86EFAC' }}
              >
                <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: '#1A7A3A' }}>
                  ★ What you handled today
                </p>
                <div className="space-y-1.5">
                  {data.completedTodayTasks > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-[12px] font-medium" style={{ color: '#374151' }}>
                        {data.completedTodayTasks} task{data.completedTodayTasks > 1 ? 's' : ''} completed
                      </span>
                    </div>
                  )}
                  {data.resolvedFollowUpsToday > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-[12px] font-medium" style={{ color: '#374151' }}>
                        {data.resolvedFollowUpsToday} follow-up{data.resolvedFollowUpsToday > 1 ? 's' : ''} resolved
                      </span>
                    </div>
                  )}
                  {data.completedTodayMeetings > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-[12px] font-medium" style={{ color: '#374151' }}>
                        {data.completedTodayMeetings} meeting{data.completedTodayMeetings > 1 ? 's' : ''} completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.pendingTasks > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: '#FAFAFE', border: '0.5px solid #E5E7EB' }}
              >
                <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: '#7C3AED' }}>
                  Carrying forward to tomorrow
                </p>
                <div className="space-y-1.5">
                  {data.carryoverTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={t.priority === 'urgent'
                          ? { background: '#FEE2E2', color: '#991B1B' }
                          : t.priority === 'high'
                          ? { background: '#FEF3C7', color: '#92400E' }
                          : { background: '#F3F4F6', color: '#6B7280' }
                        }
                      >
                        {t.priority}
                      </span>
                      <span className="text-[12px] font-medium" style={{ color: '#374151' }}>{t.title}</span>
                    </div>
                  ))}
                  {data.pendingTasks > 4 && (
                    <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
                      +{data.pendingTasks - 4} more tasks
                    </p>
                  )}
                </div>
              </div>
            )}

            {data.totalFollowUps > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: '#FAFAFE', border: '0.5px solid #E5E7EB' }}
              >
                <p className="text-[11px] font-bold tracking-wide mb-1.5" style={{ color: data.overdueFollowUps > 0 ? '#EF4444' : '#D97706' }}>
                  {data.totalFollowUps} follow-up{data.totalFollowUps > 1 ? 's' : ''} still open
                  {data.overdueFollowUps > 0 && ` · ${data.overdueFollowUps} overdue`}
                </p>
                <p className="text-[12px] font-medium" style={{ color: '#6B7280' }}>
                  Check the radar before you close out.
                </p>
              </div>
            )}

            <div
              className="rounded-xl p-4"
              style={{ background: '#F5F3FF', border: '0.5px solid #DDD6FE' }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold tracking-wide" style={{ color: '#7C3AED' }}>
                  Tracker progress
                </p>
                <span className="text-[13px] font-black" style={{ color: '#7C3AED' }}>
                  {data.trackerPct}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${data.trackerPct}%`, background: '#4CAF50' }}
                />
              </div>
            </div>

            <EveningSignalsSummary />
            <TrustDigest />

          </div>

          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: '0.5px solid #F3F4F6' }}
          >
            <p className="text-[11px] font-medium italic" style={{ color: '#9CA3AF' }}>
              {data.pendingTasks === 0 ? 'Clean board. Tomorrow starts strong.' : 'Tomorrow is already set up.'}
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95"
              style={{ background: '#1E1B4B' }}
            >
              Close day ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function OperationalRhythm() {
  const [phase, setPhase] = useState<DayPhase>(getDayPhase())
  const [data, setData] = useState<OperationalData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const d = await loadOperationalData()
    setData(d)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(() => {
      setPhase(getDayPhase())
      refresh()
    }, 60000)
    return () => clearInterval(interval)
  }, [refresh])

  if (loading || !data) return null

  const pulse = getLivePulse(data, phase)

  if (phase === 'midday') {
    return (
      <div
        className="mt-4 flex items-center justify-center px-5 py-3.5 rounded-xl"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
      >
        <p className="text-[12px] font-medium" style={{ color: '#6B7280' }}>
          {pulse}
        </p>
      </div>
    )
  }

  const isMorning = phase === 'morning'

  const ctaHeadline = isMorning
    ? `Good morning, Monica. ${getMorningHeadline(data)}`
    : `${getEveningHeadline(data)}${data.pendingTasks > 0 ? ` ${data.pendingTasks} item${data.pendingTasks > 1 ? 's' : ''} remain unresolved.` : ''}`

  const ctaButton = isMorning ? 'Open day →' : 'Close day →'
  const ctaBg = isMorning ? '#FFFBEB' : '#F5F3FF'
  const ctaBorder = isMorning ? '#FDE68A' : '#DDD6FE'
  const ctaTextColor = isMorning ? '#92400E' : '#4C1D95'
  const ctaPulseColor = isMorning ? '#D97706' : '#7C3AED'
  const ctaBtnBg = isMorning ? '#1E1B4B' : '#7C3AED'

  return (
    <>
      <div
        className="mt-4 rounded-xl px-5 py-4 transition-all"
        style={{ background: ctaBg, border: `0.5px solid ${ctaBorder}` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium leading-relaxed mb-0.5" style={{ color: ctaTextColor }}>
              {ctaHeadline}
            </p>
            <p className="text-[11px] font-medium" style={{ color: ctaPulseColor }}>
              {pulse}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold text-white transition-all active:scale-95 hover:opacity-90"
            style={{ background: ctaBtnBg }}
          >
            {ctaButton}
          </button>
        </div>
      </div>

      {modalOpen && isMorning && (
        <MorningModal
          data={data}
          onClose={() => setModalOpen(false)}
          onDataChange={refresh}
        />
      )}

      {modalOpen && !isMorning && (
        <EveningModal
          data={data}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}