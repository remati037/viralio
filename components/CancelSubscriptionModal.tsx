'use client'

import { useState } from 'react'
import { X, AlertTriangle, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Loader from './ui/loader'

interface CancelSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscriptionEndDate: string | null
  onCancelSuccess: () => void
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  subscriptionEndDate,
  onCancelSuccess,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleCancel = async () => {
    if (!confirmed) {
      toast.error('Molimo potvrdite otkazivanje pretplate')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      toast.success('Pretplata je otkazana', {
        description: 'Sve funkcionalnosti će biti dostupne do datuma isteka pretplate.',
      })

      onCancelSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      toast.error('Greška pri otkazivanju pretplate', {
        description: error.message || 'Pokušajte ponovo ili kontaktirajte podršku.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Otkazivanje Pretplate</h2>
              <p className="text-sm text-slate-400">Potvrdite otkazivanje pretplate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-blue-400 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-blue-300 mb-1">
                  Vaša pretplata je aktivna do:
                </p>
                <p className="text-lg font-bold text-white">
                  {formatDate(subscriptionEndDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-slate-300 text-sm">
              Nakon otkazivanja pretplate:
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Sve funkcionalnosti će biti dostupne do datuma isteka pretplate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Nakon isteka, pristup aplikaciji će biti onemogućen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>Možete se ponovo pretplatiti u bilo kom trenutku</span>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg">
            <input
              type="checkbox"
              id="confirm-cancel"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="confirm-cancel" className="text-sm text-slate-300 cursor-pointer">
              Potvrđujem da želim da otkažem pretplatu i razumem da će sve funkcionalnosti biti
              dostupne do datuma isteka pretplate.
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Odustani
          </button>
          <button
            onClick={handleCancel}
            disabled={loading || !confirmed}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <>
                <Loader size="sm" />
                <span className="ml-2">Otkazujem...</span>
              </>
            ) : (
              'Otkazi Pretplatu'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

