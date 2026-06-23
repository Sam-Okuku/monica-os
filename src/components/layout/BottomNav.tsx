'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Home', icon: '⬡' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/tracker', label: 'Tracker', icon: '▦' },
  { href: '/signals', label: 'Signals', icon: '✦' },
  { href: '/follow-ups', label: 'Radar', icon: '◎' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{ background: '#1E1B4B', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all"
              style={{ color: active ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}