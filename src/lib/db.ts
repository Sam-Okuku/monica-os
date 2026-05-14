import Dexie, { type Table } from 'dexie'

export interface Task {
  id?: number
  title: string
  status: 'pending' | 'done' | 'deferred'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  category: 'exec' | 'delegate' | 'admin' | 'follow-up' | 'own'
  is_boss_priority: boolean
  due_at?: string
  completed_at?: string
  executive_id?: number
  source: 'manual' | 'capture' | 'meeting'
  created_at: string
  notes?: string
}

export interface FollowUp {
  id?: number
  contact_name: string
  context: string
  channel: 'email' | 'whatsapp' | 'call' | 'verbal' | 'other'
  sent_at: string
  expected_by?: string
  resolved_at?: string
  status: 'waiting' | 'nudged' | 'resolved' | 'deferred'
  confidence: number
  task_id?: number
  notes?: string
}

export interface CalendarEvent {
  id?: number
  title: string
  event_type: 'meeting' | 'buffer' | 'deadline' | 'shadow' | 'prep'
  starts_at: string
  ends_at: string
  prep_needed: boolean
  brief_sent: boolean
  is_shadow: boolean
  executive_id?: number
  location?: string
  notes?: string
}

export interface Note {
  id?: number
  title: string
  content: string
  action_items: string
  event_id?: number
  created_at: string
  updated_at: string
}

export interface Capture {
  id?: number
  content: string
  auto_tag: 'task' | 'follow-up' | 'verbal' | 'note' | 'idea'
  status: 'raw' | 'processed' | 'dismissed'
  captured_at: string
  converted_to_id?: number
}

export interface Reminder {
  id?: number
  message: string
  fire_at: string
  sent: boolean
  task_id?: number
  event_id?: number
}

export interface Executive {
  id?: number
  name: string
  role: string
  energy_today: 'calm' | 'focused' | 'stressed' | 'unavailable'
  tone_library: string
  preferences: string
  avatar_initials: string
  color: string
}

export interface StreakLog {
  id?: number
  log_date: string
  brief_sent: boolean
  zero_dropped: boolean
  shields_used: number
  streak_count: number
}

export interface AppSettings {
  key: string
  value: string
}

class MonicaOSDatabase extends Dexie {
  tasks!: Table<Task>
  follow_ups!: Table<FollowUp>
  events!: Table<CalendarEvent>
  notes!: Table<Note>
  captures!: Table<Capture>
  reminders!: Table<Reminder>
  executives!: Table<Executive>
  streak_log!: Table<StreakLog>
  settings!: Table<AppSettings>

  constructor() {
    super('MonicaOS')

    this.version(1).stores({
      tasks: '++id, status, priority, is_boss_priority, due_at, executive_id, created_at',
      follow_ups: '++id, status, task_id, expected_by, contact_name, sent_at',
      events: '++id, starts_at, ends_at, executive_id, event_type',
      notes: '++id, event_id, created_at',
      captures: '++id, status, captured_at, auto_tag',
      reminders: '++id, fire_at, sent, task_id',
      executives: '++id, name',
      streak_log: '++id, log_date',
      settings: 'key',
    })
  }
}

export const db = new MonicaOSDatabase()

export async function seedInitialData() {
  const execCount = await db.executives.count()
  if (execCount > 0) return

  await db.executives.add({
    name: 'Richard M.',
    role: 'CEO',
    energy_today: 'focused',
    tone_library: JSON.stringify({
      decline: 'Richard appreciates direct, brief declines with an alternative offered.',
      schedule: 'Prefers morning meetings before 11am. No meetings Friday afternoon.',
    }),
    preferences: JSON.stringify({
      briefing_time: '08:00',
      buffer_minutes: 15,
      no_meeting_days: ['Friday PM'],
    }),
    avatar_initials: 'RM',
    color: '#534AB7',
  })

  const now = new Date()
  const today8am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0).toISOString()
  const today10am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString()
  const today12pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0).toISOString()
  const today2pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0).toISOString()
  const today4pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0).toISOString()

  await db.events.bulkAdd([
    { title: 'Morning brief with Richard', event_type: 'meeting', starts_at: today8am, ends_at: today8am, prep_needed: true, brief_sent: true, is_shadow: false, executive_id: 1 },
    { title: 'Board meeting', event_type: 'meeting', starts_at: today10am, ends_at: today12pm, prep_needed: true, brief_sent: true, is_shadow: false, executive_id: 1 },
    { title: 'Decompression buffer', event_type: 'buffer', starts_at: today12pm, ends_at: today2pm, prep_needed: false, brief_sent: false, is_shadow: true, executive_id: 1 },
    { title: 'Investor call', event_type: 'meeting', starts_at: today2pm, ends_at: today4pm, prep_needed: true, brief_sent: false, is_shadow: false, executive_id: 1 },
  ])

  await db.tasks.bulkAdd([
    { title: 'Send board pack to Richard', status: 'done', priority: 'urgent', category: 'exec', is_boss_priority: true, source: 'manual', created_at: new Date().toISOString(), completed_at: new Date().toISOString(), executive_id: 1 },
    { title: 'Confirm venue for Thursday dinner', status: 'pending', priority: 'high', category: 'exec', is_boss_priority: false, source: 'manual', created_at: new Date().toISOString(), executive_id: 1 },
    { title: 'Book car: airport Friday 6am', status: 'pending', priority: 'urgent', category: 'delegate', is_boss_priority: false, source: 'manual', created_at: new Date().toISOString(), executive_id: 1 },
    { title: 'Draft James brief for tomorrow', status: 'pending', priority: 'high', category: 'exec', is_boss_priority: true, source: 'manual', created_at: new Date().toISOString(), executive_id: 1 },
    { title: 'Confirm investor pre-read received', status: 'pending', priority: 'urgent', category: 'exec', is_boss_priority: false, source: 'manual', created_at: new Date().toISOString(), executive_id: 1 },
    { title: 'Reschedule Thursday lunch (conflict)', status: 'done', priority: 'normal', category: 'admin', is_boss_priority: false, source: 'manual', created_at: new Date().toISOString(), completed_at: new Date().toISOString(), executive_id: 1 },
  ])

  await db.follow_ups.bulkAdd([
    { contact_name: 'David Chen', context: 'Venue confirmation for Thursday dinner', channel: 'email', sent_at: new Date(Date.now() - 38 * 3600000).toISOString(), status: 'waiting', confidence: 2 },
    { contact_name: 'Finance team', context: 'Q2 budget sign-off approval', channel: 'email', sent_at: new Date(Date.now() - 20 * 3600000).toISOString(), status: 'waiting', confidence: 3 },
    { contact_name: 'Sarah (PR)', context: 'Press inquiry draft review', channel: 'whatsapp', sent_at: new Date(Date.now() - 4 * 3600000).toISOString(), status: 'waiting', confidence: 4 },
  ])

  await db.settings.bulkPut([
    { key: 'user_name', value: 'Monica' },
    { key: 'onboarded', value: 'true' },
    { key: 'streak_count', value: '14' },
    { key: 'shields_remaining', value: '2' },
  ])
}