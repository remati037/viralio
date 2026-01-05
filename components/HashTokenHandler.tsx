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

      // If we have an access_token, Supabase already authenticated the user
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

          // If this is an invitation and user needs to set password
          if (type === 'invite' && session) {
            // Check if user has a password set by trying to get user
            // If they don't have a password, redirect to set-password
            // For now, if type is invite, always redirect to set-password
            window.history.replaceState(null, '', window.location.pathname);
            router.push('/auth/set-password');
            setHandled(true);
            return;
          }

          // If session was set successfully and it's not an invite, redirect to home
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
        // Redirect to set-password with the token
        const authToken = token || tokenHash;
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

