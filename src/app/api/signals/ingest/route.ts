import { NextRequest, NextResponse } from 'next/server'
import { classifySignals } from '@/lib/signals/classifier'
import { createHmac } from 'crypto'

export const runtime = 'nodejs'

interface IngestPayload {
  sender: string
  senderName?: string
  subject: string
  body: string
  receivedAt?: string
  hasIcsAttachment?: boolean
  threadId?: string
}

function verifyHmac(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(payload).digest('hex')
    return expected === signature
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 })
  }

  const secret = process.env.SIGNAL_WEBHOOK_SECRET
  if (secret) {
    const signature = req.headers.get('x-monica-signature') ?? ''
    if (!verifyHmac(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let payload: IngestPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.sender || !payload.subject || !payload.body) {
    return NextResponse.json(
      { error: 'Missing required fields: sender, subject, body' },
      { status: 400 }
    )
  }

  // Parse sender name from "Name <email>" format
  const senderMatch = payload.sender.match(/^(.+?)\s*<(.+?)>$/)
  const senderName = payload.senderName ?? (senderMatch ? senderMatch[1].trim() : payload.sender)
  const senderEmail = senderMatch ? senderMatch[2].trim() : payload.sender

  try {
    const classified = await classifySignals({
      senderEmail,
      senderName,
      subject: payload.subject,
      bodyExcerpt: payload.body.slice(0, 600),
      receivedAt: payload.receivedAt ?? new Date().toISOString(),
      hasIcsAttachment: payload.hasIcsAttachment ?? false,
    })

    if (classified.length === 0) {
      return NextResponse.json({ success: true, signalsExtracted: 0, message: 'Email classified as noise — skipped' })
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()

    // Build the full signal objects ready for IndexedDB
    const signals = classified.map(c => ({
      batchId,
      source: 'email' as const,
      senderEmail: c.senderEmail,
      senderName: c.senderName,
      subject: c.subject,
      bodyExcerpt: c.bodyExcerpt,
      confidence: c.confidence,
      status: 'pending' as const,
      suggestedDestination: c.suggestedDestination,
      impact: c.impact,
      riskLevel: c.riskLevel,
      conflictDetail: c.conflictDetail,
      receivedAt: payload.receivedAt ?? now,
      createdAt: now,
    }))

    // Try Upstash queue if configured
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (upstashUrl && upstashToken) {
      try {
        await fetch(`${upstashUrl}/lpush/signal_queue`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${upstashToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([JSON.stringify({ batchId, signals, webhookReceivedAt: now })]),
        })
      } catch (e) {
        console.error('Upstash write failed:', e)
        // Continue — return signals directly as fallback
      }
    }

    // Always return signals in response so client can store directly
    return NextResponse.json({
      success: true,
      batchId,
      signalsExtracted: signals.length,
      signals,
    })

  } catch (err) {
    console.error('Signal processing error:', err)
    return NextResponse.json({ error: 'Processing failed', detail: String(err) }, { status: 500 })
  }
}