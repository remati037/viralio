'use client';

import { useAICredits } from '@/lib/hooks/useAICredits';
import { useUserId } from '@/components/UserContext';
import AICreditBadge from '@/components/ui/ai-credit-badge';
import Loader from '@/components/ui/loader';
import { Sparkles } from 'lucide-react';

export default function AICreditsPage() {
  const userId = useUserId();
  const { credits, loading: creditsLoading } = useAICredits(userId);

  if (!userId) {
    return <Loader fullScreen text="Učitavanje..." />;
  }

  return (
    <>
      <header className="mb-4 md:mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-purple-400" size={28} />
            AI Krediti
          </h1>
          <p className="text-slate-400 text-sm text-balance">
            Koristite AI funkcionalnosti za generisanje sadržaja. Svaki AI
            zahtev koristi 1 kredit.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {creditsLoading ? (
          <Loader text="Učitavanje kredita..." />
        ) : credits ? (
          <>
            <AICreditBadge
              creditsRemaining={credits.credits_remaining}
              maxCredits={credits.max_credits}
              compact={false}
              showWarning={true}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">Iskorišćeno</div>
                <div className="text-2xl font-bold text-white">
                  {credits.credits_used}
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">Preostalo</div>
                <div
                  className={`text-2xl font-bold ${
                    credits.credits_remaining === 0
                      ? 'text-red-400'
                      : credits.credits_remaining <= 100
                        ? 'text-orange-400'
                        : 'text-green-400'
                  }`}
                >
                  {credits.credits_remaining}
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                <div className="text-sm text-slate-400 mb-2">Resetuje se</div>
                <div className="text-2xl font-bold text-white">
                  {new Date(credits.reset_at).toLocaleDateString('sr-RS', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 text-blue-200">
              <p className="font-medium mb-2 text-lg">
                💡 Kako funkcionišu AI krediti?
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-blue-300">
                <li>
                  Svaki AI zahtev (generisanje sadržaja) koristi 1 kredit
                </li>
                <li>Imate {credits.max_credits} kredita mesečno</li>
                <li>
                  Krediti se automatski resetuju na početku svakog meseca
                </li>
                <li>Preostali krediti ne prelaze u sledeći mesec</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-slate-400">Greška pri učitavanju kredita</div>
        )}
      </div>
    </>
  );
}

