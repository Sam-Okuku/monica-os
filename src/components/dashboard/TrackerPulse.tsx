'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { db } from '@/lib/db'

interface PulseData {
  total: number
  completed: number
  inProgress: number
  tbc: number
  notStarted: number
  pct: number
  atRisk: string[]
}

interface Baseline {
  completed: number
  inProgress: number
  tbc: number
  notStarted: number
}

function todayKey(): string {
  const d = new Date()
  return `monica-tracker-baseline-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function getBaseline(current: Omit<Baseline, never>): Baseline {
  try {
    const key = todayKey()
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(key, JSON.stringify(current))
    return current
  } catch {
    return current
  }
}

function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const fromRef = useRef(0)

  useEffect(() => {
    fromRef.current = display
    startRef.current = null
    let raf: number

    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased)
      setDisplay(next)
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{display}</>
}

const LANES = [
  {
    key: 'completed' as const,
    label: 'Done',
    color: '#4CAF50',
    glow: 'rgba(76,175,80,0.35)',
    gradientFrom: '#5CC95F',
    gradientTo: '#3D9B40',
    icon: (
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
        <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: 'inProgress' as const,
    label: 'Active',
    color: '#FDD835',
    glow: 'rgba(253,216,53,0.35)',
    gradientFrom: '#FFE066',
    gradientTo: '#E8C200',
    icon: (
      <svg width="8" height="9" viewBox="0 0 8 9" fill="none">
        <path d="M0.5 0.5L7.5 4.5L0.5 8.5V0.5Z" fill="#1E1B4B"/>
      </svg>
    ),
    pulse: true,
  },
  {
    key: 'tbc' as const,
    label: 'TBC',
    color: '#CE93D8',
    glow: 'rgba(206,147,216,0.35)',
    gradientFrom: '#DDA8E5',
    gradientTo: '#B873C4',
    icon: <span style={{ fontSize: '10px', fontWeight: 900, color: '#1E1B4B' }}>?</span>,
  },
  {
    key: 'notStarted' as const,
    label: 'Not started',
    color: '#F48FB1',
    glow: 'rgba(244,143,177,0.35)',
    gradientFrom: '#F9ABC6',
    gradientTo: '#E8709C',
    icon: <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1.5px solid #1E1B4B', display: 'block' }} />,
  },
]

export function TrackerPulse() {
  const [data, setData] = useState<PulseData | null>(null)
  const [baseline, setBaseline] = useState<Baseline | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    async function load() {
      const actions = await db.actions.toArray()
      const departments = await db.departments.toArray()

      const total = actions.length
      const completed = actions.filter(a => a.status === 'completed').length
      const inProgress = actions.filter(a => a.status === 'in-progress').length
      const tbc = actions.filter(a => a.status === 'tbc').length
      const notStarted = actions.filter(a => a.status === 'not-started').length
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0

      const atRisk: string[] = []
      for (const dept of departments) {
        const deptActions = actions.filter(a => a.department_id === dept.id)
        const deptTotal = deptActions.length
        const deptNotDone = deptActions.filter(a => a.status === 'tbc' || a.status === 'not-started').length
        if (deptTotal > 0 && deptNotDone / deptTotal >= 0.6) atRisk.push(dept.name)
      }

      const current = { completed, inProgress, tbc, notStarted }
      setBaseline(getBaseline(current))
      setData({ total, completed, inProgress, tbc, notStarted, pct, atRisk })
    }
    load()
    const interval = setInterval(load, 60000)
    const t = setTimeout(() => setMounted(true), 80)
    return () => { clearInterval(interval); clearTimeout(t) }
  }, [])

  if (!data) return null

  const maxCount = Math.max(data.completed, data.inProgress, data.tbc, data.notStarted, 1)

  const getDelta = (key: keyof Baseline) => {
    if (!baseline) return 0
    return data[key] - baseline[key]
  }

  return (
    <Link href="/tracker" className="block group">
      <div
        className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300"
        style={{
          background: 'linear-gradient(155deg, #232057 0%, #1E1B4B 55%, #18153D 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(30,27,75,0.6)',
        }}
      >
        {/* ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-60px', right: '-60px', width: '220px', height: '220px',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          }}
        />

        {/* header */}
        <div className="flex items-center justify-between mb-5 relative">
          <div>
            <p
              className="text-[10px] font-bold tracking-[0.14em] uppercase mb-1.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Tracker pulse
            </p>
            <div className="flex items-baseline gap-2.5">
              <span
                className="text-[28px] font-black tabular-nums"
                style={{
                  color: '#4CAF50',
                  letterSpacing: '-0.04em',
                  textShadow: '0 0 24px rgba(76,175,80,0.4)',
                }}
              >
                <CountUp value={mounted ? data.pct : 0} />%
              </span>
              <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                complete · {data.completed}/{data.total} actions
              </span>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all group-hover:translate-x-0.5"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}
          >
            View tracker
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M0.5 4H9.5M9.5 4L6 0.5M9.5 4L6 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* lanes */}
        <div className="space-y-2.5 relative">
          {LANES.map(lane => {
            const count = data[lane.key]
            const widthPct = mounted ? Math.max((count / maxCount) * 100, count > 0 ? 14 : 0) : 0
            const delta = getDelta(lane.key)

            return (
              <div key={lane.key} className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-md flex-shrink-0"
                  style={{
                    width: '22px',
                    height: '22px',
                    background: `linear-gradient(155deg, ${lane.gradientFrom}, ${lane.gradientTo})`,
                    boxShadow: `0 0 12px ${lane.glow}, 0 1px 2px rgba(0,0,0,0.2)`,
                  }}
                >
                  {lane.icon}
                </div>

                <span
                  className="text-[11px] font-bold flex-shrink-0"
                  style={{ color: lane.color, minWidth: '76px' }}
                >
                  {lane.label}
                </span>

                <div
                  className="flex-1 rounded-full overflow-hidden relative"
                  style={{
                    height: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    className="h-full rounded-full relative transition-all ease-out"
                    style={{
                      width: `${widthPct}%`,
                      background: `linear-gradient(90deg, ${lane.gradientFrom}, ${lane.gradientTo})`,
                      boxShadow: `0 0 10px ${lane.glow}`,
                      transitionDuration: '900ms',
                      transitionDelay: '100ms',
                    }}
                  >
                    {lane.pulse && count > 0 && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: lane.gradientFrom,
                          animation: 'pulseLane 2.2s ease-in-out infinite',
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0" style={{ minWidth: '50px', justifyContent: 'flex-end' }}>
                  <span
                    className="text-[16px] font-black tabular-nums"
                    style={{ color: lane.color, letterSpacing: '-0.03em' }}
                  >
                    <CountUp value={mounted ? count : 0} />
                  </span>
                  {delta > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(76,175,80,0.18)', color: '#86EFAC' }}
                    >
                      +{delta}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* at risk */}
        {data.atRisk.length > 0 && (
          <div
            className="mt-4 pt-4 flex items-center gap-2 flex-wrap relative"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: '#F48FB1', animation: 'pulseLane 1.8s ease-in-out infinite' }}
            />
            <span
              className="text-[9px] font-bold tracking-wide uppercase"
              style={{ color: '#F48FB1' }}
            >
              At risk
            </span>
            {data.atRisk.slice(0, 3).map(name => (
              <span
                key={name}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(244,143,177,0.12)', color: '#F9ABC6' }}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulseLane {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </Link>
  )
}