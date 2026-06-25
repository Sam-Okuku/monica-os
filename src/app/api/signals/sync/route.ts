import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!upstashUrl || !upstashToken) {
    return NextResponse.json({ batches: [], count: 0, message: 'Upstash not configured' })
  }

  const batches: unknown[] = []

  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${upstashUrl}/rpop/signal_queue`, {
        headers: { Authorization: `Bearer ${upstashToken}` },
      })
      const data = await res.json()
      if (!data.result) break
      const parsed = JSON.parse(data.result)
      batches.push(parsed)
    } catch {
      break
    }
  }

  return NextResponse.json({ batches, count: batches.length })
}