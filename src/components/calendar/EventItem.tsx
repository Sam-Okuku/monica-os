'use client'

import { useState } from 'react'
import { CalendarEvent } from '@/lib/db'
import { formatTime } from '@/lib/utils'
import { updateEvent, deleteEvent } from '@/lib/db.queries'

interface EventItemProps {
  event: CalendarEvent
  onUpdate?: () => void
  showActions?: boolean
}

const EVENT_STYLES: Record<string, { border: string; bg: string; titleColor: string }> = {
  meeting: { border: '#7C3AED', bg: '#F5F3FF', titleColor: '#4C1D95' },
  buffer: { border: '#E5E7EB', bg: '#F9FAFB', titleColor: '#9CA3AF' },
  deadline: { border: '#EF4444', bg: '#FEF2F2', titleColor: '#991B1B' },
  shadow: { border: '#E5E7EB', bg: '#F9FAFB', titleColor: '#D1D5DB' },
  prep: { border: '#D97706', bg: '#FFFBEB', titleColor: '#92400E' },
}

function getDuration(starts: string, ends: string): number {
  try { return Math.round((new Date(ends).getTime() - new Date(starts).getTime()) / 60000) }
  catch { return 0 }
}

function ConfirmModal({
  title, message, confirmLabel, confirmColor, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel: string; confirmColor: string
  onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0" style={{ background: 'rgba(30,27,75,0.4)' }} />
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[16px] font-bold mb-2" style={{ color: '#1E1B4B', letterSpacing: '-0.02em' }}>{title}</p>
        <p className="text-[13px] font-medium mb-6" style={{ color: '#4B5563' }}>{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all active:scale-95"
            style={{ background: confirmColor }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function EditModal({
  event, onSave, onCancel,
}: { event: CalendarEvent; onSave: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(event.title)
  const [startsAt, setStartsAt] = useState(event.starts_at.slice(0, 16))
  const [endsAt, setEndsAt] = useState(event.ends_at.slice(0, 16))
  const [location, setLocation] = useState(event.location ?? '')
  const [prepNeeded, setPrepNeeded] = useState(event.prep_needed)
  const [eventType, setEventType] = useState(event.event_type)

  const handleSave = async () => {
    if (!title.trim()) return
    await updateEvent(event.id!, {
      title: title.trim(),
      starts_at: startsAt,
      ends_at: endsAt || startsAt,
      location: location.trim() || undefined,
      prep_needed: prepNeeded,
      event_type: eventType as any,
    })
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0" style={{ background: 'rgba(30,27,75,0.4)' }} />
      <div
        className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #F3F4F6' }}>
          <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: '#7C3AED' }}>Edit event</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full text-[14px] font-semibold border-b pb-2 transition-colors"
            style={{ color: '#1E1B4B', borderColor: '#E5E7EB' }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: '#6B7280' }}>Start</p>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
                className="w-full text-[12px] border rounded-lg px-2.5 py-1.5"
                style={{ color: '#374151', borderColor: '#E5E7EB' }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: '#6B7280' }}>End</p>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={e => setEndsAt(e.target.value)}
                className="w-full text-[12px] border rounded-lg px-2.5 py-1.5"
                style={{ color: '#374151', borderColor: '#E5E7EB' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: '#6B7280' }}>Type</p>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as any)}
                className="w-full text-[12px] border rounded-lg px-2.5 py-1.5"
                style={{ color: '#374151', borderColor: '#E5E7EB' }}
              >
                {['meeting', 'buffer', 'deadline', 'prep', 'shadow'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-1.5" style={{ color: '#6B7280' }}>Location</p>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Optional"
                className="w-full text-[12px] border rounded-lg px-2.5 py-1.5"
                style={{ color: '#374151', borderColor: '#E5E7EB' }}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={prepNeeded} onChange={e => setPrepNeeded(e.target.checked)} className="rounded" />
            <span className="text-[12px] font-medium" style={{ color: '#374151' }}>Prep needed</span>
          </label>
        </div>

        <div className="px-5 py-4 flex gap-3" style={{ borderTop: '0.5px solid #F3F4F6' }}>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-30 active:scale-95 transition-all"
            style={{ background: '#7C3AED' }}
          >
            Save changes
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function EventItem({ event, onUpdate, showActions = true }: EventItemProps) {
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const style = EVENT_STYLES[event.event_type] ?? EVENT_STYLES.meeting
  const duration = getDuration(event.starts_at, event.ends_at)
  const isCompleted = event.lifecycle === 'completed'
  const isCancelled = event.lifecycle === 'cancelled'
  const isArchived = event.lifecycle === 'archived'
  const isDimmed = isCompleted || isCancelled || isArchived || event.is_shadow

  const handleComplete = async () => { await updateEvent(event.id!, { lifecycle: 'completed' }); setShowMenu(false); onUpdate?.() }
  const handleArchive = async () => { await updateEvent(event.id!, { lifecycle: 'archived' }); setShowMenu(false); onUpdate?.() }
  const handleCancel = async () => { await updateEvent(event.id!, { lifecycle: 'cancelled' }); setShowMenu(false); setShowCancelConfirm(false); onUpdate?.() }
  const handleDelete = async () => { await deleteEvent(event.id!); setShowDeleteConfirm(false); onUpdate?.() }
  const handleRestoreActive = async () => { await updateEvent(event.id!, { lifecycle: 'active' }); setShowMenu(false); onUpdate?.() }
  const toggleBrief = async (e: React.MouseEvent) => { e.stopPropagation(); await updateEvent(event.id!, { brief_sent: !event.brief_sent }); onUpdate?.() }

  const lifecycleBadge = () => {
    if (isCompleted) return { label: '✓ Completed', bg: '#D4EDDA', text: '#1A7A3A' }
    if (isCancelled) return { label: '✕ Cancelled', bg: '#FCE4EC', text: '#9C1B3E' }
    if (isArchived) return { label: '◫ Archived', bg: '#F3F4F6', text: '#6B7280' }
    return null
  }
  const badge = lifecycleBadge()

  return (
    <>
      <div
        className="flex items-start gap-3 p-3 rounded-xl mb-2 border-l-2 transition-all relative cursor-pointer"
        style={{
          borderLeftColor: isCancelled ? '#E5E7EB' : style.border,
          background: isCancelled ? '#FAFAFA' : style.bg,
          opacity: isDimmed ? 0.5 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setShowMenu(m => !m)}
      >
        <div className="flex-shrink-0 text-right" style={{ minWidth: '44px' }}>
          <p className="text-[11px] font-semibold" style={{ color: '#374151' }}>{formatTime(event.starts_at)}</p>
          {duration > 0 && <p className="text-[9px] font-medium" style={{ color: '#9CA3AF' }}>{duration}m</p>}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold truncate mb-1"
            style={{ color: isCancelled ? '#9CA3AF' : style.titleColor, textDecoration: isCancelled ? 'line-through' : 'none', letterSpacing: '-0.01em' }}
          >
            {event.title}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.text }}>
                {badge.label}
              </span>
            )}
            {!event.is_shadow && event.prep_needed && !isCancelled && (
              <button
                onClick={toggleBrief}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                style={event.brief_sent ? { background: '#D4EDDA', color: '#1A7A3A' } : { background: '#FEF3C7', color: '#92400E' }}
              >
                {event.brief_sent ? '✓ Briefed' : '! Brief needed'}
              </button>
            )}
            {event.location && <span className="text-[9px] font-medium" style={{ color: '#6B7280' }}>◎ {event.location}</span>}
            {event.is_shadow && <span className="text-[9px]" style={{ color: '#D1D5DB' }}>buffer</span>}
          </div>
        </div>

        {showActions && (hovered || showMenu) && (
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowEdit(true); setShowMenu(false) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] transition-all hover:opacity-80"
              style={{ background: '#EDE9FE', color: '#7C3AED' }}
              title="Edit"
            >✎</button>
            {!isCompleted && !isCancelled && !isArchived && (
              <button
                onClick={handleComplete}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] transition-all hover:opacity-80"
                style={{ background: '#D4EDDA', color: '#1A7A3A' }}
                title="Mark completed"
              >✓</button>
            )}
            {(isCompleted || isArchived) && (
              <button
                onClick={handleRestoreActive}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all hover:opacity-80"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
                title="Restore to active"
              >↺</button>
            )}
            {!isCancelled && !isCompleted && (
              <button
                onClick={() => { setShowCancelConfirm(true); setShowMenu(false) }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] transition-all hover:opacity-80"
                style={{ background: '#FEF3C7', color: '#92400E' }}
                title="Cancel event"
              >✕</button>
            )}
            <button
              onClick={() => { setShowDeleteConfirm(true); setShowMenu(false) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] transition-all hover:opacity-80"
              style={{ background: '#FCE4EC', color: '#9C1B3E' }}
              title="Delete permanently"
            >×</button>
          </div>
        )}
      </div>

      {showEdit && (
        <EditModal event={event} onSave={() => { setShowEdit(false); onUpdate?.() }} onCancel={() => setShowEdit(false)} />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete this event?"
          message={`"${event.title}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete permanently"
          confirmColor="#EF4444"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showCancelConfirm && (
        <ConfirmModal
          title="Cancel this event?"
          message={`"${event.title}" will be marked as cancelled and hidden from the dashboard.`}
          confirmLabel="Yes, cancel it"
          confirmColor="#D97706"
          onConfirm={handleCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  )
}