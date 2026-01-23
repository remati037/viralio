import AuthLayout from '@/components/auth/AuthLayout';
import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { getCurrentUser } from '@/lib/auth/utils';
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
  const user = await getCurrentUser();

  // If user is already logged in, redirect to home
  if (user) {
    redirect('/');
  }

  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
