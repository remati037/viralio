'use client';

import ProfileSettingsForm from '@/components/ProfileSettingsForm';
import Loader from '@/components/ui/loader';
import { useUserId } from '@/components/UserContext';
import { useProfile } from '@/lib/hooks/useProfile';
import type { SocialLink } from '@/types';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const userId = useUserId();
  const { profile, updateProfile, addSocialLink, removeSocialLink } =
    useProfile(userId);

  if (!profile) {
    return <Loader fullScreen text="Učitavanje..." />;
  }

  const handleSaveProfile = async (
    profileData: Partial<typeof profile> & { social_links?: SocialLink[] }
  ) => {
    const { social_links, ...profileFields } = profileData;
    const profileResult = await updateProfile(profileFields);

    if (profileResult?.error) {
      toast.error('Greška pri čuvanju profila', {
        description: profileResult.error,
      });
      return;
    }

    if (social_links) {
      const currentLinks = profile?.social_links || [];
      const newLinks = social_links.filter(
        (link) => !currentLinks.find((l) => l.id === link.id)
      );
      const removedLinks = currentLinks.filter(
        (link) => !social_links.find((l) => l.id === link.id)
      );

      for (const link of newLinks) {
        const result = await addSocialLink(link.url);
        if (result?.error) {
          toast.error('Greška pri dodavanju linka', {
            description: result.error,
          });
        }
      }

      for (const link of removedLinks) {
        const result = await removeSocialLink(link.id);
        if (result?.error) {
          toast.error('Greška pri uklanjanju linka', {
            description: result.error,
          });
        }
      }
    }

    toast.success('Profil ažuriran', {
      description: 'Sve izmene su sačuvane.',
    });
  };

  return (
    <div className="max-w-4xl mx-auto rounded-lg border border-border bg-card p-5 shadow-sm lg:p-10">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
        <Settings2 className="text-primary" size={24} />
        Podešavanja
      </h1>
      <div className="space-y-6">
        <ProfileSettingsForm profile={profile} onSave={handleSaveProfile} />
      </div>
    </div>
  );
}
