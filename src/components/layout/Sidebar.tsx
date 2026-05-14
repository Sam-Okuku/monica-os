'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⬡' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/follow-ups', label: 'Follow-ups', icon: '◎' },
  { href: '/notes', label: 'Notes', icon: '≡' },
  { href: '/calendar', label: 'Calendar', icon: '◻' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B84CC 0%, #6C63B6 100%)' }}
          >
            <span className="text-white text-xs font-semibold tracking-tight">M</span>
          </div>
          <div>
            <span
              className="text-[13px] font-semibold tracking-tight"
              style={{ color: '#1C1B1A', letterSpacing: '-0.02em' }}
            >
              Monica
            </span>
            <span className="text-[13px] font-light ml-1" style={{ color: '#A8A6A0' }}>OS</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="text-[9px] font-semibold text-gray-300 tracking-[0.12em] uppercase px-3 mb-3">
          Workspace
        </p>
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 mb-0.5 group',
                active
                  ? 'bg-[#F0EFFE] text-[#6C63B6] font-medium'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              )}
            >
              <span className={cn(
                'text-sm w-4 text-center transition-all',
                active ? 'text-[#6C63B6]' : 'text-gray-300 group-hover:text-gray-400'
              )}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-50">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-semibold"
            style={{ background: 'linear-gradient(135deg, #8B84CC 0%, #6C63B6 100%)', color: '#FFFFFF' }}
          >
            M
          </div>
          <div>
            <p className="text-[12px] font-medium leading-tight" style={{ color: '#1C1B1A' }}>Monica</p>
            <p className="text-[10px]" style={{ color: '#A8A6A0' }}>Personal Assistant</p>
          </div>
        </div>
      </div>
    </aside>
  )
}