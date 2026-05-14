'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem('pwa-install-dismissed')
    if (alreadyDismissed) return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setShow(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-40 slide-up">
      <div
        className="rounded-2xl p-4 border shadow-sm"
        style={{ background: '#FFFFFF', borderColor: '#ECEAE5' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B84CC 0%, #6C63B6 100%)' }}
          >
            <span className="text-white text-sm font-semibold">M</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-700 mb-0.5" style={{ letterSpacing: '-0.01em' }}>
              Install Monica OS
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
              Add to your home screen for offline access and a native app experience.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all active:scale-95"
                style={{ background: '#6C63B6' }}
              >
                Install app
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-200 hover:text-gray-400 text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}