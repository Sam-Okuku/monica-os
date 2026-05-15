export const TASK_STATUS = {
  PENDING: 'pending',
  DONE: 'done',
  DEFERRED: 'deferred',
} as const

export const TASK_PRIORITY = {
  URGENT: 'urgent',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const

export const TASK_CATEGORY = {
  EXEC: 'exec',
  DELEGATE: 'delegate',
  ADMIN: 'admin',
  FOLLOW_UP: 'follow-up',
  OWN: 'own',
} as const

export const FOLLOWUP_STATUS = {
  WAITING: 'waiting',
  NUDGED: 'nudged',
  RESOLVED: 'resolved',
  DEFERRED: 'deferred',
} as const

export const EVENT_TYPE = {
  MEETING: 'meeting',
  BUFFER: 'buffer',
  DEADLINE: 'deadline',
  SHADOW: 'shadow',
  PREP: 'prep',
} as const

export const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  urgent: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Urgent' },
  high: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706', label: 'High' },
  normal: { bg: '#F3F4F6', text: '#374151', dot: '#6B7280', label: 'Normal' },
  low: { bg: '#F9FAFB', text: '#9CA3AF', dot: '#D1D5DB', label: 'Low' },
}

export const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  exec: { bg: '#EDE9FE', text: '#4C1D95', label: 'Exec' },
  delegate: { bg: '#F3F4F6', text: '#374151', label: 'Delegate' },
  admin: { bg: '#DBEAFE', text: '#1E40AF', label: 'Admin' },
  'follow-up': { bg: '#FFF9C4', text: '#7A6500', label: 'Follow-up' },
  own: { bg: '#F3F4F6', text: '#6B7280', label: 'Own' },
}

export const STATUS_CONFIG = {
  'completed': { label: 'Completed', bg: '#D4EDDA', text: '#1A7A3A', dot: '#4CAF50' },
  'in-progress': { label: 'In progress', bg: '#FFF9C4', text: '#7A6500', dot: '#FDD835' },
  'tbc': { label: 'TBC', bg: '#EDE7F6', text: '#4A3B8C', dot: '#CE93D8' },
  'not-started': { label: 'Not started', bg: '#FCE4EC', text: '#9C1B3E', dot: '#F48FB1' },
} as const

export const ENERGY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  calm: { label: 'Calm', color: '#1A7A3A', dot: '#4CAF50' },
  focused: { label: 'Focused', color: '#1E40AF', dot: '#3B82F6' },
  stressed: { label: 'Stressed', color: '#92400E', dot: '#D97706' },
  unavailable: { label: 'Unavailable', color: '#6B7280', dot: '#D1D5DB' },
}

export const APP_NAME = 'Monica OS'
export const FOLLOWUP_WARNING_HOURS = 24
export const FOLLOWUP_DANGER_HOURS = 36