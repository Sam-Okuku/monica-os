import { NextRequest, NextResponse } from 'next/server'
import { classifySignals } from '@/lib/signals/classifier'
import { createHmac } from 'crypto'

// Node.js runtime — required for crypto module
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
  const rawBody = await req.text()
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

  const senderMatch = payload.sender.match(/^(.+?)\s*<(.+?)>$/)
  const senderName = payload.senderName ?? (senderMatch ? senderMatch[1].trim() : payload.sender)
  const senderEmail = senderMatch ? senderMatch[2].trim() : payload.sender

  try {
    const signals = await classifySignals({
      senderEmail,
      senderName,
      subject: payload.subject,
      bodyExcerpt: payload.body.slice(0, 600),
      receivedAt: payload.receivedAt ?? new Date().toISOString(),
      hasIcsAttachment: payload.hasIcsAttachment ?? false,
    })

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (upstashUrl && upstashToken && signals.length > 0) {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const batch = {
        batchId,
        signals,
        webhookReceivedAt: new Date().toISOString(),
      }

      await fetch(`${upstashUrl}/lpush/signal_queue`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([JSON.stringify(batch)]),
      })

      return NextResponse.json({ success: true, batchId, signalsExtracted: signals.length })
    }

    return NextResponse.json({ success: true, signals, signalsExtracted: signals.length })
  } catch (err) {
    console.error('Signal ingestion error:', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}