import { db, Task, FollowUp, CalendarEvent, Note, Capture } from './db'
import { nowISO, todayDate } from './utils'

// ── Tasks ──────────────────────────────────────────────

export async function getTodaysTasks() {
  return db.tasks.where('status').equals('pending').toArray()
}

export async function getAllTasks() {
  return db.tasks.orderBy('created_at').reverse().toArray()
}

export async function getTasksCompletedToday() {
  const today = todayDate()
  const all = await db.tasks.where('status').equals('done').toArray()
  return all.filter(t => t.completed_at?.startsWith(today))
}

export async function createTask(data: Omit<Task, 'id' | 'created_at'>) {
  return db.tasks.add({ ...data, created_at: nowISO() })
}

export async function completeTask(id: number) {
  return db.tasks.update(id, { status: 'done', completed_at: nowISO() })
}

export async function uncompleteTask(id: number) {
  return db.tasks.update(id, { status: 'pending', completed_at: undefined })
}

export async function deferTask(id: number) {
  return db.tasks.update(id, { status: 'deferred' })
}

export async function deleteTask(id: number) {
  return db.tasks.delete(id)
}

export async function updateTask(id: number, data: Partial<Task>) {
  return db.tasks.update(id, data)
}

// ── Follow-ups ─────────────────────────────────────────

export async function getActiveFollowUps() {
  return db.follow_ups.where('status').anyOf(['waiting', 'nudged']).toArray()
}

export async function getAllFollowUps() {
  return db.follow_ups.orderBy('sent_at').reverse().toArray()
}

export async function createFollowUp(data: Omit<FollowUp, 'id'>) {
  return db.follow_ups.add(data)
}

export async function resolveFollowUp(id: number) {
  return db.follow_ups.update(id, { status: 'resolved', resolved_at: nowISO() })
}

export async function nudgeFollowUp(id: number) {
  return db.follow_ups.update(id, { status: 'nudged' })
}

export async function deferFollowUp(id: number) {
  return db.follow_ups.update(id, { status: 'deferred' })
}

export async function deleteFollowUp(id: number) {
  return db.follow_ups.delete(id)
}

// ── Events ─────────────────────────────────────────────

export async function getTodaysEvents() {
  const today = todayDate()
  const all = await db.events.toArray()
  return all
    .filter(e => e.starts_at.startsWith(today) && e.lifecycle !== 'cancelled' && e.lifecycle !== 'archived')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}

export async function getAllEvents() {
  return db.events.orderBy('starts_at').toArray()
}

export async function createEvent(data: Omit<CalendarEvent, 'id'>) {
  return db.events.add({ ...data, lifecycle: data.lifecycle ?? 'active' })
}

export async function updateEvent(id: number, data: Partial<CalendarEvent>) {
  return db.events.update(id, data)
}

export async function deleteEvent(id: number) {
  return db.events.delete(id)
}

// ── Notes ──────────────────────────────────────────────

export async function getAllNotes() {
  return db.notes.orderBy('created_at').reverse().toArray()
}

export async function createNote(data: Omit<Note, 'id' | 'created_at' | 'updated_at'>) {
  const now = nowISO()
  return db.notes.add({ ...data, created_at: now, updated_at: now })
}

export async function updateNote(id: number, data: Partial<Note>) {
  return db.notes.update(id, { ...data, updated_at: nowISO() })
}

export async function deleteNote(id: number) {
  return db.notes.delete(id)
}

// ── Captures ───────────────────────────────────────────

export async function getRawCaptures() {
  return db.captures.where('status').equals('raw').reverse().sortBy('captured_at')
}

export async function getAllCaptures() {
  return db.captures.orderBy('captured_at').reverse().toArray()
}

export async function createCapture(data: Omit<Capture, 'id' | 'captured_at'>) {
  return db.captures.add({ ...data, captured_at: nowISO() })
}

export async function processCapture(id: number) {
  return db.captures.update(id, { status: 'processed' })
}

export async function dismissCapture(id: number) {
  return db.captures.update(id, { status: 'dismissed' })
}

// ── Executives ─────────────────────────────────────────

export async function getAllExecutives() {
  return db.executives.toArray()
}

export async function updateExecutiveEnergy(id: number, energy: string) {
  return db.executives.update(id, { energy_today: energy as any })
}

// ── Settings ───────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const record = await db.settings.get(key)
  return record?.value ?? null
}

export async function setSetting(key: string, value: string) {
  return db.settings.put({ key, value })
}

// ── Readiness ──────────────────────────────────────────

export async function computeReadiness(): Promise<number> {
  const tasks = await getTodaysTasks()
  const events = await getTodaysEvents()
  const followUps = await getActiveFollowUps()

  if (tasks.length === 0 && events.length === 0) return 100

  let score = 100
  const urgentPending = tasks.filter(t => t.priority === 'urgent').length
  const unpreparedMeetings = events.filter(e => e.prep_needed && !e.brief_sent).length
  const dangerFollowUps = followUps.filter(f => {
    const hours = Math.abs((Date.now() - new Date(f.sent_at).getTime()) / 3600000)
    return hours >= 36
  }).length

  score -= urgentPending * 12
  score -= unpreparedMeetings * 8
  score -= dangerFollowUps * 6

  return Math.max(0, Math.min(100, Math.round(score)))
}

export async function getStreakCount(): Promise<number> {
  const setting = await getSetting('streak_count')
  return parseInt(setting ?? '0', 10)
}

export async function getShieldsRemaining(): Promise<number> {
  const setting = await getSetting('shields_remaining')
  return parseInt(setting ?? '2', 10)
}