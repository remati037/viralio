'use client';

import { cn } from '@/lib/utils';
import type { Profile, SocialLink } from '@/types';
import { Check, Target, Video, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import SocialLinkInput from './SocialLinkInput';

export interface ProfileSettingsFormProps {
  profile: Profile | null;
  onSave: (
    profile: Partial<Profile> & { social_links?: SocialLink[] }
  ) => Promise<void>;
  className?: string;
}

export default function ProfileSettingsForm({
  profile,
  onSave,
  className,
}: ProfileSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: profile?.business_name || '',
    target_audience: profile?.target_audience || '',
    persona: profile?.persona || '',
    monthly_goal_short: profile?.monthly_goal_short || 0,
    monthly_goal_long: profile?.monthly_goal_long || 0,
  });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    profile?.social_links || []
  );

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        target_audience: profile.target_audience || '',
        persona: profile.persona || '',
        monthly_goal_short: profile.monthly_goal_short || 0,
        monthly_goal_long: profile.monthly_goal_long || 0,
      });
      setSocialLinks(profile.social_links || []);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ ...formData, social_links: socialLinks });
    setIsSaving(false);
  };

  if (!profile) return null;

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ime i prezime / Ime biznisa
        </label>
        <input
          type="text"
          value={formData.business_name}
          onChange={(e) =>
            setFormData({ ...formData, business_name: e.target.value })
          }
          placeholder="Npr. Biznis Priče, Vladsdigital, Prodaja Nekretnina Beograd"
          className="w-full rounded-md border border-input bg-background py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ciljna publika (Ko želiš da te gleda?)
        </label>
        <textarea
          value={formData.target_audience}
          onChange={(e) =>
            setFormData({ ...formData, target_audience: e.target.value })
          }
          placeholder="Npr. Vlasnici malih biznisa u Srbiji, stari 25-45, koji tek ulaze u svet digitalnog marketinga..."
          className="w-full resize-none rounded-md border border-input bg-background py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-24 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Ton (Kako želiš da zvučiš?)
        </label>
        <input
          type="text"
          value={formData.persona}
          onChange={(e) =>
            setFormData({ ...formData, persona: e.target.value })
          }
          placeholder="Npr. Stručan, motivišući, direktan, pun energije, koristiš humor"
          className="w-full rounded-md border border-input bg-background py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 mt-6 flex items-center gap-2 border-t border-border pt-6">
          <Target size={16} className="text-primary" /> Mesečni ciljevi sadržaja
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Postavite ciljeve za tekući mesec za praćenje progresa
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Video size={16} className="text-muted-foreground" /> Kratka forma
            </label>
            <input
              type="number"
              min="0"
              value={formData.monthly_goal_short}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_goal_short: Math.max(
                    0,
                    parseInt(e.target.value) || 0
                  ),
                })
              }
              className="w-full rounded-md border border-input bg-background py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Youtube size={16} className="text-muted-foreground" /> Duga forma
            </label>
            <input
              type="number"
              min="0"
              value={formData.monthly_goal_long}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_goal_long: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full rounded-md border border-input bg-background py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>
      </div>

      <SocialLinkInput
        socialLinks={socialLinks}
        setSocialLinks={setSocialLinks}
      />

      <button
        onClick={handleSave}
        disabled={isSaving}
        className={cn(
          'w-full py-3 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-all',
          isSaving
            ? 'cursor-not-allowed bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
        )}
      >
        {isSaving ? (
          <>Čuvanje...</>
        ) : (
          <>
            <Check size={18} /> Sačuvaj Profil
          </>
        )}
      </button>
    </div>
  );
}
