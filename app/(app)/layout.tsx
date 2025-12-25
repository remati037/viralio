import AppLayout from '@/components/AppLayout'
import SubscriptionGate from '@/components/SubscriptionGate'
import { getUser } from '@/lib/utils/auth'
import { checkSubscriptionStatus } from '@/lib/utils/subscription'
import { redirect } from 'next/navigation'

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

