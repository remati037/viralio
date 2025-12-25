'use client'

import { useProfile } from '@/lib/hooks/useProfile'
import { useUserId } from '@/components/UserContext'
import ProfileSettings from '@/components/ProfileSettings'
import Loader from '@/components/ui/loader'
import { toast } from 'sonner'
import type { SocialLink } from '@/types'

export default function ProfilePage() {
  const userId = useUserId()
  const { profile, updateProfile, addSocialLink, removeSocialLink } = useProfile(userId)

  if (!profile) {
    return <Loader fullScreen text="Učitavanje profila..." />
  }

  const handleSaveProfile = async (profileData: Partial<typeof profile> & { social_links?: SocialLink[] }) => {
    const { social_links, ...profileFields } = profileData
    const profileResult = await updateProfile(profileFields)

    if (profileResult?.error) {
      toast.error('Greška pri čuvanju profila', {
        description: profileResult.error,
      })
      return
    }

    if (social_links) {
      const currentLinks = profile?.social_links || []
      const newLinks = social_links.filter((link) => !currentLinks.find((l) => l.id === link.id))
      const removedLinks = currentLinks.filter((link) => !social_links.find((l) => l.id === link.id))

      for (const link of newLinks) {
        const result = await addSocialLink(link.url)
        if (result?.error) {
          toast.error('Greška pri dodavanju linka', {
            description: result.error,
          })
        }
      }

      for (const link of removedLinks) {
        const result = await removeSocialLink(link.id)
        if (result?.error) {
          toast.error('Greška pri uklanjanju linka', {
            description: result.error,
          })
        }
      }
    }

    toast.success('Profil ažuriran', {
      description: 'Sve izmene su sačuvane.',
    })
  }

  return <ProfileSettings profile={profile} onSave={handleSaveProfile} />
}

