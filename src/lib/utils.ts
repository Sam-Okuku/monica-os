import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function todayDate(): string {
  const d = new Date()
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

export function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  } catch {
    return ''
  }
}

export function hoursAgo(iso: string): number {
  try {
    return Math.abs((Date.now() - new Date(iso).getTime()) / 3600000)
  } catch {
    return 0
  }
}

export function isOverdue(iso: string): boolean {
  try {
    return new Date(iso).getTime() < Date.now()
  } catch {
    return false
  }
}

export function getFollowUpAgeColor(sentAt: string, expectedBy?: string): string {
  const hours = hoursAgo(sentAt)
  if (expectedBy && isOverdue(expectedBy)) return 'text-red-500'
  if (hours >= 36) return 'text-red-500'
  if (hours >= 24) return 'text-amber-500'
  return 'text-emerald-600'
}

export function getGreeting(name: string = 'Monica'): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

export function getDayForecast(taskCount: number, followUpCount: number): {
  label: string
  color: string
  load: number
} {
  const total = taskCount + followUpCount * 1.5
  if (total <= 5) return { label: 'Clear day ahead', color: 'text-emerald-600', load: 25 }
  if (total <= 10) return { label: 'Moderate load', color: 'text-blue-600', load: 55 }
  if (total <= 16) return { label: 'Busy day', color: 'text-amber-600', load: 75 }
  return { label: 'Heavy load', color: 'text-red-500', load: 95 }
}

export function autoTagCapture(content: string): string {
  const lower = content.toLowerCase()
  if (lower.includes('follow up') || lower.includes('chase') || lower.includes('waiting')) return 'follow-up'
  if (lower.includes('said') || lower.includes('mentioned') || lower.includes('verbal') || lower.includes('told me')) return 'verbal'
  if (lower.includes('meeting') || lower.includes('notes') || lower.includes('discussed')) return 'note'
  if (lower.includes('idea') || lower.includes('consider') || lower.includes('maybe')) return 'idea'
  return 'task'
}