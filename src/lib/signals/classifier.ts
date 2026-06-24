import { SignalDestination, RiskLevel } from './types'

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

const MEETING_KEYWORDS = [
  'meet', 'meeting', 'call', 'chat', 'coffee', 'lunch', 'dinner',
  'schedule', 'calendar', 'appointment', 'discuss', 'sync', 'catch up',
  'zoom', 'teams', 'google meet', 'conference', 'webinar',
]

const TASK_KEYWORDS = [
  'please', 'can you', 'could you', 'kindly', 'i need', 'we need',
  'prepare', 'send', 'complete', 'finish', 'submit', 'review',
  'action required', 'action needed', 'by', 'before', 'deadline', 'due',
  'draft', 'create', 'update', 'check', 'attached',
]

const FOLLOWUP_KEYWORDS = [
  'following up', 'follow up', 'follow-up', 'checking in',
  'any update', 'any news', 'status update', 'circling back',
  'just wanted', 'wanted to check', 'reminder', 'as discussed',
  'per our conversation', 'regarding my previous',
]

const TRACKER_KEYWORDS = [
  'update on', 'status of', 'progress on', 'tracking',
  'project update', 'milestone', 'report on',
  'deal', 'contract', 'shipment', 'order', 'delivery',
]

const SKIP_SENDER_PATTERNS = [
  /no-reply@/i, /noreply@/i, /notifications@/i, /mailer@/i,
  /newsletter@/i, /updates@/i, /donotreply@/i, /automated@/i,
]

const SKIP_BODY_KEYWORDS = [
  'unsubscribe', 'view in browser', 'this is an automated',
  'you are receiving this', 'opt out', 'manage preferences',
]

const DATE_PATTERNS = [
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(today|tomorrow|next week|this week)\b/i,
  /\b\d{1,2}[\/\-]\d{1,2}/,
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/i,
]

const TIME_PATTERNS = [
  /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
  /\b\d{1,2}\s*(am|pm)\b/i,
]

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(kw => lower.includes(kw.toLowerCase()))
}

function hasDateOrTime(text: string): boolean {
  return DATE_PATTERNS.some(p => p.test(text)) || TIME_PATTERNS.some(p => p.test(text))
}

function tier1Classify(input: ClassificationInput): ClassifiedSignal {
  const text = `${input.subject} ${input.bodyExcerpt}`
  const impact: string[] = []
  let riskLevel: RiskLevel = 'none'

  // Auto-sender skip
  if (SKIP_SENDER_PATTERNS.some(p => p.test(input.senderEmail))) {
    return { ...input, suggestedDestination: 'skip', confidence: 0.97, impact: ['Automated sender'], riskLevel: 'none' }
  }

  // Newsletter/spam body
  if (containsAny(input.bodyExcerpt, SKIP_BODY_KEYWORDS)) {
    return { ...input, suggestedDestination: 'skip', confidence: 0.95, impact: ['Newsletter or automated email'], riskLevel: 'none' }
  }

  // ICS attachment → calendar (highest confidence)
  if (input.hasIcsAttachment) {
    return {
      ...input,
      suggestedDestination: 'calendar',
      confidence: 0.97,
      impact: ['Calendar invitation attached', 'Requires calendar slot'],
      riskLevel: 'none',
    }
  }

  const hasMeeting = containsAny(text, MEETING_KEYWORDS)
  const hasTemporal = hasDateOrTime(text)

  // Meeting + time = calendar
  if (hasMeeting && hasTemporal) {
    impact.push('Meeting or call requested')
    impact.push('Specific time mentioned — requires calendar slot')
    return { ...input, suggestedDestination: 'calendar', confidence: 0.88, impact, riskLevel: 'none' }
  }

  // Follow-up language
  if (containsAny(text, FOLLOWUP_KEYWORDS)) {
    impact.push('Follow-up or status check from sender')
    impact.push('Existing thread likely open')
    return { ...input, suggestedDestination: 'followup', confidence: 0.89, impact, riskLevel: 'low' }
  }

  // Task request
  if (containsAny(text, TASK_KEYWORDS)) {
    impact.push('Action or delivery requested')
    if (hasTemporal) {
      impact.push('Deadline mentioned')
      riskLevel = 'medium'
    }
    return { ...input, suggestedDestination: 'task', confidence: 0.84, impact, riskLevel }
  }

  // Tracker / project update
  if (containsAny(text, TRACKER_KEYWORDS)) {
    impact.push('Project or operational update')
    return { ...input, suggestedDestination: 'tracker', confidence: 0.78, impact, riskLevel: 'none' }
  }

  // Meeting keyword without time
  if (hasMeeting) {
    impact.push('Meeting reference — no specific time provided')
    return { ...input, suggestedDestination: 'calendar', confidence: 0.65, impact, riskLevel: 'none' }
  }

  // Default: note
  return {
    ...input,
    suggestedDestination: 'note',
    confidence: 0.60,
    impact: ['Informational email — saved for reference'],
    riskLevel: 'none',
  }
}

async function tier2Classify(input: ClassificationInput): Promise<Partial<ClassifiedSignal> | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return null

  const prompt = `You are an email classifier for an executive assistant named Monica.
Classify this email. Return ONLY valid JSON, no markdown.

From: ${input.senderName} <${input.senderEmail}>
Subject: ${input.subject}
Body: ${input.bodyExcerpt.slice(0, 400)}

Return: {"destination":"calendar|task|followup|tracker|note|skip","confidence":0.0-1.0,"impact":["up to 3 impact points"]}
- calendar: meeting/scheduling request
- task: action required from Monica
- followup: waiting on a response
- tracker: project/deal status update
- note: informational/reference only
- skip: automated/newsletter/noise`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.1 },
        }),
      }
    )

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    if (parsed.destination && typeof parsed.confidence === 'number') {
      return {
        suggestedDestination: parsed.destination as SignalDestination,
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
  const result = tier1Classify(input)

  // Skip if sender is automated or below minimum confidence
  if (result.suggestedDestination === 'skip') return []
  if (result.confidence < 0.55) return []

  // Try Tier 2 if ambiguous
  if (result.confidence < 0.75) {
    const tier2 = await tier2Classify(input).catch(() => null)
    if (tier2 && typeof tier2.confidence === 'number' && tier2.confidence > result.confidence) {
      return [{
        ...result,
        suggestedDestination: tier2.suggestedDestination ?? result.suggestedDestination,
        confidence: tier2.confidence,
        impact: tier2.impact ?? result.impact,
      }]
    }
  }

  return [result]
}