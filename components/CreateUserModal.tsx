'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: () => void
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
}: CreateUserModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [hasUnlimitedFree, setHasUnlimitedFree] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          businessName,
          hasUnlimitedFree,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      toast.success('Korisnik kreiran!', {
        description: `Korisnik ${email} je uspešno kreiran. ${data.user ? 'Email za verifikaciju bi trebalo da bude poslat.' : 'Proverite Supabase email podešavanja ako email nije poslat.'}`,
      })

      // Reset form
      setEmail('')
      setPassword('')
      setBusinessName('')
      setHasUnlimitedFree(false)

      onUserCreated()
      onClose()
    } catch (error: any) {
      toast.error('Greška pri kreiranju korisnika', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white">Kreiraj Novog Korisnika</CardTitle>
              <CardDescription className="text-slate-400">
                Korisnik će dobiti email za verifikaciju
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="korisnik@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Lozinka *
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Minimum 6 karaktera"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Ime Biznisa
              </label>
              <Input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Ime biznisa (opciono)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unlimitedFree"
                checked={hasUnlimitedFree}
                onChange={(e) => setHasUnlimitedFree(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="unlimitedFree"
                className="text-sm font-medium text-slate-300 cursor-pointer"
              >
                Dodaj neograničenu besplatnu PRO pretplatu
              </label>
            </div>

            {!hasUnlimitedFree && (
              <p className="text-xs text-slate-500">
                Ako ne označite ovo, korisnik će dobiti 7 dana besplatnog probnog perioda, nakon čega će biti upitan da se pretplati preko Stripe-a.
              </p>
            )}

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
                {loading ? 'Kreiranje...' : 'Kreiraj Korisnika'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

