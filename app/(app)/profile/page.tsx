'use client'

import { useProfile } from '@/lib/hooks/useProfile'
import { useAICredits } from '@/lib/hooks/useAICredits'
import { useUserId } from '@/components/UserContext'
import ProfileSettings from '@/components/ProfileSettings'
import Loader from '@/components/ui/loader'
import AICreditBadge from '@/components/ui/ai-credit-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { SocialLink } from '@/types'

export default function ProfilePage() {
  const userId = useUserId()
  const { profile, updateProfile, addSocialLink, removeSocialLink } = useProfile(userId)
  const { credits, loading: creditsLoading } = useAICredits(userId)

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

  return (
    <div className="space-y-6">
      {/* AI Credits Card */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400" size={20} />
              <CardTitle className="text-white">AI Krediti</CardTitle>
            </div>
          </div>
          <CardDescription className="text-slate-400">
            Koristite AI funkcionalnosti za generisanje sadržaja. Svaki AI zahtev koristi 1 kredit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creditsLoading ? (
            <Loader text="Učitavanje kredita..." />
          ) : credits ? (
            <div className="space-y-4">
              <AICreditBadge
                creditsRemaining={credits.credits_remaining}
                maxCredits={credits.max_credits}
                compact={false}
                showWarning={true}
              />
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Iskorišćeno</div>
                  <div className="text-lg font-bold text-white">{credits.credits_used}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Preostalo</div>
                  <div className={`text-lg font-bold ${credits.credits_remaining === 0 ? 'text-red-400' : credits.credits_remaining <= 100 ? 'text-orange-400' : 'text-green-400'}`}>
                    {credits.credits_remaining}
                  </div>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Resetuje se</div>
                  <div className="text-lg font-bold text-white">
                    {new Date(credits.reset_at).toLocaleDateString('sr-RS', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-sm text-blue-300">
                <p className="font-medium mb-1">💡 Kako funkcionišu AI krediti?</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-400/80">
                  <li>Svaki AI zahtev (generisanje sadržaja) koristi 1 kredit</li>
                  <li>Imate {credits.max_credits} kredita mesečno</li>
                  <li>Krediti se automatski resetuju na početku svakog meseca</li>
                  <li>Preostali krediti ne prelaze u sledeći mesec</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">Greška pri učitavanju kredita</div>
          )}
        </CardContent>
      </Card>

      <ProfileSettings profile={profile} onSave={handleSaveProfile} />
    </div>
  )
}

