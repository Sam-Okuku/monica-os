'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { EmptyState } from '@/components/shared/EmptyState'
import { createNote, updateNote, deleteNote } from '@/lib/db.queries'
import { formatDate } from '@/lib/utils'
import { Note } from '@/lib/db'

export default function NotesPage() {
  const [selected, setSelected] = useState<Note | null>(null)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [refresh, setRefresh] = useState(0)
  const forceRefresh = useCallback(() => setRefresh(r => r + 1), [])

  const notes = useLiveQuery(
    () => db.notes.orderBy('created_at').reverse().toArray(), [refresh]
  ) ?? []

  const filtered = useMemo(() =>
    search.trim()
      ? notes.filter(n =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
        )
      : notes
  , [notes, search])

  const handleCreate = async () => {
    if (!title.trim()) return
    await createNote({ title: title.trim(), content, action_items: '[]' })
    setTitle(''); setContent(''); setCreating(false); forceRefresh()
  }

  const handleSelect = (note: Note) => {
    setSelected(note); setTitle(note.title); setContent(note.content); setCreating(false)
  }

  const handleUpdate = async () => {
    if (!selected?.id) return
    await updateNote(selected.id, { title, content })
    setSelected(null); setTitle(''); setContent(''); forceRefresh()
  }

  const handleDelete = async (id: number) => {
    await deleteNote(id)
    if (selected?.id === id) { setSelected(null); setTitle(''); setContent('') }
    forceRefresh()
  }

  const handleNew = () => {
    setCreating(true); setSelected(null); setTitle(''); setContent('')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F0EFFF' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 lg:pb-0">
        <div className="bg-white border-b border-gray-100 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="monica-page-title">Notes</h1>
              <p className="monica-page-sub">{notes.length} saved locally on this device</p>
            </div>
            <button
              onClick={handleNew}
              className="text-white text-[11px] font-medium px-4 py-2 rounded-full transition-all active:scale-95"
              style={{ background: '#6C63B6' }}
            >
              + New note
            </button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full max-w-xs text-[12px] text-gray-600 placeholder-gray-300 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 focus:bg-white focus:border-purple-200 transition-all"
          />
        </div>

        <main className="flex-1 p-4 lg:p-6 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="monica-card overflow-hidden">
              <div className="monica-section-head">
                <p className="monica-label">All notes</p>
              </div>
              {filtered.length === 0 ? (
                <EmptyState
                  icon="≡"
                  title={search ? 'No matching notes' : 'Nothing captured yet'}
                  description={search ? 'Try a different search term' : 'Your thinking starts here'}
                  action={!search ? { label: 'Create first note', onClick: handleNew } : undefined}
                />
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleSelect(note)}
                      className="px-4 py-3 cursor-pointer transition-all group"
                      style={{
                        background: selected?.id === note.id ? '#F8F7FF' : 'transparent',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-[13px] font-medium truncate"
                          style={{
                            color: selected?.id === note.id ? '#6C63B6' : '#4A4846',
                            letterSpacing: '-0.005em'
                          }}
                        >
                          {note.title}
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(note.id!) }}
                          className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-red-300 text-base leading-none transition-all flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-300 mt-0.5">{formatDate(note.created_at)}</p>
                      {note.content && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate leading-relaxed">
                          {note.content.slice(0, 65)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {(creating || selected) ? (
                <div className="monica-card p-6">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Note title…"
                    className="w-full text-[17px] font-medium text-gray-800 placeholder-gray-200 border-b border-gray-100 pb-3 mb-5 focus:border-purple-200 transition-colors"
                    style={{ letterSpacing: '-0.01em' }}
                  />
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Start writing…"
                    className="w-full text-[13px] text-gray-600 placeholder-gray-300 resize-none leading-relaxed min-h-[320px]"
                    style={{ letterSpacing: '-0.005em' }}
                  />
                  <div className="flex gap-2 mt-5 pt-4 border-t border-gray-50">
                    <button
                      onClick={creating ? handleCreate : handleUpdate}
                      disabled={!title.trim()}
                      className="px-5 py-2 text-white text-[12px] font-medium rounded-lg disabled:opacity-30 active:scale-95 transition-all"
                      style={{ background: '#6C63B6' }}
                    >
                      {creating ? 'Save note' : 'Update note'}
                    </button>
                    <button
                      onClick={() => { setSelected(null); setCreating(false); setTitle(''); setContent('') }}
                      className="px-5 py-2 text-gray-400 text-[12px] rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="monica-card flex items-center justify-center min-h-[300px]"
                  style={{ background: '#FAFAF9' }}
                >
                  <EmptyState
                    icon="≡"
                    title="Select a note to read or edit"
                    description="All notes are saved offline on your device"
                    action={{ label: 'Or create a new note', onClick: handleNew }}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}