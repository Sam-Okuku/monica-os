'use client'

import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TaskItem } from '@/components/tasks/TaskItem'
import { AddTaskModal } from '@/components/tasks/AddTaskModal'
import { EmptyState } from '@/components/shared/EmptyState'
import { QuickCapture } from '@/components/capture/QuickCapture'

type FilterType = 'pending' | 'boss' | 'done' | 'all'

export default function TasksPage() {
  const [filter, setFilter] = useState<FilterType>('pending')
  const [addOpen, setAddOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  const tasks = useLiveQuery(async () => {
    if (filter === 'pending') return db.tasks.where('status').equals('pending').toArray()
    if (filter === 'done') return db.tasks.where('status').equals('done').toArray()
    if (filter === 'boss') return db.tasks.filter(t => t.is_boss_priority && t.status === 'pending').toArray()
    return db.tasks.toArray()
  }, [filter, refresh]) ?? []

  const bossTasks = useLiveQuery(
    () => db.tasks.filter(t => t.is_boss_priority && t.status === 'pending').toArray(),
    [refresh]
  ) ?? []

  const sorted = (filter === 'pending' || filter === 'boss' || filter === 'all')
    ? [...tasks].sort((a, b) => {
        const p: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
        if (a.is_boss_priority !== b.is_boss_priority) return a.is_boss_priority ? -1 : 1
        return (p[a.priority] ?? 2) - (p[b.priority] ?? 2)
      })
    : tasks

  const filters: { key: FilterType; label: string }[] = [
    { key: 'pending', label: 'Active' },
    { key: 'boss', label: '★ Boss priority' },
    { key: 'done', label: 'Completed' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#F7F6F3' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="monica-page-title">Tasks</h1>
              <p className="monica-page-sub">{tasks.length} items in this view</p>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 text-white text-[11px] font-medium px-4 py-2 rounded-full transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              + Add task
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all"
                style={filter === f.key
                  ? { background: '#6C63B6', color: '#FFFFFF' }
                  : { background: '#F5F4F2', color: '#7A7874' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-4">

          {filter === 'pending' && bossTasks.length > 0 && (
            <div>
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: '#F0EFFE', background: '#FAFAFE' }}
                >
                  <p className="text-[10px] font-semibold tracking-[0.08em] uppercase" style={{ color: '#6C63B6' }}>
                    ★ What Richard cares about today
                  </p>
                </div>
                <div className="px-3 py-1">
                  {bossTasks.map(task => (
                    <TaskItem key={task.id} task={task} onUpdate={forceRefresh} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '0.5px solid #ECEAE5' }}
          >
            {sorted.length === 0 ? (
              <EmptyState
                icon="✓"
                title={filter === 'done' ? 'Nothing completed yet' : 'Nothing here'}
                description={filter === 'pending' ? 'Add a task above to get started' : undefined}
                action={filter === 'done' ? undefined : { label: 'Add a task', onClick: () => setAddOpen(true) }}
              />
            ) : (
              <div className="px-3 py-1">
                {sorted.map(task => (
                  <TaskItem key={task.id} task={task} onUpdate={forceRefresh} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
      <AddTaskModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdded={forceRefresh} />
      <QuickCapture isOpen={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  )
}