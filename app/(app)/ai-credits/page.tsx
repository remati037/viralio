'use client';

import { useUserId } from '@/components/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Loader from '@/components/ui/loader';
import { useAICredits } from '@/lib/hooks/useAICredits';

const cardBase =
  'bg-gradient-to-b from-background to-muted border border-border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20';

export default function AICreditsPage() {
  const userId = useUserId();
  const { credits, loading: creditsLoading } = useAICredits(userId);

  if (!userId) {
    return <Loader fullScreen text="Učitavanje..." />;
  }

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      <header>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            AI Krediti
          </h1>
          <p className="text-muted-foreground max-w-2xl">
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
            {/* <Card className={cardBase}>
              <CardContent className="p-4 md:p-6">
                <AICreditBadge
                  creditsRemaining={credits.credits_remaining}
                  maxCredits={credits.max_credits}
                  compact={false}
                  showWarning={true}
                />
              </CardContent>
            </Card> */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className={cardBase}>
                <CardContent className="p-4 md:p-5">
                  <div className="text-sm text-muted-foreground mb-2">
                    Iskorišćeno
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {credits.credits_used}
                  </div>
                </CardContent>
              </Card>
              <Card className={cardBase}>
                <CardContent className="p-4 md:p-5">
                  <div className="text-sm text-muted-foreground mb-2">
                    Preostalo
                  </div>
                  <div
                    className={`text-2xl font-bold tabular-nums ${
                      credits.credits_remaining === 0
                        ? 'text-destructive'
                        : credits.credits_remaining <= 100
                          ? 'text-chart-5'
                          : 'text-chart-2'
                    }`}
                  >
                    {credits.credits_remaining}
                  </div>
                </CardContent>
              </Card>
              <Card className={cardBase}>
                <CardContent className="p-4 md:p-5">
                  <div className="text-sm text-muted-foreground mb-2">
                    Resetuje se
                  </div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {new Date(credits.reset_at).toLocaleDateString('sr-RS', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card
              className={`${cardBase} bg-gradient-to-b from-primary/5 to-muted border-primary/20`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  Kako funkcionišu AI krediti?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    Svaki AI zahtev (generisanje sadržaja) koristi 1 kredit
                  </li>
                  <li>Imaš {credits.max_credits} kredita mesečno</li>
                  <li>
                    Krediti se automatski resetuju na početku svakog meseca
                  </li>
                  <li>Preostali krediti ne prelaze u sledeći mesec</li>
                </ul>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className={cardBase}>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Greška pri učitavanju kredita
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
