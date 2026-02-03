'use client';

import type { SocialLink } from '@/types';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SocialLinkInputProps {
  socialLinks: SocialLink[];
  setSocialLinks: (links: SocialLink[]) => void;
}

export default function SocialLinkInput({
  socialLinks,
  setSocialLinks,
}: SocialLinkInputProps) {
  const [linkInput, setLinkInput] = useState('');

  const handleAddLink = () => {
    if (!linkInput.trim()) return;

    const newLink: SocialLink = {
      id: Date.now().toString(),
      profile_id: '',
      url: linkInput.trim(),
      created_at: new Date().toISOString(),
    };

    setSocialLinks([...socialLinks, newLink]);
    setLinkInput('');
  };

  const handleRemoveLink = (id: string) => {
    setSocialLinks(socialLinks.filter((link) => link.id !== id));
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        Linkovi ka mrežama (za AI kontekst)
      </h3>

      <div className="flex gap-2">
        <input
          type="url"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Link do profila (npr. YouTube, Instagram...)"
          className="w-full rounded-md border border-input bg-background py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        <button
          onClick={handleAddLink}
          disabled={!linkInput.trim()}
          className="rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          Dodaj
        </button>
      </div>

      <div className="max-h-48 space-y-2 overflow-y-auto">
        {socialLinks.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="max-w-[80%] truncate text-sm text-primary hover:underline"
            >
              {item.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
            </a>
            <button
              onClick={() => handleRemoveLink(item.id)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
              title="Obriši link"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
