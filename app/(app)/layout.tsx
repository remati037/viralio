import AppLayout from '@/components/AppLayout'
import SubscriptionGate from '@/components/SubscriptionGate'
import { getUser } from '@/lib/utils/auth'
import { checkSubscriptionStatus } from '@/lib/utils/subscription'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planer - Viralio',
  description: 'Upravljajte svojim kontentom sa Kanban tablom i kalendarom. Organizujte ideje, pratite napredak i postanite viralni.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const subscriptionStatus = await checkSubscriptionStatus(user.id)

  return (
    <SubscriptionGate userId={user.id} hasActiveSubscription={subscriptionStatus.hasActiveSubscription}>
      <AppLayout userId={user.id}>{children}</AppLayout>
    </SubscriptionGate>
  )
}

