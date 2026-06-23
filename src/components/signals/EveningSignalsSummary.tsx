'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'

interface EveningStats {
  handledCount: number
  dismissedCount: number
  patternsLearned: number
  byDestination: Record<string, number>
}

export function EveningSignalsSummary() {
  const [stats, setStats] = useState<EveningStats | null>(null)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0]
      const history = await db.signal_review_history
        .where('reviewedAt').startsWith(today)
        .toArray()

      if (history.length === 0) { setStats(null); return }

      const handledCount = history.filter(h => h.outcome === 'accepted' || h.outcome === 'reassigned').length
      const dismissedCount = history.filter(h => h.outcome === 'dismissed' || h.outcome === 'skip_learned').length
      const patternsLearned = history.filter(h => h.outcome === 'skip_learned').length

      const byDestination: Record<string, number> = {}
      history.filter(h => h.outcome === 'accepted' || h.outcome === 'reassigned').forEach(h => {
        byDestination[h.finalDestination] = (byDestination[h.finalDestination] || 0) + 1
      })

      setStats({ handledCount, dismissedCount, patternsLearned, byDestination })
    }
    load()
  }, [])

  if (!stats || stats.handledCount === 0) return null

  const destLabels: Record<string, string> = {
    calendar: 'meetings added',
    task: 'tasks created',
    followup: 'follow-ups tracked',
    tracker: 'tracker actions updated',
    note: 'notes saved',
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#F0FDF4', border: '0.5px solid #86EFAC' }}
    >
      <p className="text-[11px] font-bold tracking-wide mb-3" style={{ color: '#1A7A3A' }}>
        ★ Signals handled today
      </p>

      <div className="space-y-1.5 mb-3">
        {Object.entries(stats.byDestination).map(([dest, count]) => (
          <div key={dest} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#4CAF50' }} />
            <span className="text-[12px] font-medium" style={{ color: '#374151' }}>
              {count} {destLabels[dest] ?? dest}
            </span>
          </div>
        ))}
        {stats.dismissedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#9CA3AF' }} />
            <span className="text-[12px] font-medium" style={{ color: '#374151' }}>
              {stats.dismissedCount} dismissed (noise filtered)
            </span>
          </div>
        )}
        {stats.patternsLearned > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#7C3AED' }} />
            <span className="text-[12px] font-medium" style={{ color: '#374151' }}>
              {stats.patternsLearned} pattern{stats.patternsLearned > 1 ? 's' : ''} learned
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] italic" style={{ color: '#6B7280' }}>
        Monica OS handled these before they became things you needed to remember.
      </p>
    </div>
  )
}