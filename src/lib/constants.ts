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

export const CAPTURE_TAG = {
  TASK: 'task',
  FOLLOW_UP: 'follow-up',
  VERBAL: 'verbal',
  NOTE: 'note',
  IDEA: 'idea',
} as const

export const ENERGY_LEVEL = {
  CALM: 'calm',
  FOCUSED: 'focused',
  STRESSED: 'stressed',
  UNAVAILABLE: 'unavailable',
} as const

export const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  urgent: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400', label: 'Urgent' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'High' },
  normal: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-300', label: 'Normal' },
  low: { bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-200', label: 'Low' },
}

export const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  exec: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Exec' },
  delegate: { bg: 'bg-slate-50', text: 'text-slate-500', label: 'Delegate' },
  admin: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Admin' },
  'follow-up': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Follow-up' },
  own: { bg: 'bg-gray-50', text: 'text-gray-400', label: 'Own' },
}

export const ENERGY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  calm: { label: 'Calm', color: 'text-emerald-600', dot: 'bg-emerald-400' },
  focused: { label: 'Focused', color: 'text-blue-600', dot: 'bg-blue-400' },
  stressed: { label: 'Stressed', color: 'text-amber-600', dot: 'bg-amber-400' },
  unavailable: { label: 'Unavailable', color: 'text-gray-400', dot: 'bg-gray-300' },
}

export const APP_NAME = 'Monica OS'
export const MAX_SHIELD_DAYS = 2
export const FOLLOWUP_WARNING_HOURS = 24
export const FOLLOWUP_DANGER_HOURS = 36