'use client'

import { Sparkles, AlertCircle } from 'lucide-react'

interface AICreditBadgeProps {
  creditsRemaining: number
  maxCredits: number
  compact?: boolean
  showWarning?: boolean
}

export default function AICreditBadge({
  creditsRemaining,
  maxCredits,
  compact = false,
  showWarning = true,
}: AICreditBadgeProps) {
  const percentage = (creditsRemaining / maxCredits) * 100
  const isLow = percentage <= 20
  const isWarning = percentage <= 40 && percentage > 20
  const isEmpty = creditsRemaining === 0

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
          isEmpty
            ? 'bg-red-900/30 text-red-300 border border-red-800'
            : isLow
            ? 'bg-orange-900/30 text-orange-300 border border-orange-800'
            : isWarning
            ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800'
            : 'bg-slate-800 text-slate-300 border border-slate-700'
        }`}
        title={`AI Krediti: ${creditsRemaining}/${maxCredits} preostalo`}
      >
        {isEmpty ? (
          <AlertCircle size={12} />
        ) : (
          <Sparkles size={12} className={isEmpty ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-purple-400'} />
        )}
        <span>{creditsRemaining}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
        <Sparkles size={14} className={isEmpty ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-purple-400'} />
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">AI Krediti</span>
          <span
            className={`text-sm font-bold ${
              isEmpty ? 'text-red-400' : isLow ? 'text-orange-400' : isWarning ? 'text-yellow-400' : 'text-white'
            }`}
          >
            {creditsRemaining} / {maxCredits}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 max-w-[200px]">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isEmpty ? 'bg-red-500' : isLow ? 'bg-orange-500' : isWarning ? 'bg-yellow-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      </div>

      {showWarning && (isEmpty || isLow) && (
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${
            isEmpty
              ? 'bg-red-900/30 text-red-300 border border-red-800'
              : 'bg-orange-900/30 text-orange-300 border border-orange-800'
          }`}
        >
          {isEmpty ? 'Nema kredita' : 'Niski limit'}
        </div>
      )}
    </div>
  )
}

