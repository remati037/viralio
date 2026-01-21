'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Handles authentication tokens passed in URL hash (fragment)
 * Supabase sometimes redirects with tokens in the hash instead of query params
 */
export default function HashTokenHandler() {
  const router = useRouter();
  const supabase = createClient();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || handled) return;

    const handleHashTokens = async () => {
      // Check if there are tokens in the URL hash
      const hash = window.location.hash;
      console.log('HashTokenHandler: Checking hash', { hash, pathname: window.location.pathname });
      
      if (!hash || hash.length <= 1) {
        setHandled(true);
        return;
      }

      // Parse hash parameters (format: #key=value&key2=value2)
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      const token = hashParams.get('token');
      const tokenHash = hashParams.get('token_hash');

      // If this is an invitation or recovery, redirect to set-password
      // User needs to set password first before we can use the session
      if ((type === 'invite' || type === 'recovery') && accessToken) {
        console.log('HashTokenHandler: Found recovery/invite tokens in hash, redirecting to set-password', { type, hasAccessToken: !!accessToken });
        
        // If we're already on set-password page, just update the URL with tokens
        if (window.location.pathname === '/auth/set-password') {
          const refreshToken = hashParams.get('refresh_token') || '';
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('access_token', accessToken);
          newUrl.searchParams.set('refresh_token', refreshToken);
          newUrl.searchParams.set('type', type);
          window.history.replaceState(null, '', newUrl.toString());
          setHandled(true);
          return;
        }
        
        // Otherwise redirect to set-password with tokens
        const redirectUrl = `/auth/set-password?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(hashParams.get('refresh_token') || '')}&type=${type}`;
        console.log('HashTokenHandler: Redirecting to', redirectUrl);
        window.history.replaceState(null, '', window.location.pathname);
        router.push(redirectUrl);
        setHandled(true);
        return;
      }

      // If we have an access_token (and it's not an invite), Supabase already authenticated the user
      if (accessToken) {
        try {
          // Set the session from the hash tokens
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (error) {
            console.error('Error setting session from hash:', error);
            // Clear the hash and continue
            window.history.replaceState(null, '', window.location.pathname);
            setHandled(true);
            return;
          }

          // If session was set successfully, redirect to home
          if (session) {
            window.history.replaceState(null, '', window.location.pathname);
            router.push('/');
            setHandled(true);
            return;
          }
        } catch (err) {
          console.error('Error handling hash tokens:', err);
          window.history.replaceState(null, '', window.location.pathname);
          setHandled(true);
        }
      } 
      // If we have a token but no access_token, it might be a verification token
      else if (token || tokenHash) {
        // Get the actual token value (we know at least one exists due to the condition above)
        const authToken = token || tokenHash;
        if (!authToken) {
          // This shouldn't happen due to the condition, but TypeScript needs this check
          setHandled(true);
          return;
        }

        // If we're already on set-password page, just update the URL with token
        if (window.location.pathname === '/auth/set-password') {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('token', authToken);
          if (type) {
            newUrl.searchParams.set('type', type);
          }
          window.history.replaceState(null, '', newUrl.toString());
          setHandled(true);
          return;
        }
        
        // Otherwise redirect to set-password with the token
        window.history.replaceState(null, '', window.location.pathname);
        router.push(`/auth/set-password?token=${authToken}${type ? `&type=${type}` : ''}`);
        setHandled(true);
        return;
      }

      // Clear hash if no tokens were found
      if (hash && !accessToken && !token && !tokenHash) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setHandled(true);
    };

    handleHashTokens();
  }, [router, supabase, handled]);

  // This component doesn't render anything
  return null;
}

