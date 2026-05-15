'use client'

import { useEffect, useState } from 'react'
import { computeReadiness, getSetting } from '@/lib/db.queries'
import { getGreeting } from '@/lib/utils'

interface TopBarProps {
  onCaptureOpen: () => void
  onCalmMode: () => void
  calmMode: boolean
}

export function TopBar({ onCaptureOpen, onCalmMode, calmMode }: TopBarProps) {
  const [readiness, setReadiness] = useState(100)
  const [userName, setUserName] = useState('Monica')

  useEffect(() => {
    computeReadiness().then(setReadiness)
    getSetting('user_name').then(n => { if (n) setUserName(n) })
    const interval = setInterval(() => computeReadiness().then(setReadiness), 30000)
    return () => clearInterval(interval)
  }, [])

  const readinessColor = readiness >= 80 ? '#4CAF50' : readiness >= 60 ? '#D97706' : '#EF4444'
  const readinessLabel = readiness >= 90 ? 'In control' : readiness >= 75 ? 'On track' : 'Needs focus'

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{ background: '#FFFFFF', borderBottom: '0.5px solid #E5E7EB' }}
    >
      <div className="fade-in">
        <p
          className="text-[10px] font-semibold tracking-[0.1em] uppercase mb-0.5"
          style={{ color: '#6B7280' }}
        >
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1
          className="text-[16px] font-bold"
          style={{ color: '#1E1B4B', letterSpacing: '-0.02em' }}
        >
          {getGreeting(userName)}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: '#F0EFFF', border: '0.5px solid #E5E7EB' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: readinessColor }} />
          <span className="text-[12px] font-bold" style={{ color: readinessColor }}>
            {readiness}%
          </span>
          <span className="text-[10px] font-medium hidden sm:block" style={{ color: '#6B7280' }}>
            {readinessLabel}
          </span>
        </div>

        <button
          onClick={onCalmMode}
          className="text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all hidden sm:block"
          style={calmMode
            ? { background: '#EDE9FE', color: '#7C3AED', borderColor: '#C4B5FD' }
            : { background: '#F9FAFB', color: '#6B7280', borderColor: '#E5E7EB' }
          }
        >
          {calmMode ? '◌ Calm on' : '◌ Calm'}
        </button>

        <button
          onClick={onCaptureOpen}
          className="flex items-center gap-1.5 text-white text-[12px] font-semibold px-4 py-1.5 rounded-full transition-all active:scale-95"
          style={{ background: '#7C3AED' }}
        >
          <span>+</span>
          <span>Capture</span>
        </button>
      </div>
    </div>
  )
}