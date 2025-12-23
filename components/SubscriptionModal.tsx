'use client'

import { Check, CreditCard, X } from 'lucide-react'
import { useState } from 'react'
import Loader from './ui/loader'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function SubscriptionModal({ isOpen, onClose, userId }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    if (!userId) return

    setLoading(true)
    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tier: 'pro',
        }),
      })

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        alert(`Error: ${response.status === 401 ? 'Please log in again' : response.status === 500 ? 'Server error. Please check your Stripe configuration.' : 'Failed to create checkout session'}`)
        setLoading(false)
        return
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        alert('Server returned an error. Please check your Stripe configuration.')
        setLoading(false)
        return
      }

      const data = await response.json()

      if (data.error) {
        console.error('Error creating checkout session:', data.error)
        alert(`Error: ${data.error}`)
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout using the session URL
      if (data.url) {
        // Use the checkout session URL directly
        window.location.href = data.url
      } else if (data.sessionId) {
        // Fallback: construct URL from session ID (if URL not provided)
        console.warn('Session URL not provided, using session ID fallback')
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`
      } else {
        alert('No checkout URL received. Please try again.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const plan = {
    name: 'Pro',
    price: '$29',
    period: 'month',
    features: [
      'Unlimited tasks',
      'Kanban board view',
      'Calendar view',
      'Competitor tracking',
      'Case studies access',
      'AI-powered insights',
      'Advanced analytics',
    ],
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Subscribe to ViralVault</h2>
            <p className="text-slate-400 mt-1">Unlock all features with a subscription</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Plan */}
        <div className="p-6">
          <div className="mb-6">
            <div className="relative p-6 rounded-xl border-2 border-blue-600 bg-blue-600/10">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-300">
                    <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader size="sm" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard size={20} />
                <span>Subscribe with Stripe</span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

