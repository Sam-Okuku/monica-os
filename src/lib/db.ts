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
export interface Department {
  id?: number
  name: string
  color: string
  order_index: number
}

export interface Action {
  id?: number
  department_id: number
  action_id: string
  description: string
  contact_name?: string
  status: 'completed' | 'in-progress' | 'tbc' | 'not-started'
  notes?: string
  created_at: string
  updated_at: string
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
  departments!: Table<Department>
  actions!: Table<Action>

  constructor() {
    super('MonicaOS')

    this.version(2).stores({
      tasks: '++id, status, priority, is_boss_priority, due_at, executive_id, created_at',
      follow_ups: '++id, status, task_id, expected_by, contact_name, sent_at',
      events: '++id, starts_at, ends_at, executive_id, event_type',
      notes: '++id, event_id, created_at',
      captures: '++id, status, captured_at, auto_tag',
      reminders: '++id, fire_at, sent, task_id',
      executives: '++id, name',
      streak_log: '++id, log_date',
      settings: 'key',
      departments: '++id, name, order_index',
      actions: '++id, department_id, action_id, status, contact_name',
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
  const deptCount = await db.departments.count()
  if (deptCount === 0) {
    const depts = await db.departments.bulkAdd([
      { name: 'DIV 1 & 2', color: '#6C63B6', order_index: 1 },
      { name: 'Emerging Market', color: '#1D9E75', order_index: 2 },
      { name: 'Marketing', color: '#D4860A', order_index: 3 },
      { name: 'Data & Strategy', color: '#378ADD', order_index: 4 },
      { name: 'Credit Control', color: '#C94F2C', order_index: 5 },
      { name: 'HORECA – Noreen', color: '#8B5CF6', order_index: 6 },
      { name: 'Mainland EPZ', color: '#059669', order_index: 7 },
    ], { allKeys: true })

    const now = new Date().toISOString()
    const ids = depts as number[]

    await db.actions.bulkAdd([
      { department_id: ids[0], action_id: 'ACT-001', description: 'Separate White Wash and 1KG', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[0], action_id: 'ACT-002', description: 'DMS status update', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[0], action_id: 'ACT-003', description: 'Sojpar onboarding', contact_name: 'Amina', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[0], action_id: 'ACT-004', description: 'Align with Zen', contact_name: 'Charles', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[0], action_id: 'ACT-005', description: 'Obtain regional data', contact_name: 'Amina', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-006', description: 'Complete MO costing', contact_name: 'Mukami', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-007', description: 'Align with Bosaso client', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-008', description: 'Send samples to Sudan and Somalia', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-009', description: 'Wrappers and artwork coordination – Mainland', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-010', description: 'Follow up on Dubai deal', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-011', description: 'Progress Zimgold deal', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-012', description: 'Confirm containers & shipping date – Somalia', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-013', description: 'Execute bond & confirm volume capacity', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[1], action_id: 'ACT-014', description: 'Magic White production', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-015', description: 'Clarify Afrisense strategy', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-016', description: 'Curl & Gel formulation', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-017', description: 'Close deal with Chebet & sign contract', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-018', description: 'Tiara proposal', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-019', description: 'Agree July launch date', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-020', description: 'Brand head ground activation', status: 'not-started', created_at: now, updated_at: now },
      { department_id: ids[2], action_id: 'ACT-021', description: 'NPD cost closure', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[3], action_id: 'ACT-022', description: 'Universe coverage & GEO analysis', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[3], action_id: 'ACT-023', description: 'Distributor review summary', status: 'not-started', created_at: now, updated_at: now },
      { department_id: ids[3], action_id: 'ACT-024', description: 'B2B data visibility – export vs domestic', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[3], action_id: 'ACT-025', description: 'Add all SKUs and share data', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[3], action_id: 'ACT-026', description: 'Correct & update DVIO system', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[4], action_id: 'ACT-027', description: 'Increase transporter insurance cover', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[4], action_id: 'ACT-028', description: 'Obtain Oracle system – Mainland', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[4], action_id: 'ACT-029', description: 'Prepare bonds', contact_name: 'Fred', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[4], action_id: 'ACT-030', description: 'Develop SOP for credit risk prediction', status: 'not-started', created_at: now, updated_at: now },
      { department_id: ids[4], action_id: 'ACT-031', description: 'Credit check for Vegol', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[5], action_id: 'ACT-032', description: 'Set up Solutech App – fill customer details', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[5], action_id: 'ACT-033', description: 'Clarify Uganda bypass route (Lato)', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[5], action_id: 'ACT-034', description: 'Close deal with Dr Jael', status: 'completed', created_at: now, updated_at: now },
      { department_id: ids[5], action_id: 'ACT-035', description: 'Provide data conversion for all HORECA products', status: 'in-progress', created_at: now, updated_at: now },
      { department_id: ids[6], action_id: 'ACT-036', description: 'Ethiopia orders – closing status', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[6], action_id: 'ACT-037', description: 'Request with Ketepa and obtain quote', status: 'tbc', created_at: now, updated_at: now },
      { department_id: ids[6], action_id: 'ACT-038', description: 'Deliver 1 trial truck for Omar Hamisi', status: 'completed', created_at: now, updated_at: now },
    ])
  }
}