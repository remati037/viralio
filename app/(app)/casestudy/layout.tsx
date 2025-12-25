import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Studije Slučaja',
  description: 'Istražite uspešne studije slučaja i analizirajte šta je učinilo kontent viralnim. Učite od najboljih primera.',
}

export default function CaseStudyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

