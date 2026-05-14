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
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-4 w-14 bg-gray-100 rounded" />
      </div>
    </div>
  )

  const getConfig = (s: number) => {
    if (s >= 80) return { ring: '#1D9E75', text: '#0F6E56', label: 'In control', sub: 'Operating well' }
    if (s >= 60) return { ring: '#D4860A', text: '#854F0B', label: 'On track', sub: 'Watch a few items' }
    return { ring: '#C94F2C', text: '#993C1D', label: 'Focus needed', sub: 'Urgent items open' }
  }

  const c = getConfig(score)
  const circumference = 2 * Math.PI * 26
  const offset = circumference - (score / 100) * circumference

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
    >
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#F5F4F2" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="26"
            fill="none"
            stroke={c.ring}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-semibold" style={{ color: c.text }}>{score}%</span>
        </div>
      </div>
      <div>
        <p className="monica-label">Readiness</p>
        <p className="text-[14px] font-medium mb-0.5" style={{ color: c.text, letterSpacing: '-0.01em' }}>
          {c.label}
        </p>
        <p className="text-[11px]" style={{ color: '#A8A6A0' }}>{c.sub}</p>
      </div>
    </div>
  )
}