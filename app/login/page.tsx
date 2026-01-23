import AuthLayout from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/login-form';
import { getCurrentUser } from '@/lib/auth/utils';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Prijava',
  description:
    'Prijavi se na Viralio i počni da planiraš svoj viralni kontent. Kreiraj nalog ili se prijavi sa postojećim.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/planner');
  }
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
