import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import HashTokenHandler from '@/components/HashTokenHandler';
import { getUser } from '@/lib/utils/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Resetujte lozinku',
  description: 'Resetujte lozinku za svoj Viralio nalog',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ForgotPasswordPage() {
  const user = await getUser();

  // If user is already logged in, redirect to home
  if (user) {
    redirect('/');
  }

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <HashTokenHandler />
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
