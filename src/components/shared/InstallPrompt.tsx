'use client'

import { useState, useEffect } from 'react'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Check if already installed as standalone app
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    if (standalone) return

    // Check if already dismissed permanently
    try {
      if (localStorage.getItem('monica-installed') === 'true') return
    } catch {}

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    // Capture the deferred prompt if browser provides it
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Show the banner immediately — no delay, no waiting
    setShow(true)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = (permanent = false) => {
    setShow(false)
    if (permanent) {
      try { localStorage.setItem('monica-installed', 'true') } catch {}
    }
  }

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Browser supports automatic install
      setInstalling(true)
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          dismiss(true)
        }
      } catch {}
      setInstalling(false)
    } else {
      // No browser prompt available — show manual instructions
      // For Android/desktop without the event, open Chrome's menu manually
      // We dismiss and show a toast-style hint
      dismiss(false)
      // Show a temporary hint
      const hint = document.createElement('div')
      hint.innerHTML = `
        <div style="
          position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
          background:#1E1B4B; color:white; padding:12px 20px; border-radius:12px;
          font-size:12px; font-weight:600; z-index:9999; white-space:nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        ">
          Tap ⋮ menu → "Add to Home screen"
        </div>
      `
      document.body.appendChild(hint)
      setTimeout(() => document.body.removeChild(hint), 4000)
    }
  }

  if (!show || isStandalone) return null

  // iOS — needs manual instructions
  if (isIOS) {
    return (
      <div
        className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-50 slide-up"
        style={{ background: '#1E1B4B', borderTop: '2px solid #7C3AED' }}
      >
        <div className="max-w-2xl mx-auto px-5 py-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-lg"
              style={{ background: '#7C3AED' }}
            >
              M
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-white mb-1">
                Install Monica OS on your iPhone
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: '#7C3AED' }}
                  >1</span>
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Tap <strong className="text-white">Share ↑</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: '#7C3AED' }}
                  >2</span>
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Tap <strong className="text-white">Add to Home Screen</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: '#7C3AED' }}
                  >3</span>
                  <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Tap <strong className="text-white">Add</strong>
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => dismiss(false)}
              className="text-xl leading-none flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Android / Desktop — show install banner
  return (
    <div
      className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-50 slide-up"
      style={{ background: '#1E1B4B', borderTop: '2px solid #7C3AED' }}
    >
      <div className="max-w-2xl mx-auto px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-white text-lg"
            style={{ background: '#7C3AED' }}
          >
            M
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white">
              Install Monica OS
            </p>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Add to home screen · works offline · instant access
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-5 py-2 rounded-xl text-[12px] font-bold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ background: '#7C3AED' }}
            >
              {installing ? 'Installing…' : '↓ Install'}
            </button>
            <button
              onClick={() => dismiss(false)}
              className="px-3 py-2 rounded-xl text-[11px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}