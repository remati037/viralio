import ViralVaultApp from '@/components/ViralVaultApp';
import SubscriptionGate from '@/components/SubscriptionGate';
import Skeleton from '@/components/ui/skeleton';
import { getUser } from '@/lib/utils/auth';
import { checkSubscriptionStatus } from '@/lib/utils/subscription';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; canceled?: string }>
}) {
  // The middleware proxy has already refreshed the session
  // So we can safely check for user here
  const user = await getUser()

  if (!user) {
    // If no user, redirect to login
    // This should only happen if cookies aren't set or session is invalid
    redirect('/login')
  }

  // Check subscription status
  const subscriptionStatus = await checkSubscriptionStatus(user.id)

  // Handle Stripe checkout success
  const params = await searchParams
  let finalSubscriptionStatus = subscriptionStatus
  
  if (params.session_id) {
    try {
      // Import and call verify function directly (server-side)
      const { verifyCheckoutSession } = await import('@/lib/utils/stripe-verify')
      const verifyResult = await verifyCheckoutSession(params.session_id, user.id)
      
      if (verifyResult.success) {
        // Immediately refresh subscription status after successful verification
        finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
        
        if (finalSubscriptionStatus.hasActiveSubscription) {
          // Redirect to clear the session_id from URL and show updated status
          redirect('/')
        }
      } else {
        // Log error but don't block the app - user can still access if they have subscription
        console.warn('Session verification failed:', verifyResult.error)
        // Check subscription status anyway in case webhook already processed it
        finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
        
        if (finalSubscriptionStatus.hasActiveSubscription) {
          // Redirect to clear the session_id from URL
          redirect('/')
        }
      }
    } catch (error) {
      // Don't block app if verification fails - just log and continue
      console.error('Error during session verification:', error)
      // Check subscription status anyway
      finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
      
      if (finalSubscriptionStatus.hasActiveSubscription) {
        redirect('/')
      }
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-4">
            <Skeleton height={40} width="300px" />
            <Skeleton height={20} width="500px" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <Skeleton height={50} />
              <Skeleton height={50} />
              <Skeleton height={50} />
            </div>
            <div className="lg:col-span-3 space-y-6">
              <Skeleton height={200} />
              <Skeleton height={300} />
            </div>
          </div>
        </div>
      </div>
    }>
      <SubscriptionGate
        userId={user.id}
        hasActiveSubscription={finalSubscriptionStatus.hasActiveSubscription}
      >
        <ViralVaultApp userId={user.id} />
      </SubscriptionGate>
    </Suspense>
  )
}
