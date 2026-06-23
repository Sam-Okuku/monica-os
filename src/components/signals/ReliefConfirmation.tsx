'use client'

import { SignalDestination } from '@/lib/signals/types'

interface Props {
  destination: SignalDestination
  subject: string
  onDone: () => void
}

const RELIEF_MESSAGES: Record<SignalDestination, { headline: string; relief: string; next?: string }> = {
  calendar: {
    headline: 'Added to your agenda',
    relief: 'You do not need to remember this meeting.',
    next: 'It will appear in your Shadow Agenda and morning briefing.',
  },
  task: {
    headline: 'Task created',
    relief: 'You do not need to hold this in your head.',
    next: 'It will appear in your priorities and brief you tomorrow.',
  },
  followup: {
    headline: 'Follow-up tracked',
    relief: 'Monica OS will surface this if they go silent.',
    next: 'You will be notified when it becomes overdue.',
  },
  tracker: {
    headline: 'Added to tracker',
    relief: 'The operational system has it.',
    next: undefined,
  },
  note: {
    headline: 'Saved to notes',
    relief: 'Stored for when you need it.',
    next: undefined,
  },
  skip: {
    headline: 'Signal dismissed',
    relief: 'You will not see this type again.',
    next: undefined,
  },
}

export function ReliefConfirmation({ destination, subject, onDone }: Props) {
  const msg = RELIEF_MESSAGES[destination]

  return (
    <div
      className="rounded-2xl p-6 text-center slide-up"
      style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"
        style={{ background: '#D4EDDA' }}
      >
        ✓
      </div>
      <p className="text-[15px] font-bold mb-1" style={{ color: '#1E1B4B', letterSpacing: '-0.01em' }}>
        {msg.headline}
      </p>
      <p className="text-[12px] font-medium mb-1" style={{ color: '#6B7280' }}>
        "{subject.slice(0, 60)}{subject.length > 60 ? '…' : ''}"
      </p>
      <p className="text-[13px] font-semibold mb-2 italic" style={{ color: '#7C3AED' }}>
        {msg.relief}
      </p>
      {msg.next && (
        <p className="text-[11px] mb-4" style={{ color: '#9CA3AF' }}>
          {msg.next}
        </p>
      )}
      <button
        onClick={onDone}
        className="px-6 py-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95"
        style={{ background: '#1E1B4B' }}
      >
        Done
      </button>
    </div>
  )
}