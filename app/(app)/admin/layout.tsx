import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Administratorska tabla za upravljanje korisnicima, šablonima i sistemom.',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

