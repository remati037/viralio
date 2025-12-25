'use client'

import { X, Eye, TrendingUp, Lightbulb } from 'lucide-react'
import type { Task } from '@/types'

interface CaseStudyDetailModalProps {
  task: Task
  onClose: () => void
}

export default function CaseStudyDetailModal({ task, onClose }: CaseStudyDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            {task.category ? (
              <span
                className="text-xs font-bold uppercase tracking-wider bg-slate-800 px-2 py-1 rounded border inline-block mr-2"
                style={{
                  color: task.category.color,
                  borderColor: `${task.category.color}40`,
                }}
              >
                {task.category.name}
              </span>
            ) : null}
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded border border-slate-700">
              {task.format}
            </span>
            <h3 className="text-2xl font-bold text-white mt-2">{task.title}</h3>
            <p className="text-slate-400 text-sm mt-1">
              Objavljeno: {task.publish_date ? new Date(task.publish_date).toLocaleDateString('sr-RS') : 'N/A'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Eye size={16} className="text-blue-400" /> Vizuelni Kontekst
              </h4>
              <div className="w-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 aspect-video flex items-center justify-center">
                {task.cover_image_url ? (
                  <img src={task.cover_image_url} alt="Video Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500">Nema Cover Slike</span>
                )}
              </div>
            </div>

            <div className="md:col-span-1 space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> Rezultati
              </h4>
              <div className="space-y-3">
                <div className="bg-slate-800 p-3 rounded-lg border-l-4 border-emerald-500">
                  <p className="text-xs uppercase text-emerald-400 font-bold">Pregleda (Views)</p>
                  <p className="text-lg font-extrabold text-white">{task.result_views || 'N/A'}</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border-l-4 border-purple-500">
                  <p className="text-xs uppercase text-purple-400 font-bold">Angažman (Engagement)</p>
                  <p className="text-lg font-extrabold text-white">{task.result_engagement || 'N/A'}</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-xs uppercase text-yellow-400 font-bold">Konverzije</p>
                  <p className="text-lg font-extrabold text-white">{task.result_conversions || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-blue-400" /> Detaljna Analiza uspeha:
            </h3>
            <div 
              className="text-slate-400 leading-relaxed prose prose-invert prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: task.analysis 
                  ? task.analysis.replace(/\n/g, '<br>') 
                  : '<p>Analiza još nije dodata za ovu studiju slučaja.</p>' 
              }}
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-md font-bold text-slate-300 mb-2">Originalni Šablon za replikaciju:</h3>
            <p className="text-sm text-slate-500">
              Ova objava je bazirana na šablonu:{' '}
              <span className="text-white ml-1 font-semibold">{task.original_template || task.title}</span>
            </p>
          </div>

          {task.inspiration_links && task.inspiration_links.length > 0 && (
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-md font-bold text-slate-300 mb-2">Inspiracija/Konkurenti:</h3>
              <div className="flex flex-wrap gap-2">
                {task.inspiration_links.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 transition-colors"
                  >
                    {item.link.replace(/^https?:\/\//, '').substring(0, 30) + '...'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

