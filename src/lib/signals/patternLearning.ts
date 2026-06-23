import { db } from '@/lib/db'
import { SignalDestination } from './types'
import { nowISO } from '@/lib/utils'

export interface LearningProposal {
  senderEmail: string
  senderName: string
  destination: SignalDestination
  count: number
}

export async function getPendingLearningProposals(): Promise<LearningProposal[]> {
  const settings = await db.settings.toArray()
  const proposals: LearningProposal[] = []

  for (const setting of settings) {
    if (setting.key.startsWith('learning_suggestion_')) {
      try {
        const data = JSON.parse(setting.value)
        proposals.push(data)
      } catch {}
    }
  }
  return proposals
}

export async function acceptLearningPattern(proposal: LearningProposal): Promise<void> {
  const now = nowISO()

  const existing = await db.signal_learning_patterns
    .where('[patternType+patternValue]')
    .equals(['sender', proposal.senderEmail])
    .first()

  if (existing) {
    await db.signal_learning_patterns.update(existing.id!, {
      learnedDestination: proposal.destination,
      singleTapEnabled: true,
      lastTriggeredAt: now,
    })
  } else {
    await db.signal_learning_patterns.add({
      patternType: 'sender',
      patternValue: proposal.senderEmail,
      learnedDestination: proposal.destination,
      confidenceOverride: 0.92,
      singleTapEnabled: true,
      activationCount: proposal.count,
      correctCount: proposal.count,
      createdAt: now,
      lastTriggeredAt: now,
    })
  }

  // Remove the pending proposal
  await db.settings.delete(`learning_suggestion_${proposal.senderEmail}`)
}

export async function ignoreLearningPattern(senderEmail: string): Promise<void> {
  await db.settings.delete(`learning_suggestion_${senderEmail}`)
}

export async function applyPatternToSignal(
  senderEmail: string,
  subject: string
): Promise<{ destination: SignalDestination; confidence: number; singleTap: boolean } | null> {
  const now = nowISO()

  // Check sender pattern
  const senderPattern = await db.signal_learning_patterns
    .where('[patternType+patternValue]')
    .equals(['sender', senderEmail])
    .first()

  if (senderPattern) {
    await db.signal_learning_patterns.update(senderPattern.id!, {
      activationCount: senderPattern.activationCount + 1,
      lastTriggeredAt: now,
    })
    return {
      destination: senderPattern.learnedDestination,
      confidence: senderPattern.confidenceOverride,
      singleTap: senderPattern.singleTapEnabled,
    }
  }

  // Check domain pattern
  const domain = senderEmail.split('@')[1]
  if (domain) {
    const domainPattern = await db.signal_learning_patterns
      .where('[patternType+patternValue]')
      .equals(['domain', domain])
      .first()

    if (domainPattern) {
      return {
        destination: domainPattern.learnedDestination,
        confidence: domainPattern.confidenceOverride,
        singleTap: domainPattern.singleTapEnabled,
      }
    }
  }

  return null
}