'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: '⬡' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/follow-ups', label: 'Radar', icon: '◎' },
  { href: '/notes', label: 'Notes', icon: '≡' },
  { href: '/calendar', label: 'Calendar', icon: '◻' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-40">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]',
                active ? 'text-[#6C63B6]' : 'text-gray-300'
              )}
            >
              <span className={cn('text-base leading-none', active && 'scale-110')}>{item.icon}</span>
              <span className={cn(
                'text-[9px] font-medium tracking-wide',
                active ? 'text-[#6C63B6]' : 'text-gray-300'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}