import AppLayout from '@/components/AppLayout';
import SubscriptionGate from '@/components/SubscriptionGate';
import { getCurrentUser } from '@/lib/auth/utils';
import { createClient } from '@/lib/supabase/server';
import { checkSubscriptionStatus } from '@/lib/utils/subscription';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const [subscriptionStatus, profileResult] = await Promise.all([
    checkSubscriptionStatus(user.id),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single();
      return data;
    })(),
  ]);

  const displayName =
    profileResult?.business_name?.trim() ||
    (user.user_metadata?.business_name as string)?.trim() ||
    (user.user_metadata?.full_name as string)?.trim() ||
    (user.user_metadata?.name as string)?.trim() ||
    user.email ||
    'Korisnik';

  const navUser = {
    name: displayName,
    email: user.email ?? '',
    avatar: user.user_metadata?.avatar_url as string | undefined,
  };

  return (
    <SubscriptionGate
      userId={user.id}
      hasActiveSubscription={subscriptionStatus.hasActiveSubscription}
    >
      <AppLayout userId={user.id} user={navUser}>
        {children}
      </AppLayout>
    </SubscriptionGate>
  );
}
