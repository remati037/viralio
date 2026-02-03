'use client';

import { parseProfileDetails } from '@/lib/utils/helpers';
import type { Competitor, CompetitorFeed } from '@/types';
import { ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import Loader from './ui/loader';

interface CompetitorsViewProps {
  competitors: Competitor[];
  onAddCompetitor: (
    competitor: Omit<Competitor, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onRemoveCompetitor: (competitorId: string) => Promise<void>;
}

const AVATAR_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#0ea5e9',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function CompetitorsView({
  competitors,
  onAddCompetitor,
  onRemoveCompetitor,
}: CompetitorsViewProps) {
  const [linkInput, setLinkInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAdd = async () => {
    if (!linkInput.trim() || !nameInput.trim()) {
      toast.error('Nedostaju podaci', {
        description: 'Molimo unesite ime i link konkurenta.',
      });
      return;
    }

    setIsAdding(true);
    const profileDetails = parseProfileDetails(
      linkInput.trim(),
      nameInput.trim()
    );

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
    ];

    try {
      await onAddCompetitor({
        name: nameInput.trim(),
        url: linkInput.trim(),
        icon: profileDetails.icon,
        niche: null,
        feed: mockFeed,
      });

      setLinkInput('');
      setNameInput('');
      setIsAddModalOpen(false);
      toast.success('Konkurent dodat', {
        description: `${nameInput.trim()} je uspešno dodat na listu.`,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            Konkurenti
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Prati i analiziraj najuspešnije objave tvojih konkurenata.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="shrink-0">
          <Plus size={18} className="mr-2" />
          Dodaj konkurenta
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {competitors.length === 0 ? (
          <div className="col-span-full py-10 text-center border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">
              Nema dodatih konkurenata na listi.
            </p>
          </div>
        ) : (
          competitors.map((comp) => (
            <Card key={comp.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarFallback
                      className="text-white font-semibold text-sm"
                      style={{ backgroundColor: getAvatarColor(comp.name) }}
                    >
                      {comp.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-card-foreground truncate">
                      {comp.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setRemovingId(comp.id);
                    try {
                      await onRemoveCompetitor(comp.id);
                    } finally {
                      setRemovingId(null);
                    }
                  }}
                  disabled={removingId === comp.id}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg disabled:opacity-50 shrink-0 transition-colors"
                  title="Obriši"
                >
                  {removingId === comp.id ? (
                    <Loader size="sm" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
              <a
                href={comp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-chart-1 transition-colors truncate"
              >
                <ExternalLink size={14} className="shrink-0" />
                <span className="truncate">{comp.url}</span>
              </a>
            </Card>
          ))
        )}
      </div>

      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !isAdding && setIsAddModalOpen(false)}
        >
          <Card
            className="w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Dodaj konkurenta</CardTitle>
                  <CardDescription>
                    Unesite ime i link ka profilu konkurenta
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => !isAdding && setIsAddModalOpen(false)}
                  disabled={isAdding}
                >
                  <X size={20} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdd();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Ime konkurenta *
                  </label>
                  <Input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="npr. Digital Guru"
                    disabled={isAdding}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Link ka profilu *
                  </label>
                  <Input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="YouTube, TikTok, Instagram..."
                    disabled={isAdding}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => !isAdding && setIsAddModalOpen(false)}
                    className="flex-1"
                    disabled={isAdding}
                  >
                    Otkaži
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={
                      !linkInput.trim() || !nameInput.trim() || isAdding
                    }
                  >
                    {isAdding ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Dodavanje...
                      </>
                    ) : (
                      <>
                        <Plus size={18} className="mr-2" />
                        Dodaj
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
