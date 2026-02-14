'use client';

import type { Task } from '@/types';
import { Eye, Lightbulb, TrendingUp } from 'lucide-react';
import Modal from './ui/modal';

interface CaseStudyDetailModalProps {
  task: Task;
  onClose: () => void;
}

export default function CaseStudyDetailModal({
  task,
  onClose,
}: CaseStudyDetailModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      bare
      maxWidth="4xl"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-start gap-2 mb-4">
          {task.category ? (
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border"
              style={{
                color: task.category.color,
                borderColor: `${task.category.color}60`,
                backgroundColor: `${task.category.color}15`,
              }}
            >
              {task.category.name}
            </span>
          ) : null}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded border border-slate-200">
            {task.format}
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mt-1">{task.title}</h3>
        <p className="text-slate-500 text-sm mt-1">
          Objavljeno:{' '}
          {task.publish_date
            ? new Date(task.publish_date).toLocaleDateString('sr-RS')
            : 'N/A'}
        </p>

        <div className="mt-6 overflow-y-auto flex-1 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <Eye size={16} className="text-blue-600" /> Vizuelni Kontekst
              </h4>
              <div className="w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-video flex items-center justify-center">
                {task.cover_image_url ? (
                  <img
                    src={task.cover_image_url}
                    alt="Video Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-500">Nema Cover Slike</span>
                )}
              </div>
            </div>

            <div className="md:col-span-1 space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" /> Rezultati
              </h4>
              <div className="space-y-3">
                <div className="bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">
                  <p className="text-xs uppercase text-emerald-700 font-bold">
                    Pregleda (Views)
                  </p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {task.result_views || 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">
                  <p className="text-xs uppercase text-purple-700 font-bold">
                    Angažman (Engagement)
                  </p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {task.result_engagement || 'N/A'}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500">
                  <p className="text-xs uppercase text-amber-700 font-bold">
                    Konverzije
                  </p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {task.result_conversions || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-blue-600" /> Detaljna Analiza
              uspeha:
            </h3>
            <div
              className="text-slate-700 leading-relaxed prose prose-slate prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: task.analysis
                  ? task.analysis.replace(/\n/g, '<br>')
                  : '<p>Analiza još nije dodata za ovu studiju slučaja.</p>',
              }}
            />
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-md font-bold text-slate-900 mb-2">
              Originalni Šablon za replikaciju:
            </h3>
            <p className="text-sm text-slate-600">
              Ova objava je bazirana na šablonu:{' '}
              <span className="text-slate-900 ml-1 font-semibold">
                {task.original_template || task.title}
              </span>
            </p>
          </div>

          {task.inspiration_links && task.inspiration_links.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-md font-bold text-slate-900 mb-2">
                Inspiracija/Konkurenti:
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.inspiration_links.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 transition-colors"
                  >
                    {item.link.replace(/^https?:\/\//, '').substring(0, 30) +
                      '...'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
