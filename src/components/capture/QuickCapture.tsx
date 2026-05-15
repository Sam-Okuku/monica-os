'use client'

import { useState, useEffect, useRef } from 'react'
import { createCapture } from '@/lib/db.queries'
import { autoTagCapture } from '@/lib/utils'

interface QuickCaptureProps {
  isOpen: boolean
  onClose: () => void
}

const TAG_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  task: { label: 'Task', bg: '#EDE9FE', text: '#4C1D95' },
  'follow-up': { label: 'Follow-up', bg: '#FFF9C4', text: '#7A6500' },
  verbal: { label: 'Verbal commit', bg: '#DBEAFE', text: '#1E40AF' },
  note: { label: 'Note', bg: '#F3F4F6', text: '#374151' },
  idea: { label: 'Idea', bg: '#D4EDDA', text: '#1A7A3A' },
}

export function QuickCapture({ isOpen, onClose }: QuickCaptureProps) {
  const [content, setContent] = useState('')
  const [detectedTag, setDetectedTag] = useState('task')
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 60)
      setContent('')
      setSaved(false)
      setDetectedTag('task')
    }
  }, [isOpen])

  useEffect(() => {
    if (content) setDetectedTag(autoTagCapture(content))
  }, [content])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSave = async () => {
    if (!content.trim()) return
    await createCapture({ content: content.trim(), auto_tag: detectedTag as any, status: 'raw' })
    setSaved(true)
    setTimeout(() => { onClose(); setContent(''); setSaved(false) }, 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
  }

  const tagConfig = TAG_CONFIG[detectedTag] ?? TAG_CONFIG.task

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(30,27,75,0.3)' }} />
      <div
        className="relative w-full max-w-md mx-4 mb-6 sm:mb-0 rounded-2xl overflow-hidden slide-up"
        style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '0.5px solid #F3F4F6' }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: '#6B7280' }}>
              Quick capture
            </p>
            <div className="flex items-center gap-2">
              {content && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: tagConfig.bg, color: tagConfig.text }}
                >
                  {tagConfig.label}
                </span>
              )}
              <button
                onClick={onClose}
                className="text-xl leading-none transition-colors"
                style={{ color: '#D1D5DB' }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Task, verbal commit, follow-up, idea…"
            className="w-full resize-none min-h-[90px] leading-relaxed"
            style={{
              fontSize: '14px',
              color: '#1E1B4B',
              fontWeight: 500,
              letterSpacing: '-0.005em',
            }}
            rows={3}
          />
        </div>

        <div className="px-5 pb-5 flex items-center justify-between">
          <p className="text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
            Ctrl+Enter to save · Esc to close
          </p>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-5 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: saved ? '#D4EDDA' : content.trim() ? '#7C3AED' : '#F3F4F6',
              color: saved ? '#1A7A3A' : content.trim() ? '#FFFFFF' : '#9CA3AF',
            }}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}