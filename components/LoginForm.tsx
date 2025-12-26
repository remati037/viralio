'use client';

import { BUSINESS_CATEGORIES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Select from './ui/select';

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

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              business_name: businessName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        // Update profile with business name and category immediately after signup
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              business_name: businessName.trim(),
              business_category: businessCategory || null,
            })
            .eq('id', data.user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
            // Don't fail signup if profile update fails, but log it
          }
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
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          throw signInError;
        }

        if (!data.session) {
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
        // The new version handles cookies better
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
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Lozinka
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
              {/* <p className="mt-1 text-xs text-slate-500">
                This will be used to identify your account
              </p> */}
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
              {/* <p className="mt-1 text-xs text-slate-500">
                Help us personalize your experience
              </p> */}
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

      {/* <div className="mt-6 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-400 hover:text-blue-300"
          type="button"
        >
          {isSignUp ? 'Već imate nalog? Prijavite se' : "Nemate nalog? Registrujte se"}
        </button>
      </div> */}
    </>
  );
}
