import { FollowUp, CalendarEvent } from './db'

export function hoursBetween(iso: string, nowMs: number): number {
  try {
    return Math.abs((nowMs - new Date(iso).getTime()) / 3600000)
  } catch {
    return 0
  }
}

export function countDangerFollowUps(followUps: FollowUp[], now: number): number {
  return followUps.filter(f => hoursBetween(f.sent_at, now) >= 36).length
}

export function isActiveEvent(event: CalendarEvent, now: number): boolean {
  return event.lifecycle === 'active' && new Date(event.ends_at).getTime() >= now
}

export function isPastActiveEvent(event: CalendarEvent, now: number): boolean {
  return (
    event.lifecycle === 'active' &&
    new Date(event.ends_at).getTime() < now &&
    event.ends_at !== event.starts_at
  )
}