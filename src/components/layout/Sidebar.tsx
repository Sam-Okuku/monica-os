'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/follow-ups', label: 'Follow-ups', icon: '◎' },
  { href: '/tracker', label: 'Tracker', icon: '▦' },
  { href: '/notes', label: 'Notes', icon: '≡' },
  { href: '/calendar', label: 'Calendar', icon: '◻' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex flex-col w-56 h-screen sticky top-0 flex-shrink-0"
      style={{ background: '#1E1B4B' }}
    >
      <div className="px-5 py-5" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#7C3AED' }}
          >
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <div>
            <span className="text-white font-bold text-[14px]" style={{ letterSpacing: '-0.02em' }}>
              Monica
            </span>
            <span className="text-[14px] font-light ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              OS
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p
          className="text-[9px] font-semibold px-3 mb-3 tracking-[0.14em] uppercase"
          style={{ color: 'rgba(255,255,255,0.3)' }}
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
                borderLeft: active ? '2px solid #7C3AED' : '2px solid transparent',
              }}
            >
              <span className="text-sm w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-bold"
            style={{ background: '#7C3AED', color: '#FFFFFF' }}
          >
            M
          </div>
          <div>
            <p className="text-[12px] font-semibold leading-tight text-white">Monica</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Personal Assistant
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}