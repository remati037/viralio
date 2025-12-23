'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import SubscriptionModal from './SubscriptionModal'

interface SubscriptionGateProps {
  userId: string
  hasActiveSubscription: boolean
  children: React.ReactNode
}

export default function SubscriptionGate({
  userId,
  hasActiveSubscription,
  children,
}: SubscriptionGateProps) {
  const [showModal, setShowModal] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user just returned from Stripe checkout
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      // If we have a session_id, the server should have verified it
      // But if subscription status hasn't updated yet, wait a bit and refresh
      if (!hasActiveSubscription) {
        // Wait a moment for server-side verification to complete, then refresh
        const timer = setTimeout(() => {
          window.location.reload()
        }, 1000)

        return () => clearTimeout(timer)
      } else {
        // Subscription is active, show success and clean URL
        toast.success('Pretplata je aktivirana!', {
          description: 'Dobrodošli! Vaša pretplata je sada aktivna.',
        })
        // Remove session_id from URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }

    // Show modal if user doesn't have active subscription (and no session_id)
    if (!hasActiveSubscription && !sessionId) {
      setShowModal(true)
    }
  }, [hasActiveSubscription, searchParams])

  if (!hasActiveSubscription) {
    return (
      <>
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4">Pretplatite se da biste koristili aplikaciju!</h1>
            <p className="text-slate-400 mb-8">
              Da biste koristili Viralio aplikaciju, morate imati aktivnu pretplatu. Kliknite na dugme ispod da biste se pretplatili.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              Pretplatite se
            </button>
          </div>
        </div>
        <SubscriptionModal isOpen={showModal} onClose={() => setShowModal(false)} userId={userId} />
      </>
    )
  }

  return <>{children}</>
}

