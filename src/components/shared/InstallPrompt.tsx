'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isChrome: false, isStandalone: false }
  }
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isChrome = /Chrome/.test(ua) && !/Chromium/.test(ua) && !/Edge/.test(ua)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  return { isIOS, isAndroid, isChrome, isStandalone }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [showDesktop, setShowDesktop] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    try {
      const wasDismissed = localStorage.getItem('pwa-install-dismissed-v2')
      if (wasDismissed) return
    } catch {
      return
    }

    const { isIOS, isAndroid, isChrome, isStandalone } = getDeviceInfo()

    if (isStandalone) return

    if (isIOS) {
      const timer = setTimeout(() => setShowIOS(true), 5000)
      return () => clearTimeout(timer)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const timer = setTimeout(() => {
        if (isAndroid) setShowAndroid(true)
        else if (isChrome) setShowDesktop(true)
      }, 3000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setShowAndroid(false)
    setShowIOS(false)
    setShowDesktop(false)
    setDismissed(true)
    try {
      localStorage.setItem('pwa-install-dismissed-v2', 'true')
    } catch {}
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowAndroid(false)
        setShowDesktop(false)
        setDismissed(true)
        try {
          localStorage.setItem('pwa-install-dismissed-v2', 'true')
        } catch {}
      }
    } catch (err) {
      console.error('Install prompt error:', err)
    }
    setInstalling(false)
  }

  if (!mounted || dismissed) return null

  if (showIOS) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 slide-up">
        <div
          className="rounded-2xl p-4 shadow-lg"
          style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-black text-white"
              style={{ background: '#7C3AED' }}
            >
              M
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-bold mb-0.5"
                style={{ color: '#1E1B4B' }}
              >
                Install Monica OS
              </p>
              <p
                className="text-[11px] font-medium mb-3"
                style={{ color: '#4B5563' }}
              >
                Add to your home screen for offline access
              </p>

              <div className="space-y-2 mb-3">
                {[
                  "Tap the Share button at the bottom of Safari",
                  "Scroll and tap Add to Home Screen",
                  "Tap Add — done",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white mt-0.5"
                      style={{ background: '#7C3AED', minWidth: '20px' }}
                    >
                      {i + 1}
                    </span>
                    <p
                      className="text-[11px] font-medium leading-relaxed"
                      style={{ color: '#374151' }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="flex items-center gap-2 pt-2"
                style={{ borderTop: '0.5px solid #F3F4F6' }}
              >
                <div
                  className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-bold text-white"
                  style={{ background: '#4CAF50' }}
                >
                  Works offline once installed ✓
                </div>
                <button
                  onClick={dismiss}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                >
                  Later
                </button>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="text-xl leading-none flex-shrink-0"
              style={{ color: '#D1D5DB' }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showAndroid || showDesktop) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-80 z-50 slide-up">
        <div
          className="rounded-2xl p-4 shadow-lg"
          style={{ background: '#FFFFFF', border: '0.5px solid #E5E7EB' }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-black text-white"
              style={{ background: '#7C3AED' }}
            >
              M
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-bold mb-0.5"
                style={{ color: '#1E1B4B' }}
              >
                Install Monica OS
              </p>
              <p
                className="text-[11px] font-medium leading-relaxed mb-3"
                style={{ color: '#4B5563' }}
              >
                Add to your {showAndroid ? 'home screen' : 'desktop'} for
                instant access and full offline support.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 py-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: '#7C3AED' }}
                >
                  {installing ? 'Installing…' : '↓ Install app'}
                </button>
                <button
                  onClick={dismiss}
                  className="px-3 py-2 rounded-xl text-[11px] font-semibold"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                >
                  Not now
                </button>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="text-xl leading-none flex-shrink-0"
              style={{ color: '#D1D5DB' }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}