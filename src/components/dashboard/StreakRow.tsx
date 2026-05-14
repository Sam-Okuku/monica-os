'use client'

import { useEffect, useState } from 'react'
import { getStreakCount, getShieldsRemaining } from '@/lib/db.queries'

export function StreakRow() {
  const [streak, setStreak] = useState(0)
  const [shields, setShields] = useState(2)

  useEffect(() => {
    getStreakCount().then(setStreak)
    getShieldsRemaining().then(setShields)
  }, [])

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="monica-label">Daily streak</p>
          <p
            className="text-[18px] font-semibold"
            style={{ color: '#1C1B1A', letterSpacing: '-0.02em' }}
          >
            {streak}
            <span className="text-[13px] font-normal ml-1" style={{ color: '#A8A6A0' }}>days</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 mb-0.5">Shields</p>
          <p className="text-[13px] font-medium" style={{ color: '#6C63B6' }}>{shields} / 2</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {days.map((day, i) => {
          const isDone = i < todayIndex
          const isToday = i === todayIndex
          return (
            <div
              key={i}
              className="flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-medium transition-all"
              style={
                isDone
                  ? { background: '#6C63B6', color: '#FFFFFF' }
                  : isToday
                  ? { background: '#F0EFFE', color: '#6C63B6', outline: '1.5px solid #8B84CC' }
                  : { background: '#F5F4F2', color: '#D3D1C7' }
              }
            >
              {day}
            </div>
          )
        })}
      </div>

      <p className="text-[10px] mt-2" style={{ color: '#C8C6C0' }}>
        Missing a day uses one shield — your streak stays intact
      </p>
    </div>
  )
}