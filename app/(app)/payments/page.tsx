'use client';

import ProfilePayments from '@/components/ProfilePayments';
import Loader from '@/components/ui/loader';
import { useUserId } from '@/components/UserContext';
import { useProfile } from '@/lib/hooks/useProfile';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const userId = useUserId();
  const { profile } = useProfile(userId);

  if (!profile) {
    return <Loader fullScreen text="Učitavanje..." />;
  }

  return (
    <div className="max-w-4xl mx-auto rounded-lg border border-border bg-card p-5 shadow-sm lg:p-10">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
        <CreditCard className="text-primary" size={24} />
        Plaćanje
      </h1>
      <div className="space-y-6">
        <ProfilePayments profile={profile} />
      </div>
    </div>
  );
}
