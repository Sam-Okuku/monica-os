'use client'

import { useState } from 'react'
import { Task } from '@/lib/db'
import { completeTask, uncompleteTask, deleteTask } from '@/lib/db.queries'
import { Badge } from '@/components/shared/Badge'
import { formatDate } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onUpdate: () => void
}

export function TaskItem({ task, onUpdate }: TaskItemProps) {
  const [completing, setCompleting] = useState(false)

  const handleToggle = async () => {
    if (task.status === 'done') {
      await uncompleteTask(task.id!)
      onUpdate()
      return
    }
    setCompleting(true)
    await completeTask(task.id!)
    setTimeout(() => { setCompleting(false); onUpdate() }, 450)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteTask(task.id!)
    onUpdate()
  }

  const done = task.status === 'done'
  const showPriority = task.priority === 'urgent' || task.priority === 'high'

  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-2 group border-b last:border-0 transition-all rounded-lg mx-1 ${completing ? 'completion-flash' : ''}`}
      style={{ borderColor: '#F3F4F6', opacity: done ? 0.45 : 1 }}
    >
      <button
        onClick={handleToggle}
        className="flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200"
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: done ? 'none' : '1.5px solid #D1D5DB',
          background: done ? '#4CAF50' : 'transparent',
        }}
      >
        {done && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="scale-check">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-[13px] leading-snug font-medium"
            style={{
              color: done ? '#9CA3AF' : '#1E1B4B',
              textDecoration: done ? 'line-through' : 'none',
              letterSpacing: '-0.005em',
            }}
          >
            {task.is_boss_priority && !done && (
              <span style={{ color: '#7C3AED', marginRight: '6px', fontSize: '11px' }}>★</span>
            )}
            {task.title}
          </p>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-base leading-none transition-all flex-shrink-0 mt-0.5"
            style={{ color: '#D1D5DB' }}
          >
            ×
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          {!done && showPriority && <Badge variant="priority" value={task.priority} />}
          {!done && !showPriority && <Badge variant="category" value={task.category} />}
          {task.due_at && !done && (
            <span className="text-[10px] font-medium" style={{ color: '#6B7280' }}>
              {formatDate(task.due_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}