import { db } from '@/lib/db'
import { ExecutiveSignal } from './types'

const SYNC_KEY = 'monica-signals-last-sync'
const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

export async function syncSignalsFromServer(): Promise<number> {
  try {
    const res = await fetch('/api/signals/sync', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) return 0

    const data = await res.json()
    const batches: Array<{ batchId: string; signals: Partial<ExecutiveSignal>[]; webhookReceivedAt: string }> =
      data.batches ?? []

    let stored = 0

    for (const batch of batches) {
      for (const signal of batch.signals) {
        // Skip if already stored (deduplicate by batchId + subject + sender)
        const existing = await db.executive_signals
          .where('batchId')
          .equals(batch.batchId)
          .first()

        if (existing) continue

        await db.executive_signals.add({
          batchId: batch.batchId,
          source: signal.source ?? 'email',
          senderEmail: signal.senderEmail ?? '',
          senderName: signal.senderName ?? '',
          subject: signal.subject ?? '',
          bodyExcerpt: signal.bodyExcerpt ?? '',
          confidence: signal.confidence ?? 0.7,
          status: 'pending',
          suggestedDestination: signal.suggestedDestination ?? 'note',
          impact: signal.impact ?? [],
          riskLevel: signal.riskLevel ?? 'none',
          conflictDetail: signal.conflictDetail,
          receivedAt: signal.receivedAt ?? batch.webhookReceivedAt,
          createdAt: new Date().toISOString(),
        })

        stored++
      }

      // Mark batch as synced
      await db.signal_batch_history.put({
        id: batch.batchId,
        senderEmail: batch.signals[0]?.senderEmail ?? '',
        subject: batch.signals[0]?.subject ?? '',
        signalsExtracted: batch.signals.length,
        tierUsed: 'tier1',
        processingMs: 0,
        webhookReceivedAt: batch.webhookReceivedAt,
        pwaSyncedAt: new Date().toISOString(),
        status: 'synced',
      })
    }

    if (stored > 0) {
      localStorage.setItem(SYNC_KEY, new Date().toISOString())
    }

    return stored
  } catch (err) {
    console.error('[Monica OS] Signal sync failed:', err)
    return 0
  }
}

export function shouldSync(): boolean {
  try {
    const last = localStorage.getItem(SYNC_KEY)
    if (!last) return true
    return Date.now() - new Date(last).getTime() > SYNC_INTERVAL_MS
  } catch {
    return true
  }
}