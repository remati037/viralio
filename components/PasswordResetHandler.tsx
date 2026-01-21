'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Client-side handler specifically for password reset redirects
 * Handles cases where Supabase redirects to root with hash or query parameters
 */
export default function PasswordResetHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || handled) return;

    const handleReset = async () => {
      // Check for hash parameters first (Supabase often uses hash for redirects)
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // If we have recovery tokens in hash, redirect to set-password
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Password reset: Found recovery tokens in hash, redirecting to set-password');
          const redirectUrl = `/auth/set-password?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&type=recovery`;
          window.history.replaceState(null, '', window.location.pathname);
          router.push(redirectUrl);
          setHandled(true);
          return;
        }
      }

      // Check for query parameters (token, token_hash, type)
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if ((token || tokenHash) && type === 'recovery') {
        const authToken = token || tokenHash;
        console.log('Password reset: Found recovery token in query params, redirecting to set-password');
        const redirectUrl = `/auth/set-password?token=${authToken}&type=recovery`;
        router.push(redirectUrl);
        setHandled(true);
        return;
      }

      // Check for access_token in query params (less common but possible)
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const queryType = searchParams.get('type');

      if (queryType === 'recovery' && accessToken && refreshToken) {
        console.log('Password reset: Found recovery tokens in query params, redirecting to set-password');
        const redirectUrl = `/auth/set-password?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&type=recovery`;
        router.push(redirectUrl);
        setHandled(true);
        return;
      }

      setHandled(true);
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(handleReset, 100);
    return () => clearTimeout(timer);
  }, [router, searchParams, handled]);

  return null;
}
