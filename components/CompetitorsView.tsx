'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trello, Plus, Eye, Trash2 } from 'lucide-react'
import { parseProfileDetails } from '@/lib/utils/helpers'
import type { Competitor, CompetitorFeed } from '@/types'

interface CompetitorsViewProps {
  competitors: Competitor[]
  onCompetitorClick: (competitor: Competitor) => void
  onAddCompetitor: (competitor: Omit<Competitor, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  onRemoveCompetitor: (competitorId: string) => Promise<void>
}

export default function CompetitorsView({
  competitors,
  onCompetitorClick,
  onAddCompetitor,
  onRemoveCompetitor,
}: CompetitorsViewProps) {
  const [linkInput, setLinkInput] = useState('')
  const [nameInput, setNameInput] = useState('')

  const handleAdd = async () => {
    if (!linkInput.trim() || !nameInput.trim()) {
      toast.error('Nedostaju podaci', {
        description: 'Molimo unesite ime i link konkurenta.',
      })
      return
    }

    const profileDetails = parseProfileDetails(linkInput.trim(), nameInput.trim())

    // Mock feed data
    const mockFeed: CompetitorFeed[] = [
      {
        id: '1',
        title: 'Sample Post 1',
        views: '10K',
        date: new Date().toISOString().split('T')[0],
        type: 'reel',
      },
      {
        id: '2',
        title: 'Sample Post 2',
        views: '5K',
        date: new Date().toISOString().split('T')[0],
        type: 'youtube',
      },
    ]

    await onAddCompetitor({
      name: nameInput.trim(),
      url: linkInput.trim(),
      icon: profileDetails.icon,
      niche: profileDetails.niche,
      feed: mockFeed,
    })

    setLinkInput('')
    setNameInput('')
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trello className="text-blue-400" size={24} /> Konkurenti
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Pratite i analizirajte najuspešnije objave vaših konkurenata da biste pronašli nove virale šablone.
        </p>
      </header>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-8 space-y-4">
        <h3 className="text-xl font-bold text-white">Dodaj Novog Konkurenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ime Konkurenta (npr. Digital Guru)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all md:col-span-1"
          />
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="Link ka Profilu (YouTube, TikTok, Instagram...)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all md:col-span-1"
          />
          <button
            onClick={handleAdd}
            disabled={!linkInput.trim() || !nameInput.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500 md:col-span-1 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Dodaj Listi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {competitors.length === 0 ? (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500">Nema dodatih konkurenata na listi.</p>
          </div>
        ) : (
          competitors.map((comp) => (
            <div
              key={comp.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/50 transition-colors"
            >
              <div onClick={() => onCompetitorClick(comp)} className="flex items-center gap-3 cursor-pointer group">
                <img
                  src={comp.icon || 'https://placehold.co/40x40'}
                  alt={comp.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div>
                  <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{comp.name}</p>
                  <p className="text-xs text-slate-500">{comp.niche || 'N/A'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-700">
                <button
                  onClick={() => onCompetitorClick(comp)}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1"
                >
                  <Eye size={14} /> Feed
                </button>
                <button
                  onClick={() => onRemoveCompetitor(comp.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                  title="Obriši"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

