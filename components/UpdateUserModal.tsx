'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'

interface UpdateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserUpdated: () => void
  user: (Profile & { email?: string; email_confirmed?: boolean }) | null
}

export default function UpdateUserModal({
  isOpen,
  onClose,
  onUserUpdated,
  user,
}: UpdateUserModalProps) {
  const [formData, setFormData] = useState({
    business_name: '',
    target_audience: '',
    persona: '',
    monthly_goal_short: 0,
    monthly_goal_long: 0,
    tier: 'pro' as 'pro' | 'admin',
    has_unlimited_free: false,
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [fetchingEmail, setFetchingEmail] = useState(false)
  const [originalEmail, setOriginalEmail] = useState<string>('')

  useEffect(() => {
    if (user) {
      // First set the form data with what we have
      setFormData({
        business_name: user.business_name || '',
        target_audience: user.target_audience || '',
        persona: user.persona || '',
        monthly_goal_short: user.monthly_goal_short || 0,
        monthly_goal_long: user.monthly_goal_long || 0,
                  tier: (user.tier || 'pro') as 'pro' | 'admin',
        has_unlimited_free: (user as any).has_unlimited_free || false,
        email: (user as any).email || '',
        password: '',
      })
      setShowConfirmModal(false)

      // Fetch email if not already available
      if ((user as any).email) {
        setOriginalEmail((user as any).email)
      } else {
        fetchUserEmail(user.id)
      }
    }
  }, [user])

  const fetchUserEmail = async (userId: string) => {
    setFetchingEmail(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/get`)
      const data = await response.json()

      if (response.ok) {
        if (data.email) {
          setFormData((prev) => ({
            ...prev,
            email: data.email,
          }))
          setOriginalEmail(data.email)
        }
        // Update the user object with email confirmation status
        if (data.email_confirmed !== undefined) {
          // This will be reflected in the UI through the user prop
        }
      }
    } catch (error) {
      console.error('Error fetching user email:', error)
    } finally {
      setFetchingEmail(false)
    }
  }

  if (!isOpen || !user) return null

  const userDisplayName = user.business_name || user.id.substring(0, 8)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    setLoading(true)

    try {
      const updateData: any = {
        business_name: formData.business_name,
        target_audience: formData.target_audience,
        persona: formData.persona,
        monthly_goal_short: formData.monthly_goal_short,
        monthly_goal_long: formData.monthly_goal_long,
        tier: formData.tier,
        has_unlimited_free: formData.has_unlimited_free,
      }

      // Only include email/password if they were changed
      if (formData.email && formData.email !== originalEmail) {
        updateData.email = formData.email
      }
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      toast.success('Korisnik ažuriran', {
        description: `Podaci korisnika ${userDisplayName} su uspešno ažurirani.`,
      })

      onUserUpdated()
      onClose()
      setShowConfirmModal(false)
    } catch (error: any) {
      toast.error('Greška pri ažuriranju korisnika', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="bg-slate-900 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white">Ažuriraj Korisnika</CardTitle>
              <CardDescription className="text-slate-400">
                {userDisplayName}
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                  {fetchingEmail && (
                    <span className="ml-2 text-xs text-slate-500">(Učitavanje...)</span>
                  )}
                  {!fetchingEmail && user && (user as any).email_confirmed === false && (
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-yellow-900/30 text-yellow-300 border border-yellow-800">
                      Nije Potvrđen
                    </span>
                  )}
                  {!fetchingEmail && user && (user as any).email_confirmed === true && (
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-900/30 text-green-300 border border-green-800">
                      Potvrđen
                    </span>
                  )}
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder={fetchingEmail ? 'Učitavanje...' : 'email@example.com'}
                  disabled={fetchingEmail}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nova Lozinka (ostavite prazno da ne promenite)
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Nova lozinka"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Ime Biznisa
              </label>
              <Input
                type="text"
                value={formData.business_name}
                onChange={(e) =>
                  setFormData({ ...formData, business_name: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ime biznisa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Ciljna Publika
              </label>
              <Textarea
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData({ ...formData, target_audience: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Opis ciljne publike"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Persona
              </label>
              <Textarea
                value={formData.persona}
                onChange={(e) =>
                  setFormData({ ...formData, persona: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Opis persone"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Mesečni Cilj (Kratka Forma)
                </label>
                <Input
                  type="number"
                  value={formData.monthly_goal_short}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_goal_short: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Mesečni Cilj (Duga Forma)
                </label>
                <Input
                  type="number"
                  value={formData.monthly_goal_long}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_goal_long: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tier: e.target.value as 'pro' | 'admin',
                  })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pro">Pro</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unlimitedFree"
                checked={formData.has_unlimited_free}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    has_unlimited_free: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="unlimitedFree"
                className="text-sm font-medium text-slate-300 cursor-pointer"
              >
                Neograničena besplatna PRO pretplata
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Otkaži
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                Sačuvaj Izmene
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Potvrdite Ažuriranje</CardTitle>
              <CardDescription className="text-slate-400">
                Da li ste sigurni da želite da sačuvate izmene za korisnika {userDisplayName}?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Otkaži
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Ažuriranje...' : 'Sačuvaj'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

