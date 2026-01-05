import SetPasswordForm from '@/components/SetPasswordForm';
import { getUser } from '@/lib/utils/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Postavite lozinku',
  description: 'Postavite lozinku za svoj Viralio nalog',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SetPasswordPage() {
  const user = await getUser();

  // If user is already logged in and has a password, redirect to home
  // (they shouldn't be on this page if they're already set up)
  if (user) {
    redirect('/');
  }

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <SetPasswordForm />
      </div>
    </div>
  );
}

