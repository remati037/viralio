import LoginForm from '@/components/LoginForm';
import { getUser } from '@/lib/utils/auth';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Prijava',
  description:
    'Prijavite se na Viralio i počnite da planirate svoj viralni kontent. Kreirajte nalog ili se prijavite sa postojećim nalogom.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const user = await getUser();

  // If user is already logged in, redirect to home
  if (user) {
    redirect('/');
  }

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <LoginForm />
      </div>
    </div>
  );
}
