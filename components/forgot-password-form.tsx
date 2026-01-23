'use client';

import { requestPasswordResetAction } from '@/lib/auth/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: resetError } = await requestPasswordResetAction(email);

      if (resetError) {
        throw new Error(resetError);
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-sans">
              Resetujte lozinku
            </CardTitle>
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

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-sans">
            Link za resetovanje je poslat
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6">
          <p className="text-center">
            Poslali smo Vam email sa linkom za resetovanje lozinke na adresu:
          </p>
          <p className="font-medium text-center">{email}</p>
          <p className="text-xs text-center text-balance">
            Proverite svoj email (uključujući i Spam folder) i kliknite na link
            da biste resetovali lozinku. Link za resetovanje važi 1 sat.
          </p>

          <Link href="/login">
            <Button className="w-full" disabled={loading}>
              Nazad na prijavu
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-sans">
            Resetovanje lozinke
          </CardTitle>
          <CardDescription>
            Unesite email adresu povezanu sa vašim nalogom i poslaćemo vam link
            za resetovanje lozinke.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form suppressHydrationWarning onSubmit={handleResetPassword}>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  Pošalji link za resetovanje
                </Button>
              </div>
              <div className="text-center text-sm">
                <Link
                  href="/login"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Nazad na prijavu
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
