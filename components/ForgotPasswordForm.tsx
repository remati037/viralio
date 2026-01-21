'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    // Check for error in URL (e.g., from expired OTP)
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      toast.error('Greška', {
        description: decodeURIComponent(errorParam),
      });
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    console.log(window.location.origin);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      toast.success('Email poslat!', {
        description:
          'Proverite svoj email za link za resetovanje lozinke. Link je važeći 1 sat.',
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Greška', {
        description:
          err.message ||
          'Došlo je do greške pri slanju emaila. Pokušajte ponovo.',
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
          <p className="text-slate-400">Resetujte lozinku</p>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Viralio</h1>
          <p className="text-slate-400">Email poslat</p>
        </div>

        <div className="space-y-4" suppressHydrationWarning>
          <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-lg text-sm">
            <p className="mb-2">
              Poslali smo vam email sa linkom za resetovanje lozinke na adresu:
            </p>
            <p className="font-medium">{email}</p>
            <p className="mt-2 text-xs">
              Proverite svoju email poštu (uključujući spam folder) i kliknite
              na link da biste resetovali lozinku. Link je važeći 1 sat.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Nazad na prijavu
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Viralio</h1>
        <p className="text-slate-400">Resetujte lozinku</p>
      </div>

      <form
        onSubmit={handleResetPassword}
        className="space-y-4"
        suppressHydrationWarning
      >
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <p className="text-sm text-slate-400 mb-4">
            Unesite email adresu povezanu sa vašim nalogom i poslaćemo vam link
            za resetovanje lozinke.
          </p>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Slanje...</span>
            </>
          ) : (
            <span>Pošalji link za resetovanje</span>
          )}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Nazad na prijavu
          </Link>
        </div>
      </form>
    </>
  );
}
