'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      setLoading(false);
      return;
    }

    try {
      const code = searchParams.get('code');
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      // Use token or token_hash (Supabase uses both)
      const authToken = token || tokenHash;

      if (!code && !authToken) {
        throw new Error('Nedostaje token za potvrdu. Molimo koristite link iz emaila.');
      }

      // If we have a code, exchange it first to get a session
      // Then update the password
      if (code) {
        // Exchange code for session (this verifies the invitation and creates a temporary session)
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          // If exchange fails, try alternative approach
          console.error('Error exchanging code:', exchangeError);
          throw new Error('Neispravan ili istekao link. Molimo zatražite novi link za postavljanje lozinke.');
        }

        // Now update the password (this also confirms the email)
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }

        // Verify session was created and is still valid
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          toast.success('Lozinka uspešno postavljena!', {
            description: 'Preusmeravanje...',
          });

          // Wait for cookies to be set
          await new Promise((resolve) => setTimeout(resolve, 400));

          // Redirect to home
          window.location.href = '/';
        } else {
          // Session might have expired, try to refresh
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          
          if (refreshedSession) {
            toast.success('Lozinka uspešno postavljena!', {
              description: 'Preusmeravanje...',
            });
            await new Promise((resolve) => setTimeout(resolve, 400));
            window.location.href = '/';
          } else {
            throw new Error('Neuspešno kreiranje sesije. Molimo pokušajte ponovo sa novim linkom.');
          }
        }
      } else if (authToken) {
        // Token-based flow using verifyOtp
        // Try different types if type is not provided
        const typesToTry: Array<'invite' | 'recovery' | 'signup' | 'email'> = 
          type ? [type as 'invite' | 'recovery' | 'signup' | 'email'] : ['invite', 'signup', 'email', 'recovery'];

        let verified = false;
        let lastError: any = null;

        // Try each type until one works
        for (const tryType of typesToTry) {
          try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: authToken,
              type: tryType,
            });

            if (!verifyError) {
              verified = true;
              console.log(`Successfully verified token with type: ${tryType}`);
              break;
            } else {
              lastError = verifyError;
              console.log(`Failed to verify with type ${tryType}:`, verifyError.message);
            }
          } catch (err: any) {
            lastError = err;
            console.log(`Error verifying with type ${tryType}:`, err.message);
          }
        }

        if (!verified) {
          throw lastError || new Error('Neispravan ili istekao token. Molimo zatražite novi link.');
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }

        // Verify we have a session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          toast.success('Lozinka uspešno postavljena!', {
            description: 'Preusmeravanje...',
          });

          // Wait for cookies to be set
          await new Promise((resolve) => setTimeout(resolve, 400));

          // Redirect to home
          window.location.href = '/';
        } else {
          // Try to refresh session
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          
          if (refreshedSession) {
            toast.success('Lozinka uspešno postavljena!', {
              description: 'Preusmeravanje...',
            });
            await new Promise((resolve) => setTimeout(resolve, 400));
            window.location.href = '/';
          } else {
            throw new Error('Neuspešno kreiranje sesije. Pokušajte ponovo.');
          }
        }
      } else {
        throw new Error('Neispravan token. Molimo koristite link iz emaila.');
      }
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške. Pokušajte ponovo.');
      toast.error('Greška', {
        description: err.message || 'Došlo je do greške. Pokušajte ponovo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
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

