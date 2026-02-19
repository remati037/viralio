import { getUser } from '@/lib/utils/auth';
import { checkSubscriptionStatus } from '@/lib/utils/subscription';
import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ 
    session_id?: string; 
    canceled?: string;
    token?: string;
    token_hash?: string;
    type?: string;
    access_token?: string;
    refresh_token?: string;
    code?: string;
  }>
}) {
  const params = await searchParams;
  
  // Handle PKCE code from Supabase (password reset, email verification, etc.)
  // Supabase may redirect to root URL with code parameter instead of callback
  if (params.code) {
    const type = params.type;
    // Redirect to callback; pass type as-is (signup/email → confirm-success, recovery/invite → set-password)
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}${type ? `&type=${encodeURIComponent(type)}` : ''}`);
  }
  
  // Handle password reset/invite tokens from Supabase verify redirect (query params)
  // Hash parameters are handled by HashTokenHandler in layout
  if (params.token || params.token_hash) {
    const token = params.token || params.token_hash;
    const type = params.type || 'recovery';
    redirect(`/auth/set-password?token=${token}&type=${type}`);
  }

  // Handle access_token in query params (less common)
  if (params.access_token && params.refresh_token && params.type === 'recovery') {
    redirect(`/auth/set-password?access_token=${params.access_token}&refresh_token=${params.refresh_token}&type=recovery`);
  }

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
          redirect('/pocetna')
        }
      } else {
        // Log error but don't block the app - user can still access if they have subscription
        console.warn('Session verification failed:', verifyResult.error)
        // Check subscription status anyway in case webhook already processed it
        finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
        
        if (finalSubscriptionStatus.hasActiveSubscription) {
          // Redirect to clear the session_id from URL
          redirect('/pocetna')
        }
      }
    } catch (error) {
      // Don't block app if verification fails - just log and continue
      console.error('Error during session verification:', error)
      // Check subscription status anyway
      finalSubscriptionStatus = await checkSubscriptionStatus(user.id)
      
      if (finalSubscriptionStatus.hasActiveSubscription) {
        redirect('/pocetna')
      }
    }
  }

  // Redirect to Početna (home dashboard) by default
  redirect('/pocetna')
}
