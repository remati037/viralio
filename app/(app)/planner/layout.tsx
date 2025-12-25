import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planer',
  description: 'Upravljajte svojim kontentom sa Kanban tablom i kalendarom. Organizujte ideje, pratite napredak i postanite viralni.',
}

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

