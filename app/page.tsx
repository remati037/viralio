import { getUser } from '@/lib/utils/auth';
import { checkSubscriptionStatus } from '@/lib/utils/subscription';
import { redirect } from 'next/navigation';

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
          redirect('/planner')
        }
      } else {
        // Log error but don't block the app - user can still access if they have subscription
        console.warn('Session verification failed:', verifyResult.error)
        // Check subscription status anyway in case webhook already processed it
        finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
        
        if (finalSubscriptionStatus.hasActiveSubscription) {
          // Redirect to clear the session_id from URL
          redirect('/planner')
        }
      }
    } catch (error) {
      // Don't block app if verification fails - just log and continue
      console.error('Error during session verification:', error)
      // Check subscription status anyway
      finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
      
      if (finalSubscriptionStatus.hasActiveSubscription) {
        redirect('/planner')
      }
    }
  }

  // Redirect to planner by default
  redirect('/planner')
}
