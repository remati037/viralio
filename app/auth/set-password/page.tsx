import SetPasswordForm from '@/components/SetPasswordForm';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Postavite lozinku',
  description: 'Postavite lozinku za svoj Viralio nalog',
  robots: {
    index: false,
    follow: false,
  },
};

function SetPasswordFormSkeleton() {
  return (
    <>
      <div className="mb-8 text-center">
        <div className="h-8 bg-slate-800 rounded-lg animate-pulse mb-2 w-32 mx-auto"></div>
        <div className="h-4 bg-slate-800 rounded-lg animate-pulse w-48 mx-auto"></div>
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-slate-800 rounded-lg animate-pulse"></div>
      </div>
    </>
  );
}

export default async function SetPasswordPage() {
  // Don't redirect authenticated users - they might be here to set password via invitation
  // The SetPasswordForm component will handle the logic

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <Suspense fallback={<SetPasswordFormSkeleton />}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

