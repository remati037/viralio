'use client';

import { createClient } from '@/lib/supabase/client';
import type { Payment, Profile } from '@/types';
import { Calendar, CreditCard, ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CancelSubscriptionModal from './CancelSubscriptionModal';
import Loader from './ui/loader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import Skeleton from './ui/skeleton';

export interface ProfilePaymentsProps {
  profile: Profile | null;
  className?: string;
}

export default function ProfilePayments({
  profile,
  className,
}: ProfilePaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isCancelled: boolean;
    hasActiveSubscription: boolean;
    isTrialing?: boolean;
    trialDaysRemaining?: number | null;
    trialEnd?: number | null;
    currentPeriodEnd?: number | null;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (profile?.id) {
      fetchPayments();
      fetchSubscriptionStatus();
    }
  }, [profile?.id]);

  const fetchSubscriptionStatus = async () => {
    if (!profile?.id) return;
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/stripe/subscription-status');
      const data = await response.json();
      setSubscriptionStatus(data);
    } catch (error: unknown) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchPayments = async () => {
    if (!profile?.id) return;
    setLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Greška pri učitavanju platnih podataka', {
        description: message,
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const nextPayment = payments.find(
    (p) => p.next_payment_date && new Date(p.next_payment_date) > new Date()
  );

  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open Stripe portal');
      }
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška';
      toast.error('Greška pri otvaranju Stripe portala', { description: message });
    } finally {
      setPortalLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className={className}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CreditCard size={20} className="text-primary" /> Trenutni plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayments || loadingStatus ? (
              <div className="space-y-4 py-4">
                <Skeleton height={30} width="200px" />
                <Skeleton height={40} width="150px" />
                <Skeleton height={20} width="250px" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-muted-foreground text-sm mb-1">
                    Trenutni tier
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {profile?.tier?.toUpperCase() || 'FREE'}
                  </div>
                </div>

                {subscriptionStatus?.isTrialing &&
                  subscriptionStatus.trialEnd && (
                    <div className="rounded-lg border border-border bg-primary/5 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="text-primary" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-primary mb-1">
                            Besplatni probni period
                          </div>
                          <div className="text-foreground text-lg font-semibold mb-2">
                            {subscriptionStatus.trialDaysRemaining !== null &&
                            subscriptionStatus.trialDaysRemaining !== undefined
                              ? `${subscriptionStatus.trialDaysRemaining} ${subscriptionStatus.trialDaysRemaining === 1 ? 'dan' : 'dana'} preostalo`
                              : 'Aktivan besplatni probni period'}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            Prvo plaćanje:{' '}
                            {new Date(
                              subscriptionStatus.trialEnd * 1000
                            ).toLocaleDateString('sr-RS', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {!subscriptionStatus?.isTrialing &&
                  nextPayment &&
                  !subscriptionStatus?.isCancelled && (
                    <div>
                      <div className="text-muted-foreground text-sm mb-1 flex items-center gap-2">
                        <Calendar size={14} /> Sledeće Plaćanje
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {new Date(
                          nextPayment.next_payment_date!
                        ).toLocaleDateString('sr-RS', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                {subscriptionStatus?.isTrialing &&
                  subscriptionStatus.trialEnd &&
                  !subscriptionStatus?.isCancelled && (
                    <div>
                      <div className="text-muted-foreground text-sm mb-1 flex items-center gap-2">
                        <Calendar size={14} /> Prvo Plaćanje
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {new Date(
                          subscriptionStatus.trialEnd * 1000
                        ).toLocaleDateString('sr-RS', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                {subscriptionStatus?.isCancelled && (
                  <div>
                    <div className="text-muted-foreground text-sm mb-1 flex items-center gap-2">
                      <Calendar size={14} /> Pretplata ističe
                    </div>
                    <div className="text-lg font-semibold text-muted-foreground">
                      {(() => {
                        if (
                          subscriptionStatus.isTrialing &&
                          subscriptionStatus.trialEnd
                        ) {
                          return new Date(
                            subscriptionStatus.trialEnd * 1000
                          ).toLocaleDateString('sr-RS', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        }
                        if (subscriptionStatus.currentPeriodEnd) {
                          return new Date(
                            subscriptionStatus.currentPeriodEnd * 1000
                          ).toLocaleDateString('sr-RS', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        }
                        if (nextPayment?.subscription_period_end) {
                          return new Date(
                            nextPayment.subscription_period_end
                          ).toLocaleDateString('sr-RS', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                        }
                        return 'N/A';
                      })()}
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      Sve funkcionalnosti će biti dostupne do ovog datuma
                    </p>
                  </div>
                )}

                {profile?.tier === 'pro' && nextPayment && (
                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    {subscriptionStatus?.isCancelled ? (
                      <div className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 font-medium text-muted-foreground">
                        <X size={16} />
                        Otkazali ste pretplatu
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={openStripePortal}
                          disabled={loadingStatus || portalLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {portalLoading ? (
                            <>
                              <Loader size="sm" />
                              <span>Učitavanje...</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink size={16} />
                              Upravljaj pretplatom na Stripe
                            </>
                          )}
                        </button>
                        <p className="text-muted-foreground text-center text-xs">
                          Na Stripe stranici možete otkazati pretplatu, promeniti
                          karticu ili pogledati račune. Povratak na: Plaćanje.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Istorija plaćanja</CardTitle>
            <CardDescription className="text-muted-foreground">
              Pregled svih vaših transakcija
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <div className="space-y-3 py-4">
                <Skeleton height={80} />
                <Skeleton height={80} />
                <Skeleton height={80} />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center text-sm">
                Nema platnih podataka. Plaćanja će se prikazati ovde kada se
                pretplatite.
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        ${payment.amount} {payment.currency}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {new Date(payment.created_at).toLocaleDateString(
                          'sr-RS',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </div>
                      {payment.tier_at_payment && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          Tier: {payment.tier_at_payment.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          payment.status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : payment.status === 'pending'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        subscriptionEndDate={nextPayment?.subscription_period_end || null}
        trialEndDate={subscriptionStatus?.trialEnd || null}
        isTrialing={subscriptionStatus?.isTrialing || false}
        onCancelSuccess={() => {
          fetchPayments();
          fetchSubscriptionStatus();
        }}
      />
    </div>
  );
}
