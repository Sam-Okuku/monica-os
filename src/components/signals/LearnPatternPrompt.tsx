'use client'

import { useState, useEffect } from 'react'
import {
  getPendingLearningProposals,
  acceptLearningPattern,
  ignoreLearningPattern,
  LearningProposal,
} from '@/lib/signals/patternLearning'
import { SignalImpactBadge } from './SignalImpactBadge'

export function LearnPatternPrompt() {
  const [proposals, setProposals] = useState<LearningProposal[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    getPendingLearningProposals().then(setProposals)
  }, [])

  if (proposals.length === 0 || current >= proposals.length) return null

  const proposal = proposals[current]

  const handleAccept = async () => {
    await acceptLearningPattern(proposal)
    setCurrent(c => c + 1)
    setProposals(await getPendingLearningProposals())
  }

  const handleIgnore = async () => {
    await ignoreLearningPattern(proposal.senderEmail)
    setCurrent(c => c + 1)
    setProposals(await getPendingLearningProposals())
  }

  return (
    <div
      className="rounded-2xl p-4 mb-4 slide-up"
      style={{ background: '#1E1B4B', border: '0.5px solid rgba(124,58,237,0.3)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: '#7C3AED' }}
        >
          ✦
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Pattern recognised
          </p>
          <p className="text-[13px] font-bold text-white mb-2" style={{ letterSpacing: '-0.01em' }}>
            You have routed {proposal.count} emails from{' '}
            <span style={{ color: '#C4B5FD' }}>{proposal.senderName}</span> to{' '}
            <span style={{ color: '#C4B5FD' }}>{proposal.destination}</span>.
          </p>
          <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Future emails from {proposal.senderName.split(' ')[0]} can default to{' '}
            {proposal.destination} suggestions, skipping the full review card.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all active:scale-95"
              style={{ background: '#7C3AED' }}
            >
              Yes, learn this
            </button>
            <button
              onClick={handleIgnore}
              className="px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              No, keep reviewing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}