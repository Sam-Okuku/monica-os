'use client'

import { useEffect, useState } from 'react'
import { getThisWeekNarrative, getThisWeekAccuracy, computeWeeklyTrustMetrics } from '@/lib/signals/trustMetrics'

export function TrustDigest() {
  const [narrative, setNarrative] = useState<string | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      // Compute on Fridays after 4pm
      const now = new Date()
      const isFriday = now.getDay() === 5
      const isAfternoon = now.getHours() >= 16

      if (isFriday && isAfternoon) {
        await computeWeeklyTrustMetrics()
      }

      const [n, a] = await Promise.all([getThisWeekNarrative(), getThisWeekAccuracy()])
      setNarrative(n)
      setAccuracy(a)
    }
    load()
  }, [])

  if (!narrative) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#EDE9FE', border: '0.5px solid #C4B5FD' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
          style={{ background: '#7C3AED' }}
        >
          ✦
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wide uppercase mb-1" style={{ color: '#7C3AED' }}>
            This week
          </p>
          <p className="text-[12px] font-medium leading-relaxed" style={{ color: '#374151' }}>
            {narrative}
          </p>
          {accuracy !== null && (
            <p className="text-[11px] font-semibold mt-1" style={{ color: '#7C3AED' }}>
              {accuracy}% of suggestions accepted without change
            </p>
          )}
        </div>
      </div>
    </div>
  )
}