import AuthLayout from '@/components/auth/AuthLayout';
import ConfirmSuccessContent from '@/components/auth/ConfirmSuccessContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email potvrđen',
  description: 'Vaš email je uspešno potvrđen. Prijavite se na svoj nalog.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmSuccessPage() {
  return (
    <AuthLayout>
      <ConfirmSuccessContent />
    </AuthLayout>
  );
}
