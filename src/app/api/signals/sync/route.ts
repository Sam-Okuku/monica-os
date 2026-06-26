import { NextResponse } from 'next/server'
import { dequeueSignalBatches, peekQueue } from '@/lib/signals/serverQueue'

export const runtime = 'nodejs'

export async function GET() {
  // First try Upstash if configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (upstashUrl && upstashToken) {
    const batches: unknown[] = []
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`${upstashUrl}/rpop/signal_queue`, {
          headers: { Authorization: `Bearer ${upstashToken}` },
        })
        const data = await res.json()
        if (!data.result) break
        batches.push(JSON.parse(data.result))
      } catch {
        break
      }
    }
    if (batches.length > 0) {
      return NextResponse.json({ batches, count: batches.length, source: 'upstash' })
    }
  }

  // Fall back to in-memory queue
  const batches = dequeueSignalBatches(20)
  return NextResponse.json({
    batches,
    count: batches.length,
    source: 'memory',
    remaining: peekQueue(),
  })
}