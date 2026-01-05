import SetPasswordForm from '@/components/SetPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Postavite lozinku',
  description: 'Postavite lozinku za svoj Viralio nalog',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SetPasswordPage() {
  // Don't redirect authenticated users - they might be here to set password via invitation
  // The SetPasswordForm component will handle the logic

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <SetPasswordForm />
      </div>
    </div>
  );
}

