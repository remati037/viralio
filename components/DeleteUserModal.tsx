'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onUserDeleted: () => void
  user: {
    id: string
    email?: string
    business_name?: string
  } | null
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  onUserDeleted,
  user,
}: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !user) return null

  const userDisplayName = user.business_name || user.email || user.id.substring(0, 8)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      toast.success('Korisnik obrisan', {
        description: `Korisnik ${userDisplayName} je uspešno obrisan.`,
      })

      onUserDeleted()
      onClose()
    } catch (error: any) {
      toast.error('Greška pri brisanju korisnika', {
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
              <CardTitle className="text-white text-red-400">Obriši Korisnika</CardTitle>
              <CardDescription className="text-slate-400">
                Ova akcija je nepovratna
              </CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <p className="text-red-300 text-sm">
              Da li ste sigurni da želite da obrišete korisnika{' '}
              <strong>{userDisplayName}</strong>?
            </p>
            <p className="text-red-400 text-xs mt-2">
              Svi podaci korisnika, zadaci, statistike i plaćanja će biti trajno obrisani.
            </p>
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
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Brisanje...' : 'Obriši Korisnika'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

