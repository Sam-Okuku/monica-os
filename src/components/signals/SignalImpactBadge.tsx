import { SignalDestination } from '@/lib/signals/types'

interface Props { destination: SignalDestination }

const DEST_CONFIG: Record<SignalDestination, { label: string; bg: string; text: string; icon: string }> = {
  calendar:  { label: 'Calendar',   bg: '#EDE9FE', text: '#4C1D95', icon: '◻' },
  task:      { label: 'Task',       bg: '#FFF9C4', text: '#7A6500', icon: '✓' },
  followup:  { label: 'Follow-up',  bg: '#FCE4EC', text: '#9C1B3E', icon: '◎' },
  tracker:   { label: 'Tracker',    bg: '#D4EDDA', text: '#1A7A3A', icon: '▦' },
  note:      { label: 'Note',       bg: '#F3F4F6', text: '#374151', icon: '≡' },
  skip:      { label: 'Skip',       bg: '#F3F4F6', text: '#9CA3AF', icon: '○' },
}

export function SignalImpactBadge({ destination }: Props) {
  const c = DEST_CONFIG[destination]
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.text }}
    >
      <span>{c.icon}</span>
      <span>{c.label}</span>
    </span>
  )
}