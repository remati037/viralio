/**
 * Login and Sign Up Form Component
 * Handles both user login and registration
 */

'use client';

import { BUSINESS_CATEGORIES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { signUpAction, signInAction } from '@/lib/auth/actions';
import { validatePassword } from '@/lib/auth/utils';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Select from '../ui/select';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    // Check for error in URL (e.g., from auth callback)
    const errorParam = new URLSearchParams(window.location.search).get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      toast.error('Greška', {
        description: decodeURIComponent(errorParam),
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validate business name
        if (!businessName.trim()) {
          setError('Business name or personal name is required');
          toast.error('Greška', {
            description: 'Molimo unesite ime biznisa ili lično ime.',
          });
          setLoading(false);
          return;
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          setError(passwordValidation.error || 'Invalid password');
          toast.error('Greška', {
            description: passwordValidation.error,
          });
          setLoading(false);
          return;
        }

        // Sign up
        const { error: signUpError, user } = await signUpAction({
          email,
          password,
          businessName,
          businessCategory,
        });

        if (signUpError) {
          throw new Error(signUpError);
        }

        // Profile will be automatically created by database trigger
        toast.success('Nalog kreiran!', {
          description: 'Proverite email za verifikaciju naloga.',
        });
        setEmail('');
        setPassword('');
        setBusinessName('');
        setBusinessCategory('');
      } else {
        // Sign in
        const { error: signInError, session } = await signInAction({
          email,
          password,
        });

        if (signInError) {
          throw new Error(signInError);
        }

        if (!session) {
          setError('Failed to create session. Please try again.');
          toast.error('Greška pri prijavljivanju', {
            description: 'Neuspešno kreiranje sesije. Pokušajte ponovo.',
          });
          setLoading(false);
          return;
        }

        toast.success('Uspešno prijavljivanje!', {
          description: 'Preusmeravanje...',
        });

        // Wait for cookies to be set by the updated @supabase/ssr package
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Use full page reload to ensure cookies are sent
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message);
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
          <p className="text-slate-400">Prijavite se</p>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
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
        <p className="text-slate-400">
          {isSignUp
            ? 'Napravite novi nalog'
            : 'Prijavite se ukoliko već imate nalog'}
        </p>
      </div>

      <form
        onSubmit={handleAuth}
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
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            suppressHydrationWarning
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              Lozinka
            </label>
            {!isSignUp && (
              <a
                href="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Zaboravili ste lozinku?
              </a>
            )}
          </div>
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
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </div>

        {isSignUp && (
          <>
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Naziv firme ili lično ime i prezime{' '}
                <span className="text-red-400">*</span>
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                suppressHydrationWarning
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unesite naziv firme ili lično ime i prezime"
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="businessCategory"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Kategorija biznisa
              </label>
              <Select
                options={BUSINESS_CATEGORIES}
                value={businessCategory}
                onChange={setBusinessCategory}
                placeholder="Odaberite kategoriju Vašeg biznisa"
                className="w-full"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Učitavanje...</span>
            </>
          ) : (
            <span>{isSignUp ? 'Registrujte se' : 'Prijavite se'}</span>
          )}
        </button>
      </form>
    </>
  );
}
