'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Action } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

const STATUS_CONFIG = {
  'completed': { label: 'Completed', bg: '#D4EDDA', text: '#1A7A3A', dot: '#4CAF50' },
  'in-progress': { label: 'In progress', bg: '#FFF9C4', text: '#7A6500', dot: '#F9C700' },
  'tbc': { label: 'TBC', bg: '#EDE7F6', text: '#4A3B8C', dot: '#9C7FD4' },
  'not-started': { label: 'Not started', bg: '#FCE4EC', text: '#9C1B3E', dot: '#F06292' },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

function StatusPill({ status, onClick }: { status: StatusKey; onClick?: () => void }) {
  const c = STATUS_CONFIG[status]
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-all hover:opacity-80 active:scale-95"
      style={{ background: c.bg, color: c.text }}
      title={onClick ? 'Click to change status' : undefined}
    >
      {c.label}
    </button>
  )
}

function StatusCycler({ action, onUpdate }: { action: Action; onUpdate: () => void }) {
  const order: StatusKey[] = ['not-started', 'in-progress', 'tbc', 'completed']
  const next = () => {
    const i = order.indexOf(action.status as StatusKey)
    const nextStatus = order[(i + 1) % order.length]
    db.actions.update(action.id!, {
      status: nextStatus,
      updated_at: new Date().toISOString()
    }).then(onUpdate)
  }
  return <StatusPill status={action.status as StatusKey} onClick={next} />
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
    <div
      className="mx-4 mb-3 p-4 rounded-xl border"
      style={{ background: '#FAFAF9', borderColor: '#ECEAE5' }}
    >
      <div className="flex gap-3 mb-3">
        <span
          className="text-[10px] font-mono pt-1 flex-shrink-0"
          style={{ color: '#A8A6A0', minWidth: '52px' }}
        >
          {nextId}
        </span>
        <input
          autoFocus
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Action description…"
          className="flex-1 text-[13px] text-gray-700 border-b border-gray-100 pb-1 focus:border-purple-300 transition-colors placeholder-gray-300"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </div>
      <div className="flex items-center gap-3 ml-[64px] flex-wrap">
        <input
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Contact (optional)"
          className="text-[12px] text-gray-500 border border-gray-100 rounded-lg px-2.5 py-1 focus:border-purple-200 transition-colors placeholder-gray-300 w-40"
        />
        <div className="flex gap-1.5">
          {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-all"
              style={{
                background: status === s ? STATUS_CONFIG[s].bg : '#F5F4F2',
                color: status === s ? STATUS_CONFIG[s].text : '#A8A6A0',
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
            className="px-4 py-1.5 text-white text-[12px] font-medium rounded-lg disabled:opacity-30 active:scale-95 transition-all"
            style={{ background: '#6C63B6' }}
          >
            Add
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-[12px] text-gray-400 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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

  const filteredActions = useMemo(() => {
    return allActions.filter(a => {
      const statusMatch = filterStatus === 'all' || a.status === filterStatus
      const deptMatch = filterDept === 'all' || a.department_id === filterDept
      return statusMatch && deptMatch
    })
  }, [allActions, filterStatus, filterDept])

  const getNextId = (deptId: number) => {
    const deptActions = allActions.filter(a => a.department_id === deptId)
    const maxNum = allActions.reduce((max, a) => {
      const num = parseInt(a.action_id.replace('ACT-', ''), 10)
      return isNaN(num) ? max : Math.max(max, num)
    }, 0)
    return `ACT-${String(maxNum + 1).padStart(3, '0')}`
  }

  const visibleDepts = filterDept === 'all'
    ? departments
    : departments.filter(d => d.id === filterDept)

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F6F3' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">

        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="monica-page-title">Action tracker</h1>
              <p className="monica-page-sub">
                {stats.total} actions · {stats.completed} completed · {stats.pct}% done
              </p>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-xl"
              style={{ background: '#F7F6F3' }}
            >
              <div className="text-right">
                <p className="text-[10px] text-gray-400 mb-1">Overall progress</p>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: '#ECEAE5', width: '120px' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.pct}%`, background: '#4CAF50' }}
                  />
                </div>
              </div>
              <span
                className="text-[18px] font-semibold"
                style={{ color: '#1A7A3A', letterSpacing: '-0.02em' }}
              >
                {stats.pct}%
              </span>
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
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                  style={filterStatus === f.key
                    ? { background: '#6C63B6', color: '#FFFFFF' }
                    : f.key !== 'all' && f.key in STATUS_CONFIG
                    ? { background: STATUS_CONFIG[f.key as StatusKey].bg, color: STATUS_CONFIG[f.key as StatusKey].text }
                    : { background: '#F5F4F2', color: '#7A7874' }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-gray-100" />

            <select
              value={filterDept === 'all' ? 'all' : String(filterDept)}
              onChange={e => setFilterDept(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="text-[11px] border border-gray-100 rounded-lg px-2.5 py-1.5 text-gray-500 bg-white"
            >
              <option value="all">All departments</option>
              {departments.map(d => (
                <option key={d.id} value={String(d.id)}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-3">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {([
              { count: stats.completed, ...STATUS_CONFIG.completed },
              { count: stats.inProgress, ...STATUS_CONFIG['in-progress'] },
              { count: stats.tbc, ...STATUS_CONFIG.tbc },
              { count: stats.notStarted, ...STATUS_CONFIG['not-started'] },
              ])}
            ]).map(s => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{ background: s.bg, border: `0.5px solid ${s.dot}30` }}
              >
                <p className="text-[10px] font-medium tracking-wide mb-1" style={{ color: s.text, opacity: 0.7 }}>
                  {s.label}
                </p>
                <p className="text-[22px] font-semibold" style={{ color: s.text, letterSpacing: '-0.02em' }}>
                  {s.count}
                </p>
              </div>
            ))}
          </div>

          {visibleDepts.map(dept => {
            const deptActions = filteredActions
              .filter(a => a.department_id === dept.id)
              .sort((a, b) => a.action_id.localeCompare(b.action_id))

            const total = allActions.filter(a => a.department_id === dept.id).length
            const done = allActions.filter(a => a.department_id === dept.id && a.status === 'completed').length

            if (deptActions.length === 0 && filterStatus !== 'all' && filterDept === 'all') return null

            return (
              <div
                key={dept.id}
                className="rounded-xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: '#F5F4F2', background: '#FAFAF9' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: dept.color }}
                    />
                    <span
                      className="text-[11px] font-semibold tracking-[0.06em] uppercase"
                      style={{ color: dept.color }}
                    >
                      {dept.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">
                      {done}/{total} done
                    </span>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: '#ECEAE5', width: '60px' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${total > 0 ? Math.round((done / total) * 100) : 0}%`,
                          background: dept.color
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setAddingToDept(addingToDept === dept.id ? null : dept.id!)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full transition-all"
                      style={{ background: `${dept.color}18`, color: dept.color }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {addingToDept === dept.id && (
                  <div className="pt-3">
                    <AddActionForm
                      departmentId={dept.id!}
                      nextId={getNextId(dept.id!)}
                      onSave={() => { setAddingToDept(null); forceRefresh() }}
                      onCancel={() => setAddingToDept(null)}
                    />
                  </div>
                )}

                {deptActions.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-[12px] text-gray-300">No actions match this filter</p>
                  </div>
                ) : (
                  <div>
                    <div
                      className="grid px-4 py-2 border-b"
                      style={{ gridTemplateColumns: '56px 1fr 90px 110px', borderColor: '#F5F4F2' }}
                    >
                      <span className="text-[9px] font-medium tracking-wider uppercase text-gray-300">ID</span>
                      <span className="text-[9px] font-medium tracking-wider uppercase text-gray-300">Action</span>
                      <span className="text-[9px] font-medium tracking-wider uppercase text-gray-300">Contact</span>
                      <span className="text-[9px] font-medium tracking-wider uppercase text-gray-300">Status</span>
                    </div>
                    {deptActions.map((action, i) => (
                      <div
                        key={action.id}
                        className="grid px-4 py-3 border-b items-center hover:bg-gray-50 transition-colors"
                        style={{
                          gridTemplateColumns: '56px 1fr 90px 110px',
                          borderColor: '#F5F4F2',
                          borderBottomWidth: i === deptActions.length - 1 ? '0' : '0.5px'
                        }}
                      >
                        <span
                          className="text-[10px]"
                          style={{ fontFamily: 'monospace', color: '#C8C6C0' }}
                        >
                          {action.action_id}
                        </span>
                        <p
                          className="text-[13px] pr-4"
                          style={{
                            color: action.status === 'completed' ? '#C8C6C0' : '#1C1B1A',
                            textDecoration: action.status === 'completed' ? 'line-through' : 'none',
                            letterSpacing: '-0.005em',
                            lineHeight: '1.4'
                          }}
                        >
                          {action.description}
                        </p>
                        <p className="text-[11px]" style={{ color: '#A8A6A0' }}>
                          {action.contact_name || ''}
                        </p>
                        <StatusCycler action={action} onUpdate={forceRefresh} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

        </main>
      </div>
      <BottomNav />
    </div>
  )
}