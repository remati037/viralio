import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Preusmeravanje na podešavanja.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
