'use client';

import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ConfirmSuccessContent() {
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-slate-700 bg-slate-800/50 text-center">
      <CardContent className="pt-8 pb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
            <CheckCircle className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">
          Email uspešno potvrđen
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Vaš nalog je spreman. Prijavite se sa vašom email adresom i lozinkom.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Prijavi se
        </Link>
      </CardContent>
    </Card>
  );
}
