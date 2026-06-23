import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!upstashUrl || !upstashToken) {
    return NextResponse.json({ batches: [], message: 'Upstash not configured' })
  }

  // Pop up to 20 items from queue
  const results: string[] = []
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${upstashUrl}/rpop/signal_queue`, {
      headers: { Authorization: `Bearer ${upstashToken}` },
    })
    const data = await res.json()
    if (!data.result) break
    results.push(data.result)
  }

  const batches = results.map(r => {
    try { return JSON.parse(r) } catch { return null }
  }).filter(Boolean)

  return NextResponse.json({ batches, count: batches.length })
}