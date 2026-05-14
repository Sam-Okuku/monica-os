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

  const readinessColor = readiness >= 80 ? '#1D9E75' : readiness >= 60 ? '#D4860A' : '#C94F2C'
  const readinessLabel = readiness >= 90 ? 'In control' : readiness >= 75 ? 'On track' : readiness >= 60 ? 'Watch' : 'Focus needed'

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      <div className="fade-in">
        <p className="text-[10px] font-medium text-gray-300 tracking-[0.1em] uppercase mb-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-[16px] font-medium text-gray-800" style={{ letterSpacing: '-0.01em' }}>
          {getGreeting(userName)}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ background: '#FAFAF9', borderColor: '#ECEAE5' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: readinessColor }}
          />
          <span className="text-[12px] font-semibold" style={{ color: readinessColor }}>
            {readiness}%
          </span>
          <span className="text-[10px] text-gray-400 hidden sm:block">{readinessLabel}</span>
        </div>

        <button
          onClick={onCalmMode}
          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all duration-300 hidden sm:block ${
            calmMode
              ? 'bg-[#F0EFFE] text-[#6C63B6] border-[#C5C1EE]'
              : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
          }`}
        >
          {calmMode ? '◌ Calm on' : '◌ Calm'}
        </button>

        <button
          onClick={onCaptureOpen}
          className="flex items-center gap-1.5 text-white text-[11px] font-medium px-3.5 py-1.5 rounded-full transition-all active:scale-95"
          style={{ background: '#6C63B6' }}
        >
          <span className="text-base leading-none">+</span>
          <span>Capture</span>
        </button>
      </div>
    </div>
  )
}