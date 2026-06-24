import { db } from '@/lib/db'
import { ExecutiveSignal, SignalDestination } from './types'
import { nowISO, todayDate } from '@/lib/utils'

export async function acceptSignal(
  signal: ExecutiveSignal,
  destination: SignalDestination,
  responseMs: number
): Promise<void> {
  const outcome = destination === signal.suggestedDestination ? 'accepted' : 'reassigned'
  const now = nowISO()

  let createdId: number | undefined
  let createdType: string | undefined

  if (destination === 'task') {
    createdId = await db.tasks.add({
      title: signal.subject,
      status: 'pending',
      priority:
        signal.riskLevel === 'high'
          ? 'urgent'
          : signal.riskLevel === 'medium'
          ? 'high'
          : 'normal',
      category: 'exec',
      is_boss_priority: false,
      source: 'manual',          // ← fixed: 'email' is not in the Task source union
      created_at: now,
    })
    createdType = 'tasks'
  }

  if (destination === 'calendar') {
    createdId = await db.events.add({
      title: signal.subject,
      event_type: 'meeting',
      starts_at: now,
      ends_at: now,
      prep_needed: true,
      brief_sent: false,
      is_shadow: false,
      lifecycle: 'active',
      notes: `Signal from ${signal.senderName}: ${signal.bodyExcerpt}`,
    })
    createdType = 'events'
  }

  if (destination === 'followup') {
    createdId = await db.follow_ups.add({
      contact_name: signal.senderName,
      context: signal.subject,
      channel: 'email',
      sent_at: signal.receivedAt,
      status: 'waiting',
      confidence: Math.round(signal.confidence * 5),
    })
    createdType = 'follow_ups'
  }

  if (destination === 'note') {
    createdId = await db.notes.add({
      title: signal.subject,
      content: signal.bodyExcerpt,
      action_items: '[]',
      created_at: now,
      updated_at: now,
    })
    createdType = 'notes'
  }

  // destination === 'tracker' or 'skip': no item created automatically

  await db.executive_signals.update(signal.id!, {
    status: 'accepted',
    acceptedAt: now,
    reviewedAt: now,
    createdWorkItemId: createdId,
    createdWorkItemType: createdType,
  })

  await db.signal_review_history.add({
    signalId: signal.id!,
    originalSuggestion: signal.suggestedDestination,
    finalDestination: destination,
    outcome,
    responseMs,
    confidenceAtReview: signal.confidence,
    reviewedAt: now,
  })

  await checkLearningPattern(signal, destination)
}

export async function dismissSignal(
  signal: ExecutiveSignal,
  learnSkip: boolean,
  responseMs: number
): Promise<void> {
  const now = nowISO()

  await db.executive_signals.update(signal.id!, {
    status: 'dismissed',
    dismissedAt: now,
    reviewedAt: now,
  })

  await db.signal_review_history.add({
    signalId: signal.id!,
    originalSuggestion: signal.suggestedDestination,
    finalDestination: 'skip',
    outcome: learnSkip ? 'skip_learned' : 'dismissed',
    responseMs,
    confidenceAtReview: signal.confidence,
    reviewedAt: now,
  })

  if (learnSkip) {
    const existing = await db.signal_learning_patterns
      .where('[patternType+patternValue]')
      .equals(['sender', signal.senderEmail])
      .first()

    if (!existing) {
      await db.signal_learning_patterns.add({
        patternType: 'sender',
        patternValue: signal.senderEmail,
        learnedDestination: 'skip',
        confidenceOverride: 0.97,
        singleTapEnabled: false,
        activationCount: 1,
        correctCount: 1,
        createdAt: now,
        lastTriggeredAt: now,
      })
    }
  }
}

async function checkLearningPattern(
  signal: ExecutiveSignal,
  destination: SignalDestination
): Promise<void> {
  const allSignals = await db.executive_signals
    .where('senderEmail')
    .equals(signal.senderEmail)
    .toArray()

  const senderSignalIds = new Set(allSignals.map(s => s.id!))

  const history = await db.signal_review_history.toArray()
  const acceptedToSameDestination = history.filter(
    h =>
      senderSignalIds.has(h.signalId) &&
      h.finalDestination === destination &&
      (h.outcome === 'accepted' || h.outcome === 'reassigned')
  ).length

  if (acceptedToSameDestination >= 4) {
    const existing = await db.signal_learning_patterns
      .where('[patternType+patternValue]')
      .equals(['sender', signal.senderEmail])
      .first()

    if (!existing) {
      try {
        await db.settings.put({
          key: `learning_suggestion_${signal.senderEmail}`,
          value: JSON.stringify({
            senderEmail: signal.senderEmail,
            senderName: signal.senderName,
            destination,
            count: acceptedToSameDestination + 1,
          }),
        })
      } catch {}
    }
  }
}