import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Upravljajte svojim profilom, postavkama, ciljevima i društvenim mrežama. Prilagodite Viralio svojim potrebama.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

