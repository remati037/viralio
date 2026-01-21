import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth/utils';
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
  const user = await getCurrentUser();

  // If user is already logged in, redirect to home
  if (user) {
    redirect('/');
  }

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
