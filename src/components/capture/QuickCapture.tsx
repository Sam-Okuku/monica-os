'use client'

import { useState, useEffect, useRef } from 'react'
import { createCapture } from '@/lib/db.queries'
import { autoTagCapture } from '@/lib/utils'

interface QuickCaptureProps {
  isOpen: boolean
  onClose: () => void
}

const TAG_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  task: { label: 'Task', bg: '#F0EFFE', text: '#6C63B6' },
  'follow-up': { label: 'Follow-up', bg: '#FEF3E2', text: '#D4860A' },
  verbal: { label: 'Verbal commit', bg: '#EEF2FF', text: '#4F46E5' },
  note: { label: 'Note', bg: '#F5F4F2', text: '#7A7874' },
  idea: { label: 'Idea', bg: '#E4F5EE', text: '#1D9E75' },
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
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      <div
        className="relative w-full max-w-md mx-4 mb-6 sm:mb-0 bg-white rounded-2xl border border-gray-100 shadow-sm slide-up overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-gray-400 tracking-wider uppercase">
              Quick capture
            </p>
            <div className="flex items-center gap-2">
              {content && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: tagConfig.bg, color: tagConfig.text }}
                >
                  {tagConfig.label}
                </span>
              )}
              <button
                onClick={onClose}
                className="text-gray-200 hover:text-gray-400 text-xl leading-none transition-colors"
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
            className="w-full text-[14px] text-gray-700 placeholder-gray-300 resize-none min-h-[90px] leading-relaxed"
            style={{ letterSpacing: '-0.005em' }}
            rows={3}
          />
        </div>

        <div className="px-5 pb-5 flex items-center justify-between">
          <p className="text-[10px] text-gray-300">Ctrl+Enter to save · Esc to close</p>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="px-5 py-2 rounded-xl text-[12px] font-medium transition-all active:scale-95"
            style={{
              background: saved ? '#E4F5EE' : content.trim() ? '#6C63B6' : '#F5F4F2',
              color: saved ? '#1D9E75' : content.trim() ? '#FFFFFF' : '#A8A6A0',
            }}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}