'use client'

import { useState } from 'react'
import { createTask } from '@/lib/db.queries'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded?: () => void
}

export function AddTaskModal({ isOpen, onClose, onAdded }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('normal')
  const [category, setCategory] = useState('exec')
  const [isBoss, setIsBoss] = useState(false)
  const [dueAt, setDueAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await createTask({
      title: title.trim(),
      status: 'pending',
      priority: priority as any,
      category: category as any,
      is_boss_priority: isBoss,
      due_at: dueAt || undefined,
      source: 'manual',
    })
    setTitle('')
    setPriority('normal')
    setCategory('exec')
    setIsBoss(false)
    setDueAt('')
    onAdded?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl border border-gray-100 shadow-lg slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">New task</p>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to happen?"
            className="w-full text-sm text-gray-700 placeholder-gray-300 outline-none border-b border-gray-100 pb-2 focus:border-purple-300 transition-colors"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Priority</p>
              <div className="flex flex-wrap gap-1">
                {['urgent', 'high', 'normal', 'low'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      priority === p
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Category</p>
              <div className="flex flex-wrap gap-1">
                {['exec', 'delegate', 'admin', 'own'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium border transition-all ${
                      category === c
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIsBoss(!isBoss)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  isBoss ? 'bg-[#7C3AED] border-[#7C3AED]' : 'border-gray-300'
                }`}
              >
                {isBoss && <span className="text-white text-[8px]">★</span>}
              </div>
              <span className="text-xs text-gray-500">Boss priority</span>
            </label>
            <input
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              className="text-xs text-gray-500 outline-none border border-gray-100 rounded-lg px-2 py-1"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add task
          </button>
        </form>
      </div>
    </div>
  )
}