export type SignalStatus = 'pending' | 'accepted' | 'dismissed' | 'expired'
export type SignalDestination = 'task' | 'calendar' | 'followup' | 'tracker' | 'note' | 'skip'
export type SignalSource = 'email' | 'capture' | 'manual'
export type RiskLevel = 'none' | 'low' | 'medium' | 'high'

export interface ExecutiveSignal {
  id?: number
  batchId: string
  source: SignalSource
  senderEmail: string
  senderName: string
  subject: string
  bodyExcerpt: string
  confidence: number
  status: SignalStatus
  suggestedDestination: SignalDestination
  impact: string[]
  riskLevel: RiskLevel
  conflictDetail?: string
  learningPatternId?: number
  createdWorkItemId?: number
  createdWorkItemType?: string
  receivedAt: string
  createdAt: string
  acceptedAt?: string
  dismissedAt?: string
  reviewedAt?: string
}

export interface SignalLearningPattern {
  id?: number
  patternType: 'sender' | 'domain' | 'keyword'
  patternValue: string
  learnedDestination: SignalDestination
  confidenceOverride: number
  singleTapEnabled: boolean
  activationCount: number
  correctCount: number
  createdAt: string
  lastTriggeredAt?: string
}

export interface SignalReviewHistory {
  id?: number
  signalId: number
  originalSuggestion: SignalDestination
  finalDestination: SignalDestination
  outcome: 'accepted' | 'reassigned' | 'dismissed' | 'skip_learned'
  responseMs: number
  confidenceAtReview: number
  reviewedAt: string
}

export interface SignalBatchHistory {
  id: string
  senderEmail: string
  subject: string
  signalsExtracted: number
  tierUsed: 'tier1' | 'tier2' | 'pattern'
  processingMs: number
  webhookReceivedAt: string
  pwaSyncedAt?: string
  status: 'queued' | 'synced' | 'failed'
}

export interface SignalTrustMetrics {
  id?: number
  weekStart: string
  totalSignals: number
  acceptedWithoutChange: number
  reassigned: number
  dismissed: number
  accuracyPct: number
  calendarCount: number
  taskCount: number
  followUpCount: number
  trackerCount: number
  noteCount: number
  patternsLearned: number
  narrative: string
  computedAt: string
}