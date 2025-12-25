'use client'

import { createClient } from '@/lib/supabase/client'
import type { Payment, Profile, SocialLink } from '@/types'
import { Calendar, Check, CreditCard, DollarSign, Tag, Target, User, Video, X, Youtube } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import CategoryManagement from './CategoryManagement'
import SocialLinkInput from './SocialLinkInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import Skeleton from './ui/skeleton'

interface ProfileSettingsProps {
  profile: Profile | null
  onSave: (profile: Partial<Profile> & { social_links?: SocialLink[] }) => Promise<void>
}

export default function ProfileSettings({ profile, onSave }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'payment' | 'categories'>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isCancelled: boolean
    hasActiveSubscription: boolean
    isTrialing?: boolean
    trialDaysRemaining?: number | null
    trialEnd?: number | null
    currentPeriodEnd?: number | null
  } | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true) // Start as true to show loader initially
  const supabase = createClient()
  const [formData, setFormData] = useState({
    business_name: profile?.business_name || '',
    target_audience: profile?.target_audience || '',
    persona: profile?.persona || '',
    monthly_goal_short: profile?.monthly_goal_short || 0,
    monthly_goal_long: profile?.monthly_goal_long || 0,
  })
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(profile?.social_links || [])

  useEffect(() => {
    if (activeTab === 'payment' && profile?.id) {
      fetchPayments()
      fetchSubscriptionStatus()
    }
  }, [activeTab, profile?.id])

  const fetchSubscriptionStatus = async () => {
    if (!profile?.id) return
    setLoadingStatus(true)
    try {
      const response = await fetch('/api/stripe/subscription-status')
      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (error: any) {
      console.error('Error fetching subscription status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  const fetchPayments = async () => {
    if (!profile?.id) return
    setLoadingPayments(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error: any) {
      toast.error('Greška pri učitavanju platnih podataka', {
        description: error.message,
      })
    } finally {
      setLoadingPayments(false)
    }
  }

  const nextPayment = payments.find((p) => p.next_payment_date && new Date(p.next_payment_date) > new Date())

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        target_audience: profile.target_audience || '',
        persona: profile.persona || '',
        monthly_goal_short: profile.monthly_goal_short || 0,
        monthly_goal_long: profile.monthly_goal_long || 0,
      })
      setSocialLinks(profile.social_links || [])
    }
  }, [profile])

  const handleSave = async () => {
    // if (!formData.business_name.trim()) {
    //   toast.error('Nedostaje ime biznisa', {
    //     description: 'Molimo unesite ime biznisa ili lični brend.',
    //   })
    //   return
    // }

    setIsSaving(true)
    await onSave({ ...formData, social_links: socialLinks })
    setIsSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto bg-slate-900/50 p-6 lg:p-10 rounded-3xl border border-slate-800 shadow-xl">
      <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
        <User className="text-blue-400" size={24} /> Postavke Profila
      </h1>
      <p className="text-slate-400 mb-8">
        Ove informacije će AI koristiti za personalizaciju skripti, tona i poziva na akciju (CTA).
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'profile'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          Profil
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'payment'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <DollarSign size={16} /> Plaćanje
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${activeTab === 'categories'
            ? 'text-white border-b-2 border-blue-500'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <Tag size={16} /> Kategorije
        </button>
      </div>

      {activeTab === 'categories' && profile?.id && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <CategoryManagement userId={profile.id} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard size={20} /> Trenutni Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments || loadingStatus ? (
                <div className="space-y-4 py-4">
                  <Skeleton height={30} width="200px" />
                  <Skeleton height={40} width="150px" />
                  <Skeleton height={20} width="250px" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Trenutni Tier</div>
                    <div className="text-2xl font-bold text-white">
                      {profile?.tier?.toUpperCase() || 'FREE'}
                    </div>
                  </div>

                  {/* Show trial information if in trial */}
                  {subscriptionStatus?.isTrialing && subscriptionStatus.trialEnd && (
                    <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                          <Calendar className="text-blue-400" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="text-blue-300 font-bold mb-1">Besplatna Probna Perioda</div>
                          <div className="text-white text-lg font-semibold mb-2">
                            {subscriptionStatus.trialDaysRemaining !== null && subscriptionStatus.trialDaysRemaining !== undefined
                              ? `${subscriptionStatus.trialDaysRemaining} ${subscriptionStatus.trialDaysRemaining === 1 ? 'dan' : 'dana'} preostalo`
                              : 'Aktivna probna perioda'}
                          </div>
                          <div className="text-slate-300 text-sm">
                            Prvo plaćanje: {new Date(subscriptionStatus.trialEnd * 1000).toLocaleDateString('sr-RS', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show next payment date if not in trial and not cancelled */}
                  {!subscriptionStatus?.isTrialing && nextPayment && !subscriptionStatus?.isCancelled && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                        <Calendar size={14} /> Sledeće Plaćanje
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {new Date(nextPayment.next_payment_date!).toLocaleDateString('sr-RS', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show next payment from trial end if in trial */}
                  {subscriptionStatus?.isTrialing && subscriptionStatus.trialEnd && !subscriptionStatus?.isCancelled && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                        <Calendar size={14} /> Prvo Plaćanje
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {new Date(subscriptionStatus.trialEnd * 1000).toLocaleDateString('sr-RS', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show expiration date if cancelled */}
                  {subscriptionStatus?.isCancelled && (
                    <div>
                      <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                        <Calendar size={14} /> Pretplata ističe
                      </div>
                      <div className="text-lg font-semibold text-slate-300">
                        {(() => {
                          // If in trial and cancelled, use trial end date
                          if (subscriptionStatus.isTrialing && subscriptionStatus.trialEnd) {
                            return new Date(subscriptionStatus.trialEnd * 1000).toLocaleDateString('sr-RS', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          }
                          // Otherwise use subscription period end or next payment date
                          if (subscriptionStatus.currentPeriodEnd) {
                            return new Date(subscriptionStatus.currentPeriodEnd * 1000).toLocaleDateString('sr-RS', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          }
                          if (nextPayment?.subscription_period_end) {
                            return new Date(nextPayment.subscription_period_end).toLocaleDateString('sr-RS', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          }
                          return 'N/A'
                        })()}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Sve funkcionalnosti će biti dostupne do ovog datuma
                      </p>
                    </div>
                  )}

                  {/* Active subscription - show cancellation option */}
                  {profile?.tier === 'pro' && nextPayment && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      {subscriptionStatus?.isCancelled ? (
                        <div className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-400 rounded-lg flex items-center justify-center gap-2 font-medium cursor-not-allowed">
                          <X size={16} />
                          Otkazali ste pretplatu
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setShowCancelModal(true)}
                            disabled={loadingStatus}
                            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={16} />
                            Otkaži Pretplatu
                          </button>
                          <p className="text-xs text-slate-500 text-center mt-2">
                            Sve funkcionalnosti će biti dostupne do datuma isteka pretplate
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Istorija Plaćanja</CardTitle>
              <CardDescription className="text-slate-400">
                Pregled svih vaših transakcija
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="space-y-3 py-4">
                  <Skeleton height={80} />
                  <Skeleton height={80} />
                  <Skeleton height={80} />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-slate-500 text-center py-8">
                  Nema platnih podataka. Plaćanja će se prikazati ovde kada se pretplatite.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-white font-medium">
                          ${payment.amount} {payment.currency}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {new Date(payment.created_at).toLocaleDateString('sr-RS', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        {payment.tier_at_payment && (
                          <div className="text-xs text-slate-500 mt-1">
                            Tier: {payment.tier_at_payment.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'completed'
                            ? 'bg-green-900/30 text-green-300'
                            : payment.status === 'pending'
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-red-900/30 text-red-300'
                            }`}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'profile' && (

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ime Biznisa / Lični Brend</label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Npr. Biznis Priče, Vlads Digital, Prodaja Nekretnina Beograd"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Ciljna Publika (Ko želiš da te gleda?)
            </label>
            <textarea
              value={formData.target_audience}
              onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
              placeholder="Npr. Vlasnici malih biznisa u Srbiji, stari 25-45, koji tek ulaze u svet digitalnog marketinga..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Persona / Ton (Kako zvučiš?)</label>
            <input
              type="text"
              value={formData.persona}
              onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
              placeholder="Npr. Stručan, motivišući, direktan, pun energije, koristiš humor"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4 mt-6 border-t border-slate-700 pt-6 flex items-center gap-2">
              <Target size={20} className="text-yellow-400" /> Mesečni Ciljevi Sadržaja
            </h3>
            <p className="text-slate-400 text-sm mb-4">Postavite ciljeve za tekući mesec za praćenje progresa.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                  <Video size={16} className="text-red-400" /> Kratka Forma (Reel/TikTok)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthly_goal_short}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_goal_short: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                  <Youtube size={16} className="text-green-400" /> Duga Forma (YouTube)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthly_goal_long}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_goal_long: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <SocialLinkInput socialLinks={socialLinks} setSocialLinks={setSocialLinks} />

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isSaving
              ? 'bg-blue-800 text-blue-300'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
              }`}
          >
            {isSaving ? (
              <>Čuvanje...</>
            ) : (
              <>
                <Check size={20} /> Sačuvaj Profil
              </>
            )}
          </button>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {profile && (
        <CancelSubscriptionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          subscriptionEndDate={nextPayment?.subscription_period_end || null}
          trialEndDate={subscriptionStatus?.trialEnd || null}
          isTrialing={subscriptionStatus?.isTrialing || false}
          onCancelSuccess={() => {
            // Refresh payments and subscription status after cancellation
            fetchPayments()
            fetchSubscriptionStatus()
          }}
        />
      )}
    </div>
  )
}

