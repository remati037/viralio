'use client'

import { X, Video, Youtube, Link } from 'lucide-react'
import type { Competitor } from '@/types'

interface CompetitorFeedModalProps {
  competitor: Competitor
  onClose: () => void
}

export default function CompetitorFeedModal({ competitor, onClose }: CompetitorFeedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={competitor.icon || 'https://placehold.co/40x40'}
              alt={competitor.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
            />
            <div>
              <h3 className="text-xl font-bold text-white">{competitor.name}</h3>
              <p className="text-slate-400 text-sm">{competitor.url.split('/')[2]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase">Poslednje 3 Objavljene Teme (Mock Feed)</h4>
          {competitor.feed && competitor.feed.length > 0 ? (
            competitor.feed.map((post) => (
              <div key={post.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                  <p className="font-medium text-white text-sm flex items-center gap-2">
                    {post.type === 'reel' ? (
                      <Video size={16} className="text-red-400" />
                    ) : (
                      <Youtube size={16} className="text-green-400" />
                    )}
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Objavljeno: {post.date} | Pregledi: {post.views}
                  </p>
                </div>
                <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 shrink-0">
                  <Link size={18} />
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">Nema dostupnih feed podataka.</div>
          )}
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center block mt-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
          >
            Idi na {competitor.name} Profil
          </a>
        </div>
      </div>
    </div>
  )
}

