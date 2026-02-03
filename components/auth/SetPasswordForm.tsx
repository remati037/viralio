/**
 * Set Password Form Component
 * Handles password setting for recovery and invite flows
 */

'use client';

import { updatePasswordAction } from '@/lib/auth/actions';
import { mapAuthErrorToSerbian } from '@/lib/auth/error-messages';
import { validatePassword } from '@/lib/auth/validation';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeAuth = async () => {
    try {
      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      const errorParam = searchParams.get('error');

      // Show error from URL if present
      if (errorParam) {
        setError(decodeURIComponent(errorParam));
      }

      // Check for hash tokens in URL (Supabase sometimes uses hash instead of query params)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const hashAccessToken = hashParams.get('access_token');
          const hashRefreshToken = hashParams.get('refresh_token');
          const hashType = hashParams.get('type');

          if (hashAccessToken && hashRefreshToken) {
            // Set session from hash tokens
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            });

            if (sessionError) {
              setError(mapAuthErrorToSerbian(sessionError.message));
              setInitializing(false);
              return;
            }

            if (session && (hashType === 'invite' || hashType === 'recovery')) {
              // Clear hash and continue - user can now set password
              window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search
              );
              setInitializing(false);
              return;
            } else if (session) {
              // Already authenticated, redirect
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/planner');
              return;
            }
          }
        }
      }

      // Handle PKCE code flow
      // Note: Code exchange should happen server-side in the page component
      // This is a fallback for cases where server-side exchange didn't happen
      if (code) {
        // First check if we already have a session (server-side exchange may have succeeded)
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (existingSession) {
          // Session already exists, server-side exchange worked
          // If type is invite/recovery, user needs to set password
          if (type === 'invite' || type === 'recovery') {
            setInitializing(false);
            return;
          }
          // Otherwise, redirect to dashboard
          router.push('/planner');
          return;
        }

        // No session exists, try client-side exchange as fallback
        const { data: sessionData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(mapAuthErrorToSerbian(exchangeError.message));
          setInitializing(false);
          return;
        }

        // Verify session exists
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('Neuspešno kreiranje sesije. Molimo zatražite novi link.');
          setInitializing(false);
          return;
        }

        // If type is invite/recovery, user needs to set password
        if (type === 'invite' || type === 'recovery') {
          setInitializing(false);
          return;
        }

        // Otherwise, redirect to dashboard
        router.push('/planner');
        return;
      }

      // Handle token-based flow (legacy)
      const authToken = token || tokenHash;
      if (authToken) {
        // Try to verify the token
        const typesToTry: Array<'invite' | 'recovery' | 'signup' | 'email'> =
          type
            ? [type as 'invite' | 'recovery' | 'signup' | 'email']
            : ['invite', 'recovery', 'signup', 'email'];

        let verified = false;
        let lastError: any = null;

        for (const tryType of typesToTry) {
          try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: authToken,
              type: tryType,
            });

            if (!verifyError) {
              verified = true;
              break;
            } else {
              lastError = verifyError;
            }
          } catch (err: any) {
            lastError = err;
          }
        }

        if (!verified) {
          setError(
            lastError?.message
              ? mapAuthErrorToSerbian(lastError.message)
              : 'Neispravan ili istekao token. Molimo zatražite novi link.'
          );
          setInitializing(false);
          return;
        }

        // Check if session exists after verification
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('Neuspešno kreiranje sesije. Molimo zatražite novi link.');
          setInitializing(false);
          return;
        }

        setInitializing(false);
        return;
      }

      // Handle access_token + refresh_token in query params (from hash redirect)
      if (accessToken && refreshToken) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError || !session) {
          setError('Neispravan token. Molimo koristite link iz emaila.');
          setInitializing(false);
          return;
        }

        setInitializing(false);
        return;
      }

      // Check if user already has a session (might have been set elsewhere)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // If no code/token but has session, check if they need to set password
        // This is a fallback - normally they should have a code/token
        if (type === 'invite' || type === 'recovery') {
          setInitializing(false);
          return;
        }

        // Otherwise redirect
        router.push('/planner');
        return;
      }

      // No valid authentication method found
      setError('Nedostaje token za potvrdu. Molimo koristite link iz emaila.');
      setInitializing(false);
    } catch (err: any) {
      console.error('Error initializing auth:', err);
      setError(err.message || 'Došlo je do greške. Pokušajte ponovo.');
      setInitializing(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Invalid password');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await updatePasswordAction({
        password,
        confirmPassword,
      });

      if (updateError) {
        throw new Error(updateError);
      }

      toast.success('Lozinka uspešno postavljena!', {
        description: 'Preusmeravanje...',
      });

      // Wait a moment for cookies to be set
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to dashboard
      window.location.href = '/planner';
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške. Pokušajte ponovo.');
      toast.error('Greška', {
        description: err.message || 'Došlo je do greške. Pokušajte ponovo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || initializing) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Viralio</h1>
          <p className="text-slate-400">Postavite lozinku</p>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
      </>
    );
  }

  // If there's an error and no way to authenticate, show error state
  if (
    error &&
    !searchParams.get('code') &&
    !searchParams.get('token') &&
    !searchParams.get('access_token')
  ) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Viralio</h1>
          <p className="text-slate-400">Postavite lozinku</p>
        </div>
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-sm">
          {error}
        </div>
        <p className="text-center text-slate-400 text-sm mt-4">
          Molimo koristite link iz emaila za postavljanje lozinke.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Viralio</h1>
        <p className="text-slate-400">Postavite lozinku za svoj nalog</p>
      </div>

      <form
        onSubmit={handleSetPassword}
        className="space-y-4"
        suppressHydrationWarning
      >
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Nova lozinka
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            suppressHydrationWarning
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-slate-500">
            Lozinka mora imati najmanje 6 karaktera
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Potvrdite lozinku
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            suppressHydrationWarning
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Postavljanje lozinke...</span>
            </>
          ) : (
            <span>Postavite lozinku</span>
          )}
        </button>
      </form>
    </>
  );
}
