'use client'

import { useEffect, useState } from 'react'
import { computeReadiness } from '@/lib/db.queries'

export function ReadinessScore() {
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    computeReadiness().then(setScore)
    const interval = setInterval(() => computeReadiness().then(setScore), 30000)
    return () => clearInterval(interval)
  }, [])

  if (score === null) return (
    <div className="monica-card p-4 flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-5 w-14 bg-gray-100 rounded" />
      </div>
    </div>
  )

  const getConfig = (s: number) => {
    if (s >= 80) return { ring: '#4CAF50', text: '#1A7A3A', label: 'In control', sub: 'Operating well' }
    if (s >= 60) return { ring: '#D97706', text: '#92400E', label: 'On track', sub: 'Watch a few items' }
    return { ring: '#EF4444', text: '#991B1B', label: 'Focus needed', sub: 'Urgent items open' }
  }

  const c = getConfig(score)
  const circumference = 2 * Math.PI * 26
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="monica-card p-4 flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F4F6" strokeWidth="5" />
          <circle
            cx="32" cy="32" r="26"
            fill="none"
            stroke={c.ring}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-bold" style={{ color: c.text }}>{score}%</span>
        </div>
      </div>
      <div>
        <p className="monica-label">Readiness</p>
        <p className="text-[15px] font-bold mb-0.5" style={{ color: c.text, letterSpacing: '-0.02em' }}>
          {c.label}
        </p>
        <p className="text-[11px] font-medium" style={{ color: '#6B7280' }}>{c.sub}</p>
      </div>
    </div>
  )
}