import { db } from '@/lib/db'
import { nowISO } from '@/lib/utils'

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export async function computeWeeklyTrustMetrics(): Promise<void> {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEndStr = weekEnd.toISOString()

  const existing = await db.signal_trust_metrics.where('weekStart').equals(weekStart).first()

  const history = await db.signal_review_history.toArray()
  const thisWeek = history.filter(h => h.reviewedAt >= weekStart && h.reviewedAt < weekEndStr)

  if (thisWeek.length === 0) return

  const totalSignals = thisWeek.length
  const acceptedWithoutChange = thisWeek.filter(h => h.outcome === 'accepted').length
  const reassigned = thisWeek.filter(h => h.outcome === 'reassigned').length
  const dismissed = thisWeek.filter(h => h.outcome === 'dismissed' || h.outcome === 'skip_learned').length
  const patternsLearned = thisWeek.filter(h => h.outcome === 'skip_learned').length

  const reviewedCount = acceptedWithoutChange + reassigned
  const accuracyPct = reviewedCount > 0
    ? Math.round((acceptedWithoutChange / reviewedCount) * 100)
    : 0

  const calendarCount = thisWeek.filter(h => h.finalDestination === 'calendar').length
  const taskCount = thisWeek.filter(h => h.finalDestination === 'task').length
  const followUpCount = thisWeek.filter(h => h.finalDestination === 'followup').length
  const trackerCount = thisWeek.filter(h => h.finalDestination === 'tracker').length
  const noteCount = thisWeek.filter(h => h.finalDestination === 'note').length

  // Build narrative
  const handled = acceptedWithoutChange + reassigned
  const parts: string[] = []
  if (calendarCount > 0) parts.push(`${calendarCount} meeting${calendarCount > 1 ? 's' : ''} added`)
  if (taskCount > 0) parts.push(`${taskCount} task${taskCount > 1 ? 's' : ''} tracked`)
  if (followUpCount > 0) parts.push(`${followUpCount} follow-up${followUpCount > 1 ? 's' : ''} opened`)
  if (trackerCount > 0) parts.push(`${trackerCount} tracker item${trackerCount > 1 ? 's' : ''} updated`)

  let narrative = ''
  if (handled === 0) {
    narrative = 'No signals handled this week.'
  } else {
    narrative = `Monica OS caught ${handled} thing${handled > 1 ? 's' : ''} this week`
    if (parts.length > 0) narrative += ` — ${parts.join(', ')}`
    narrative += '.'
    if (accuracyPct >= 70) narrative += ` ${accuracyPct}% accuracy.`
    if (dismissed > 0) narrative += ` ${dismissed} piece${dismissed > 1 ? 's' : ''} of noise filtered.`
    narrative += ` You handled ${handled} fewer thing${handled > 1 ? 's' : ''} in your head this week.`
  }

  const metrics = {
    weekStart,
    totalSignals,
    acceptedWithoutChange,
    reassigned,
    dismissed,
    accuracyPct,
    calendarCount,
    taskCount,
    followUpCount,
    trackerCount,
    noteCount,
    patternsLearned,
    narrative,
    computedAt: nowISO(),
  }

  if (existing) {
    await db.signal_trust_metrics.update(existing.id!, metrics)
  } else {
    await db.signal_trust_metrics.add(metrics)
  }
}

export async function getThisWeekNarrative(): Promise<string | null> {
  const weekStart = getWeekStart()
  const metrics = await db.signal_trust_metrics.where('weekStart').equals(weekStart).first()
  return metrics?.narrative ?? null
}

export async function getThisWeekAccuracy(): Promise<number | null> {
  const weekStart = getWeekStart()
  const metrics = await db.signal_trust_metrics.where('weekStart').equals(weekStart).first()
  if (!metrics || metrics.accuracyPct < 70) return null // Don't show below 70%
  return metrics.accuracyPct
}