import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Konkurenti',
  description: 'Pratite svoje konkurente i analizirajte njihov kontent. Učite od najboljih i pronađite inspiraciju za svoje ideje.',
}

export default function CompetitorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

