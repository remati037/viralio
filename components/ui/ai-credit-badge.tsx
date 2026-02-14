'use client';

import { AlertCircle, Sparkles } from 'lucide-react';

interface AICreditBadgeProps {
  creditsRemaining: number;
  maxCredits: number;
  compact?: boolean;
  showWarning?: boolean;
}

export default function AICreditBadge({
  creditsRemaining,
  maxCredits,
  compact = false,
  showWarning = true,
}: AICreditBadgeProps) {
  const percentage = (creditsRemaining / maxCredits) * 100;
  const isLow = percentage <= 20;
  const isWarning = percentage <= 40 && percentage > 20;
  const isEmpty = creditsRemaining === 0;

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
          <Sparkles
            size={12}
            className={
              isEmpty
                ? 'text-red-400'
                : isLow
                  ? 'text-orange-400'
                  : 'text-purple-400'
            }
          />
        )}
        <span>{creditsRemaining}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border w-full justify-center">
        <span
          className={`text-lg font-bold tabular-nums ${
            isEmpty
              ? 'text-destructive'
              : isLow
                ? 'text-chart-5'
                : isWarning
                  ? 'text-chart-4'
                  : 'text-foreground'
          }`}
        >
          {creditsRemaining} / {maxCredits}
        </span>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden w-full">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isEmpty
                ? 'bg-destructive'
                : isLow
                  ? 'bg-chart-5'
                  : isWarning
                    ? 'bg-chart-4'
                    : 'bg-gradient-to-r from-chart-4 to-chart-1'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
          />
        </div>
      </div>

      {showWarning && (isEmpty || isLow) && (
        <div
          className={`px-3 py-1.5 rounded-lg text-xs font-medium w-full text-center ${
            isEmpty
              ? 'bg-destructive/10 text-destructive border border-border'
              : 'bg-chart-5/10 text-chart-5 border border-border'
          }`}
        >
          {isEmpty ? 'Nema kredita' : 'Niski limit'}
        </div>
      )}
    </div>
  );
}
