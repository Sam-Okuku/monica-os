// Simple in-memory signal queue
// Persists within the same serverless function instance
// Works for single-user PWA without any external database

interface QueuedBatch {
  batchId: string
  signals: Record<string, unknown>[]
  webhookReceivedAt: string
}

const queue: QueuedBatch[] = []
const MAX_QUEUE_SIZE = 100

export function enqueueSignalBatch(batch: QueuedBatch): void {
  queue.unshift(batch)
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(MAX_QUEUE_SIZE)
  }
}

export function dequeueSignalBatches(count = 20): QueuedBatch[] {
  return queue.splice(0, Math.min(count, queue.length))
}

export function peekQueue(): number {
  return queue.length
}