'use client';

import type { Competitor } from '@/types';
import { Link, Video, Youtube } from 'lucide-react';
import Modal, { modalPrimaryButtonClass } from './ui/modal';

interface CompetitorFeedModalProps {
  competitor: Competitor;
  onClose: () => void;
}

export default function CompetitorFeedModal({
  competitor,
  onClose,
}: CompetitorFeedModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={competitor.name}
      description={competitor.url.split('/')[2]}
      maxWidth="lg"
      className="max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0 -mx-6 -mb-6">
        <div className="px-6 overflow-y-auto flex-1 space-y-4">
          <h4 className="text-sm font-bold text-slate-500 uppercase">
            Poslednje 3 Objavljene Teme (Mock Feed)
          </h4>
          {competitor.feed && competitor.feed.length > 0 ? (
            competitor.feed.map((post) => (
              <div
                key={post.id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-900 text-sm flex items-center gap-2">
                    {post.type === 'reel' ? (
                      <Video size={16} className="text-red-500" />
                    ) : (
                      <Youtube size={16} className="text-green-600" />
                    )}
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Objavljeno: {post.date} | Pregledi: {post.views}
                  </p>
                </div>
                <a
                  href={competitor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 shrink-0"
                >
                  <Link size={18} />
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500">
              Nema dostupnih feed podataka.
            </div>
          )}
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full text-center block mt-6 py-2 rounded-lg transition-colors text-sm ${modalPrimaryButtonClass}`}
          >
            Idi na {competitor.name} Profil
          </a>
        </div>
      </div>
    </Modal>
  );
}
