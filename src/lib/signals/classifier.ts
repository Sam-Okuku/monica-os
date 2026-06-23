import { SignalDestination, RiskLevel, ExecutiveSignal } from './types'
import { applyPatternToSignal } from './patternLearning'
import { nowISO } from '@/lib/utils'

export interface ClassificationInput {
  senderEmail: string
  senderName: string
  subject: string
  bodyExcerpt: string
  receivedAt: string
  hasIcsAttachment: boolean
}

export interface ClassifiedSignal {
  senderEmail: string
  senderName: string
  subject: string
  bodyExcerpt: string
  suggestedDestination: SignalDestination
  confidence: number
  impact: string[]
  riskLevel: RiskLevel
  conflictDetail?: string
}

const DATE_PATTERNS = [
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(today|tomorrow|next week|this week)\b/i,
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}\b/,
  /\b\d{1,2}(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i,
]

const TIME_PATTERNS = [
  /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
  /\b\d{1,2}\s*(am|pm)\b/i,
]

const MEETING_KEYWORDS = [
  'meet', 'meeting', 'call', 'chat', 'coffee', 'lunch', 'dinner',
  'schedule', 'calendar', 'appointment', 'discuss', 'sync', 'catch up',
  'zoom', 'teams', 'google meet', 'conference', 'webinar',
]

const TASK_KEYWORDS = [
  'please', 'can you', 'could you', 'kindly', 'i need', 'we need',
  'prepare', 'send', 'complete', 'finish', 'submit', 'review',
  'action required', 'action needed', 'by', 'before', 'deadline', 'due',
  'attached', 'draft', 'create', 'update', 'check',
]

const FOLLOWUP_KEYWORDS = [
  'following up', 'follow up', 'follow-up', 'checking in',
  'any update', 'any news', 'status update', 'circling back',
  'just wanted', 'wanted to check', 'reminder', 'as discussed',
  'per our conversation', 'regarding my previous',
]

const TRACKER_KEYWORDS = [
  'update on', 'status of', 'progress on', 'tracking',
  'project update', 'milestone', 'report on', 'regarding the',
  'deal', 'contract', 'shipment', 'order', 'delivery',
]

const SKIP_PATTERNS = [
  /no-reply@/i, /noreply@/i, /notifications@/i, /mailer@/i,
  /newsletter@/i, /updates@/i, /donotreply@/i, /automated@/i,
]

const SKIP_SUBJECT_PATTERNS = [
  /^(re:|fwd:|fw:)\s*/i, // Might be legitimate, lower confidence only
]

const SKIP_BODY_KEYWORDS = [
  'unsubscribe', 'view in browser', 'this is an automated',
  'you are receiving this', 'opt out', 'manage preferences',
]

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

function hasDateOrTime(text: string): boolean {
  return DATE_PATTERNS.some(p => p.test(text)) || TIME_PATTERNS.some(p => p.test(text))
}

function isAutoSender(email: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(email))
}

function tier1Classify(input: ClassificationInput): {
  destination: SignalDestination
  confidence: number
  impact: string[]
  riskLevel: RiskLevel
} {
  const text = `${input.subject} ${input.bodyExcerpt}`.toLowerCase()
  const impact: string[] = []
  let riskLevel: RiskLevel = 'none'

  // Auto-sender: always skip
  if (isAutoSender(input.senderEmail)) {
    return { destination: 'skip', confidence: 0.97, impact: ['Automated sender'], riskLevel: 'none' }
  }

  // Spam/newsletter body patterns
  if (containsAny(input.bodyExcerpt, SKIP_BODY_KEYWORDS)) {
    return { destination: 'skip', confidence: 0.95, impact: ['Newsletter/automated email'], riskLevel: 'none' }
  }

  // ICS attachment = calendar (very high confidence)
  if (input.hasIcsAttachment) {
    impact.push('Calendar invitation attached')
    impact.push('Requires calendar slot')
    return { destination: 'calendar', confidence: 0.97, impact, riskLevel: 'none' }
  }

  // Meeting request = calendar
  const hasMeetingKeyword = containsAny(text, MEETING_KEYWORDS)
  const hasTemporal = hasDateOrTime(text)

  if (hasMeetingKeyword && hasTemporal) {
    impact.push('Meeting or call requested')
    if (hasTemporal) impact.push('Specific time mentioned — requires calendar slot')
    return { destination: 'calendar', confidence: 0.88, impact, riskLevel: 'none' }
  }

  // Follow-up language
  if (containsAny(text, FOLLOWUP_KEYWORDS)) {
    impact.push('Follow-up or status check from sender')
    impact.push('Existing thread likely open')
    return { destination: 'followup', confidence: 0.89, impact, riskLevel: 'low' }
  }

  // Task request
  if (containsAny(text, TASK_KEYWORDS)) {
    impact.push('Action or delivery requested')
    if (hasTemporal) {
      impact.push('Deadline mentioned')
      riskLevel = 'medium'
    }
    return { destination: 'task', confidence: 0.84, impact, riskLevel }
  }

  // Tracker / project update
  if (containsAny(text, TRACKER_KEYWORDS)) {
    impact.push('Project or operational update')
    return { destination: 'tracker', confidence: 0.78, impact, riskLevel: 'none' }
  }

  // Meeting keyword without date → still might be calendar, lower confidence
  if (hasMeetingKeyword) {
    impact.push('Meeting reference — no specific time provided')
    return { destination: 'calendar', confidence: 0.65, impact, riskLevel: 'none' }
  }

  // Default: informational → note
  return { destination: 'note', confidence: 0.60, impact: ['Informational email — saved for reference'], riskLevel: 'none' }
}

async function tier2Classify(input: ClassificationInput): Promise<{
  destination: SignalDestination
  confidence: number
  impact: string[]
} | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return null

  const prompt = `You are an email classifier for an executive assistant named Monica. 
Classify this email into the most appropriate destination. Return ONLY valid JSON.

Email:
From: ${input.senderName} <${input.senderEmail}>
Subject: ${input.subject}
Body excerpt: ${input.bodyExcerpt.slice(0, 400)}

Return JSON: { "destination": "calendar|task|followup|tracker|note|skip", "confidence": 0.0-1.0, "impact": ["string array of 1-3 impact points"] }
Destinations: calendar=meeting/scheduling, task=action required, followup=waiting for response, tracker=project update, note=FYI/reference, skip=automated/noise`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
        }),
      }
    )

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.destination && parsed.confidence) {
      return {
        destination: parsed.destination as SignalDestination,
        confidence: Math.min(Math.max(parsed.confidence, 0), 1),
        impact: Array.isArray(parsed.impact) ? parsed.impact : [],
      }
    }
  } catch (e) {
    console.error('Tier 2 classification failed:', e)
  }
  return null
}

export async function classifySignals(input: ClassificationInput): Promise<ClassifiedSignal[]> {
  const signals: ClassifiedSignal[] = []

  // Check learning patterns first
  const pattern = await applyPatternToSignal(input.senderEmail, input.subject).catch(() => null)

  let destination: SignalDestination
  let confidence: number
  let impact: string[]
  let riskLevel: RiskLevel

  if (pattern && pattern.destination !== 'skip') {
    destination = pattern.destination
    confidence = pattern.confidence
    impact = [`Learned pattern: ${input.senderName} → ${destination}`]
    riskLevel = 'none'
  } else if (pattern?.destination === 'skip') {
    return [] // Learned skip — emit nothing
  } else {
    const tier1 = tier1Classify(input)
    destination = tier1.destination
    confidence = tier1.confidence
    impact = tier1.impact
    riskLevel = tier1.riskLevel

    // Escalate to Tier 2 if ambiguous
    if (confidence < 0.75) {
      const tier2 = await tier2Classify(input).catch(() => null)
      if (tier2 && tier2.confidence > confidence) {
        destination = tier2.destination
        confidence = tier2.confidence
        impact = tier2.impact
      }
    }
  }

  // Skip signals below minimum confidence or skip destination
  if (destination === 'skip' || confidence < 0.55) {
    return []
  }

  signals.push({
    senderEmail: input.senderEmail,
    senderName: input.senderName,
    subject: input.subject,
    bodyExcerpt: input.bodyExcerpt,
    suggestedDestination: destination,
    confidence,
    impact,
    riskLevel,
  })

  return signals
}
