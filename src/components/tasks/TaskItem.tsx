'use client'

import { useState } from 'react'
import { Task } from '@/lib/db'
import { completeTask, uncompleteTask, deleteTask } from '@/lib/db.queries'
import { Badge } from '@/components/shared/Badge'
import { formatDate, cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  onUpdate: () => void
  showDate?: boolean
}

export function TaskItem({ task, onUpdate, showDate = true }: TaskItemProps) {
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

  const showPriorityBadge = task.priority === 'urgent' || task.priority === 'high'
  const done = task.status === 'done'

  return (
    <div className={cn(
      'flex items-start gap-3 py-3 px-2 group border-b last:border-0 transition-all duration-300 rounded-lg mx-1',
      'border-gray-50',
      completing && 'completion-flash',
      done && 'opacity-50'
    )}>
      <button
        onClick={handleToggle}
        className={cn(
          'w-[18px] h-[18px] rounded-full border-[1.5px] flex-shrink-0 mt-0.5',
          'flex items-center justify-center transition-all duration-200',
          done
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-200 hover:border-[#6C63B6] hover:bg-[#F0EFFE]'
        )}
      >
        {done && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="scale-check">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-[13px] leading-snug',
            done ? 'line-through text-gray-300' : 'text-gray-700'
          )}
          style={{ letterSpacing: '-0.005em' }}>
            {task.is_boss_priority && !done && (
              <span className="text-[#6C63B6] mr-1.5 text-[11px]">★</span>
            )}
            {task.title}
          </p>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-300 text-base leading-none transition-all flex-shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          {showPriorityBadge && !done && (
            <Badge variant="priority" value={task.priority} />
          )}
          {!showPriorityBadge && !done && (
            <Badge variant="category" value={task.category} />
          )}
          {showDate && task.due_at && !done && (
            <span className="text-[10px] text-gray-400">{formatDate(task.due_at)}</span>
          )}
        </div>
      </div>
    </div>
  )
}