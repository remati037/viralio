'use client'

import { useCompetitors } from '@/lib/hooks/useCompetitors'
import { useUserId } from '@/components/UserContext'
import CompetitorsView from '@/components/CompetitorsView'
import CompetitorFeedModal from '@/components/CompetitorFeedModal'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Competitor } from '@/types'

export default function CompetitorsPage() {
  const userId = useUserId()
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const { competitors, createCompetitor, deleteCompetitor } = useCompetitors(userId)

  return (
    <>
      <CompetitorsView
        competitors={competitors}
        onCompetitorClick={setSelectedCompetitor}
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

      {selectedCompetitor && (
        <CompetitorFeedModal competitor={selectedCompetitor} onClose={() => setSelectedCompetitor(null)} />
      )}
    </>
  )
}

