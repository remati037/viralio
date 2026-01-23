/**
 * Login and Sign Up Form Component
 * Handles both user login and registration
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInAction, signUpAction } from '@/lib/auth/actions';
import { validatePassword } from '@/lib/auth/validation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);

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
          setError('Naziv biznisa ili lično ime je obavezno');
          toast.error('Greška', {
            description: 'Molimo unesite ime biznisa ili lično ime.',
          });
          setLoading(false);
          return;
        }

        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          setError(passwordValidation.error || 'Neispravna lozinka');
          toast.error('Greška', {
            description: passwordValidation.error,
          });
          setLoading(false);
          return;
        }

        // Sign up
        const { error: signUpError } = await signUpAction({
          email,
          password,
          businessName,
        });

        if (signUpError) {
          throw new Error(signUpError);
        }

        // Profile will be automatically created by database trigger
        toast.success('Profil je kreiran!', {
          description: 'Proverite email za verifikaciju naloga.',
        });
        setEmail('');
        setPassword('');
        setBusinessName('');
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
          setError('Neuspešno kreiranje sesije. Pokušajte ponovo.');
          toast.error('Greška pri prijavljivanju', {
            description: 'Neuspešno kreiranje sesije. Pokušajte ponovo.',
          });
          setLoading(false);
          return;
        }

        toast.success('Uspešna prijava!');

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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-sans">Prijavite se</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-sans">
            {isSignUp ? 'Registrujte se' : 'Prijavite se'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} suppressHydrationWarning>
            {/* {error && (
              <div className="bg-[#fff0f1] border border-[#ffe0e1] text-[#e60000] px-3 py-2 rounded-md text-sm mb-4">
                {error}
              </div>
            )} */}

            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    suppressHydrationWarning
                    autoComplete="email"
                  />
                </div>
                {isSignUp && (
                  <div className="grid gap-2">
                    <Label htmlFor="businessName">
                      Naziv biznisa ili lično ime
                    </Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Apple"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      suppressHydrationWarning
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Lozinka</Label>
                    {!isSignUp && (
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Zaboravili ste lozinku?
                      </Link>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    suppressHydrationWarning
                    autoComplete={
                      isSignUp ? 'new-password' : 'current-password'
                    }
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {isSignUp ? 'Registrujte se' : 'Prijavite se'}
                </Button>
              </div>
              <div className="text-center text-sm">
                {isSignUp ? 'Već imate profil?' : 'Nemate profil?'}{' '}
                <Link
                  href=""
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="underline underline-offset-4 cursor-pointer"
                >
                  {isSignUp ? 'Prijavite se' : 'Registrujte se'}
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
