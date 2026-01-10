'use client'

import { useCompetitors } from '@/lib/hooks/useCompetitors'
import { useUserId } from '@/components/UserContext'
import CompetitorsView from '@/components/CompetitorsView'
import { toast } from 'sonner'

export default function CompetitorsPage() {
  const userId = useUserId()
  const { competitors, createCompetitor, deleteCompetitor } = useCompetitors(userId)

  return (
    <CompetitorsView
      competitors={competitors}
      onAddCompetitor={async (comp) => {
        const result = await createCompetitor(comp)
        if (result.error) {
          toast.error('Greška pri dodavanju konkurenta', {
            description: result.error,
          })
        } else {
          toast.success('Konkurent dodat', {
            description: `"${comp.name}" je dodat na listu.`,
          })
        }
      }}
      onRemoveCompetitor={async (id) => {
        const competitor = competitors.find((c) => c.id === id)
        const result = await deleteCompetitor(id)
        if (result.error) {
          toast.error('Greška pri brisanju', {
            description: result.error,
          })
        } else {
          toast.success('Konkurent uklonjen', {
            description: competitor ? `"${competitor.name}" je uklonjen.` : 'Konkurent je uklonjen.',
          })
        }
      }}
    />
  )
}

