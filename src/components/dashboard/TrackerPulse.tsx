'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import Link from 'next/link'

interface PulseData {
  total: number
  completed: number
  inProgress: number
  tbc: number
  notStarted: number
  pct: number
  atRisk: string[]
}

export function TrackerPulse() {
  const [data, setData] = useState<PulseData | null>(null)

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
        if (deptTotal > 0 && (deptNotDone / deptTotal) >= 0.6) {
          atRisk.push(dept.name)
        }
      }

      setData({ total, completed, inProgress, tbc, notStarted, pct, atRisk })
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return null

  const bars = [
    { count: data.completed, color: '#4CAF50', label: 'Done' },
    { count: data.inProgress, color: '#FDD835', label: 'Active' },
    { count: data.tbc, color: '#CE93D8', label: 'TBC' },
    { count: data.notStarted, color: '#F48FB1', label: 'New' },
  ]
  const maxBar = Math.max(...bars.map(b => b.count), 1)

  return (
    <Link href="/tracker" className="block">
      <div
        className="rounded-xl p-4 transition-all hover:opacity-90 active:scale-[0.99]"
        style={{ background: '#1E1B4B' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p
              className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-1"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Tracker pulse
            </p>
            <p className="text-[15px] font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
              {data.pct}% complete
              <span
                className="text-[11px] font-normal ml-2"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {data.completed}/{data.total} actions
              </span>
            </p>
          </div>
          <div
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            View tracker →
          </div>
        </div>

        <div className="flex items-end gap-1.5 h-10 mb-3">
          {bars.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1">
              <div
                className="rounded-t-sm transition-all duration-700"
                style={{
                  height: `${Math.max((bar.count / maxBar) * 36, bar.count > 0 ? 4 : 0)}px`,
                  background: bar.color,
                  opacity: bar.count === 0 ? 0.2 : 1,
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {bars.map((bar, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: bar.color }} />
              <span className="text-[10px] font-semibold text-white">{bar.count}</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{bar.label}</span>
            </div>
          ))}
        </div>

        {data.atRisk.length > 0 && (
          <div
            className="mt-3 pt-3 flex items-center gap-2 flex-wrap"
            style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            <span
              className="text-[9px] font-semibold tracking-wide uppercase"
              style={{ color: '#F48FB1' }}
            >
              At risk:
            </span>
            {data.atRisk.slice(0, 3).map(name => (
              <span
                key={name}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(244,143,177,0.15)', color: '#F48FB1' }}
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}