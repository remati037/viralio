'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { SocialLink } from '@/types'

interface SocialLinkInputProps {
  socialLinks: SocialLink[]
  setSocialLinks: (links: SocialLink[]) => void
}

export default function SocialLinkInput({ socialLinks, setSocialLinks }: SocialLinkInputProps) {
  const [linkInput, setLinkInput] = useState('')

  const handleAddLink = () => {
    if (!linkInput.trim()) return

    const newLink: SocialLink = {
      id: Date.now().toString(),
      profile_id: '',
      url: linkInput.trim(),
      created_at: new Date().toISOString(),
    }

    setSocialLinks([...socialLinks, newLink])
    setLinkInput('')
  }

  const handleRemoveLink = (id: string) => {
    setSocialLinks(socialLinks.filter((link) => link.id !== id))
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-slate-400 uppercase">Linkovi ka mrežama (za AI kontekst)</h4>

      <div className="flex gap-2">
        <input
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Link do profila (npr. YouTube, Instagram...)"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          onClick={handleAddLink}
          disabled={!linkInput.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:bg-slate-700 disabled:text-slate-500"
        >
          Dodaj
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {socialLinks.map((item) => (
          <div
            key={item.id}
            className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center border border-slate-700"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline truncate max-w-[80%]"
            >
              {item.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
            </a>
            <button
              onClick={() => handleRemoveLink(item.id)}
              className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
              title="Obriši link"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

