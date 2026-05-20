'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/follow-ups', label: 'Follow-ups', icon: '◎' },
  { href: '/tracker', label: 'Tracker', icon: '▦' },
  { href: '/notes', label: 'Notes', icon: '≡' },
  { href: '/calendar', label: 'Calendar', icon: '◻' },
]

function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isStandalone || installed) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#4CAF50' }}
        />
        <span
          className="text-[10px] font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          App installed ✓
        </span>
      </div>
    )
  }

  if (isIOS) {
    return (
      <div>
        <button
          onClick={() => setShowIOSHint(h => !h)}
          className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
          style={{
            background: 'rgba(124,58,237,0.2)',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          ↓ Install on iPhone
        </button>
        {showIOSHint && (
          <div
            className="mt-2 p-3 rounded-xl text-[10px] font-medium leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            Tap Safari's{' '}
            <strong style={{ color: '#fff' }}>Share</strong> button →{' '}
            <strong style={{ color: '#fff' }}>Add to Home Screen</strong> →{' '}
            <strong style={{ color: '#fff' }}>Add</strong>
          </div>
        )}
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={async () => {
          try {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
              setInstalled(true)
              setDeferredPrompt(null)
            }
          } catch (err) {
            console.error('Install error:', err)
          }
        }}
        className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
        style={{
          background: 'rgba(124,58,237,0.25)',
          color: 'rgba(255,255,255,0.8)',
        }}
      >
        ↓ Install app
      </button>
    )
  }

  return (
    <p
      className="text-[10px] px-2 leading-relaxed"
      style={{ color: 'rgba(255,255,255,0.2)' }}
    >
      Open in Chrome to install
    </p>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex flex-col w-56 h-screen sticky top-0 flex-shrink-0"
      style={{ background: '#1E1B4B' }}
    >
      <div
        className="px-5 py-5"
        style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#7C3AED' }}
          >
            <span className="text-white text-sm font-black">M</span>
          </div>
          <div>
            <span
              className="text-white font-bold text-[14px]"
              style={{ letterSpacing: '-0.02em' }}
            >
              Monica
            </span>
            <span
              className="text-[14px] font-light ml-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              OS
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p
          className="text-[9px] font-bold px-3 mb-3 tracking-[0.14em] uppercase"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Workspace
        </p>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 mb-0.5"
              style={{
                background: active ? 'rgba(124,58,237,0.25)' : 'transparent',
                color: active ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                fontWeight: active ? 600 : 400,
                borderLeft: active
                  ? '2px solid #7C3AED'
                  : '2px solid transparent',
              }}
            >
              <span className="text-sm w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div
        className="px-4 py-4"
        style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
            style={{ background: '#7C3AED', color: '#FFFFFF' }}
          >
            M
          </div>
          <div>
            <p
              className="text-[12px] font-semibold leading-tight"
              style={{ color: '#FFFFFF' }}
            >
              Monica
            </p>
            <p
              className="text-[10px]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Personal Assistant
            </p>
          </div>
        </div>
        <InstallButton />
      </div>
    </aside>
  )
}