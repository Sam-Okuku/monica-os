'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Action, Department } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

const STATUS_CONFIG = {
  'completed': { label: 'Completed', bg: '#D4EDDA', text: '#1A7A3A', dot: '#4CAF50' },
  'in-progress': { label: 'In progress', bg: '#FFF9C4', text: '#7A6500', dot: '#FDD835' },
  'tbc': { label: 'TBC', bg: '#EDE7F6', text: '#4A3B8C', dot: '#CE93D8' },
  'not-started': { label: 'Not started', bg: '#FCE4EC', text: '#9C1B3E', dot: '#F48FB1' },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const DEPT_COLORS = [
  '#7C3AED', '#1E1B4B', '#1A7A3A', '#92400E',
  '#1E40AF', '#9C1B3E', '#065F46', '#7C2D12',
]

function StatusCycler({ action, onUpdate }: { action: Action; onUpdate: () => void }) {
  const order: StatusKey[] = ['not-started', 'in-progress', 'tbc', 'completed']
  const next = () => {
    const i = order.indexOf(action.status as StatusKey)
    const nextStatus = order[(i + 1) % order.length]
    db.actions.update(action.id!, { status: nextStatus, updated_at: new Date().toISOString() }).then(onUpdate)
  }
  const c = STATUS_CONFIG[action.status as StatusKey] ?? STATUS_CONFIG['not-started']
  return (
    <button
      onClick={next}
      className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all hover:opacity-80 active:scale-95"
      style={{ background: c.bg, color: c.text }}
      title="Tap to change status"
    >
      {c.label}
    </button>
  )
}

function ActionRow({ action, onUpdate }: { action: Action; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(action.notes ?? '')
  const done = action.status === 'completed'

  const saveNotes = async () => {
    await db.actions.update(action.id!, { notes: notes.trim(), updated_at: new Date().toISOString() })
    onUpdate()
  }

  return (
    <div>
      <div
        className="grid items-center px-4 py-2.5 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ gridTemplateColumns: '52px 1fr 90px 110px', borderColor: '#F3F4F6' }}
        onClick={() => setExpanded(e => !e)}
      >
        <span
          className="text-[10px]"
          style={{ fontFamily: 'monospace', color: '#9CA3AF' }}
        >
          {action.action_id}
        </span>
        <p
          className="text-[13px] font-medium pr-4"
          style={{
            color: done ? '#9CA3AF' : '#1E1B4B',
            textDecoration: done ? 'line-through' : 'none',
            letterSpacing: '-0.005em',
            lineHeight: '1.35',
          }}
        >
          {action.description}
          {action.contact_name && (
            <span className="ml-2 text-[10px] font-semibold" style={{ color: '#6B7280' }}>
              — {action.contact_name}
            </span>
          )}
        </p>
        <div onClick={e => e.stopPropagation()}>
          <StatusCycler action={action} onUpdate={onUpdate} />
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className="text-[10px]" style={{ color: '#D1D5DB' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div
          className="px-4 py-3 border-b slide-up"
          style={{ borderColor: '#F3F4F6', background: '#FAFAFE' }}
        >
          <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: '#7C3AED' }}>
            Notes
          </p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes for this action…"
            className="w-full text-[12px] font-medium resize-none rounded-lg px-3 py-2"
            style={{
              color: '#374151',
              background: '#FFFFFF',
              border: '0.5px solid #E5E7EB',
              minHeight: '60px',
            }}
            rows={2}
          />
        </div>
      )}
    </div>
  )
}

interface AddActionFormProps {
  departmentId: number
  nextId: string
  onSave: () => void
  onCancel: () => void
}

function AddActionForm({ departmentId, nextId, onSave, onCancel }: AddActionFormProps) {
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<StatusKey>('not-started')

  const handleSave = async () => {
    if (!description.trim()) return
    await db.actions.add({
      department_id: departmentId,
      action_id: nextId,
      description: description.trim(),
      contact_name: contact.trim() || undefined,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    onSave()
  }

  return (
    <div className="px-4 py-4 border-b" style={{ borderColor: '#F3F4F6', background: '#FAFAFE' }}>
      <div className="flex gap-3 mb-3">
        <span className="text-[10px] pt-1 flex-shrink-0" style={{ fontFamily: 'monospace', color: '#9CA3AF', minWidth: '52px' }}>
          {nextId}
        </span>
        <input
          autoFocus
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Action description…"
          className="flex-1 text-[13px] font-medium border-b pb-1 transition-colors"
          style={{ color: '#1E1B4B', borderColor: '#E5E7EB' }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </div>
      <div className="flex items-center gap-3 ml-16 flex-wrap">
        <input
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Contact"
          className="text-[12px] border rounded-lg px-2.5 py-1 w-36"
          style={{ color: '#374151', borderColor: '#E5E7EB' }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
              style={{
                background: status === s ? STATUS_CONFIG[s].bg : '#F3F4F6',
                color: status === s ? STATUS_CONFIG[s].text : '#6B7280',
                outline: status === s ? `1.5px solid ${STATUS_CONFIG[s].dot}` : 'none',
              }}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleSave}
            disabled={!description.trim()}
            className="px-4 py-1.5 text-white text-[12px] font-bold rounded-lg disabled:opacity-30 active:scale-95"
            style={{ background: '#7C3AED' }}
          >
            Add
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-[12px] font-medium rounded-lg"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function AddDeptModal({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEPT_COLORS[0])

  const handleSave = async () => {
    if (!name.trim()) return
    const maxOrder = (await db.departments.toArray()).reduce((m, d) => Math.max(m, d.order_index), 0)
    await db.departments.add({ name: name.trim(), color, order_index: maxOrder + 1 })
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0" style={{ background: 'rgba(30,27,75,0.3)' }} />
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl p-6 slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[15px] font-bold mb-4" style={{ color: '#1E1B4B' }}>New department</p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Department name…"
          className="w-full text-[14px] font-medium border-b pb-2 mb-4"
          style={{ color: '#1E1B4B', borderColor: '#E5E7EB' }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: '#6B7280' }}>
          Colour
        </p>
        <div className="flex gap-2 mb-5 flex-wrap">
          {DEPT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full transition-all"
              style={{
                background: c,
                outline: color === c ? `3px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 py-2.5 text-white text-[13px] font-bold rounded-xl disabled:opacity-30"
            style={{ background: '#7C3AED' }}
          >
            Create department
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-[13px] font-medium rounded-xl"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TrackerPage() {
  const [filterStatus, setFilterStatus] = useState<StatusKey | 'all'>('all')
  const [filterDept, setFilterDept] = useState<number | 'all'>('all')
  const [addingToDept, setAddingToDept] = useState<number | null>(null)
  const [showCompletedForDept, setShowCompletedForDept] = useState<Set<number>>(new Set())
  const [showAddDept, setShowAddDept] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  const departments = useLiveQuery(() =>
    db.departments.orderBy('order_index').toArray(), [refresh]
  ) ?? []

  const allActions = useLiveQuery(() =>
    db.actions.orderBy('action_id').toArray(), [refresh]
  ) ?? []

  const stats = useMemo(() => {
    const total = allActions.length
    const completed = allActions.filter(a => a.status === 'completed').length
    const inProgress = allActions.filter(a => a.status === 'in-progress').length
    const tbc = allActions.filter(a => a.status === 'tbc').length
    const notStarted = allActions.filter(a => a.status === 'not-started').length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, tbc, notStarted, pct }
  }, [allActions])

  const filteredActions = useMemo(() =>
    allActions.filter(a => {
      const sm = filterStatus === 'all' || a.status === filterStatus
      const dm = filterDept === 'all' || a.department_id === filterDept
      return sm && dm
    }), [allActions, filterStatus, filterDept]
  )

  const getNextId = useCallback(() => {
    const max = allActions.reduce((m, a) => {
      const n = parseInt(a.action_id.replace('ACT-', ''), 10)
      return isNaN(n) ? m : Math.max(m, n)
    }, 0)
    return `ACT-${String(max + 1).padStart(3, '0')}`
  }, [allActions])

  const toggleCompletedVisibility = (deptId: number) => {
    setShowCompletedForDept(prev => {
      const next = new Set(prev)
      if (next.has(deptId)) next.delete(deptId)
      else next.add(deptId)
      return next
    })
  }

  const visibleDepts = filterDept === 'all' ? departments : departments.filter(d => d.id === filterDept)

  return (
    <div className="flex min-h-screen" style={{ background: '#F0EFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">

        <div className="bg-white px-6 py-5" style={{ borderBottom: '0.5px solid #E5E7EB' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="monica-page-title">Action tracker</h1>
              <p className="monica-page-sub">
                {stats.total} actions · {stats.completed} completed · {stats.pct}% done
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB', width: '100px' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.pct}%`, background: '#4CAF50' }}
                  />
                </div>
                <span className="text-[15px] font-bold" style={{ color: '#1A7A3A', letterSpacing: '-0.02em' }}>
                  {stats.pct}%
                </span>
              </div>
              <button
                onClick={() => setShowAddDept(true)}
                className="text-[11px] font-bold px-3 py-2 rounded-full transition-all active:scale-95"
                style={{ background: '#EDE9FE', color: '#7C3AED' }}
              >
                + Dept
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'all', label: `All (${stats.total})` },
                { key: 'completed', label: `✓ ${stats.completed}` },
                { key: 'in-progress', label: `▶ ${stats.inProgress}` },
                { key: 'tbc', label: `? ${stats.tbc}` },
                { key: 'not-started', label: `○ ${stats.notStarted}` },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key as StatusKey | 'all')}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                  style={filterStatus === f.key
                    ? { background: '#1E1B4B', color: '#FFFFFF' }
                    : f.key !== 'all' && f.key in STATUS_CONFIG
                    ? { background: STATUS_CONFIG[f.key as StatusKey].bg, color: STATUS_CONFIG[f.key as StatusKey].text }
                    : { background: '#F3F4F6', color: '#374151' }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px" style={{ background: '#E5E7EB' }} />
            <select
              value={filterDept === 'all' ? 'all' : String(filterDept)}
              onChange={e => setFilterDept(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="text-[11px] font-semibold border rounded-lg px-2.5 py-1.5"
              style={{ color: '#374151', borderColor: '#E5E7EB' }}
            >
              <option value="all">All departments</option>
              {departments.map(d => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-5 max-w-4xl mx-auto w-full space-y-3">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {([
              { count: stats.completed, ...STATUS_CONFIG.completed },
              { count: stats.inProgress, ...STATUS_CONFIG['in-progress'] },
              { count: stats.tbc, ...STATUS_CONFIG.tbc },
              { count: stats.notStarted, ...STATUS_CONFIG['not-started'] },
            ]).map(s => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{ background: s.bg, border: `0.5px solid ${s.dot}40` }}
              >
                <p className="text-[10px] font-bold tracking-wide mb-1" style={{ color: s.text }}>
                  {s.label}
                </p>
                <p className="text-[24px] font-black" style={{ color: s.text, letterSpacing: '-0.03em' }}>
                  {s.count}
                </p>
              </div>
            ))}
          </div>

          {visibleDepts.map(dept => {
            const deptAllActions = allActions.filter(a => a.department_id === dept.id)
            const activeActions = filteredActions
              .filter(a => a.department_id === dept.id && a.status !== 'completed')
              .sort((a, b) => a.action_id.localeCompare(b.action_id))
            const completedActions = filteredActions
              .filter(a => a.department_id === dept.id && a.status === 'completed')
              .sort((a, b) => a.action_id.localeCompare(b.action_id))

            const totalDept = deptAllActions.length
            const doneDept = deptAllActions.filter(a => a.status === 'completed').length
            const notDoneDept = deptAllActions.filter(a => a.status === 'tbc' || a.status === 'not-started').length
            const pressurePct = totalDept > 0 ? notDoneDept / totalDept : 0
            const isAtRisk = pressurePct >= 0.6

            const showCompleted = showCompletedForDept.has(dept.id!)
            const hasAnything = activeActions.length > 0 || completedActions.length > 0

            if (!hasAnything && filterStatus !== 'all') return null

            return (
              <div
                key={dept.id}
                className="rounded-xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: isAtRisk ? '#FFF9C4' : '#FAFAFE',
                    borderBottom: '0.5px solid #F3F4F6'
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: dept.color }} />
                    <span
                      className="text-[12px] font-black tracking-[0.05em] uppercase"
                      style={{ color: dept.color }}
                    >
                      {dept.name}
                    </span>
                    {isAtRisk && (
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#FEF3C7', color: '#92400E' }}
                      >
                        At risk
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>
                      {doneDept}/{totalDept}
                    </span>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E7EB', width: '50px' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalDept > 0 ? (doneDept / totalDept) * 100 : 0}%`,
                          background: dept.color
                        }}
                      />
                    </div>
                    {completedActions.length > 0 && (
                      <button
                        onClick={() => toggleCompletedVisibility(dept.id!)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                        style={{ background: '#D4EDDA', color: '#1A7A3A' }}
                      >
                        {showCompleted ? '▲' : '▼'} {completedActions.length} done
                      </button>
                    )}
                    <button
                      onClick={() => setAddingToDept(addingToDept === dept.id ? null : dept.id!)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                      style={{ background: `${dept.color}18`, color: dept.color }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {addingToDept === dept.id && (
                  <AddActionForm
                    departmentId={dept.id!}
                    nextId={getNextId()}
                    onSave={() => { setAddingToDept(null); forceRefresh() }}
                    onCancel={() => setAddingToDept(null)}
                  />
                )}

                {activeActions.length === 0 && !showCompleted ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}>
                      {completedActions.length > 0
                        ? `All ${completedActions.length} actions completed ✓`
                        : 'No actions match this filter'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      className="grid px-4 py-2"
                      style={{ gridTemplateColumns: '52px 1fr 110px 40px', borderBottom: '0.5px solid #F3F4F6' }}
                    >
                      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: '#9CA3AF' }}>ID</span>
                      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: '#9CA3AF' }}>Action</span>
                      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: '#9CA3AF' }}>Status</span>
                      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: '#9CA3AF' }}></span>
                    </div>
                    {activeActions.map(action => (
                      <ActionRow key={action.id} action={action} onUpdate={forceRefresh} />
                    ))}
                    {showCompleted && completedActions.map(action => (
                      <ActionRow key={action.id} action={action} onUpdate={forceRefresh} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

        </main>
      </div>

      <BottomNav />
      {showAddDept && (
        <AddDeptModal
          onSave={() => { setShowAddDept(false); forceRefresh() }}
          onCancel={() => setShowAddDept(false)}
        />
      )}
    </div>
  )
}