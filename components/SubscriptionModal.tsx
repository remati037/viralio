'use client';

import { Check, CreditCard } from 'lucide-react';
import { useState } from 'react';
import Loader from './ui/loader';
import Modal, { modalPrimaryButtonClass } from './ui/modal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  userId,
}: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!userId) return;

    setLoading(true);
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
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        alert(
          `Error: ${response.status === 401 ? 'Please log in again' : response.status === 500 ? 'Server error. Please check your Stripe configuration.' : 'Failed to create checkout session'}`,
        );
        setLoading(false);
        return;
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        alert(
          'Server returned an error. Please check your Stripe configuration.',
        );
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.error) {
        console.error('Error creating checkout session:', data.error);
        alert(`Error: ${data.error}`);
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout using the session URL
      if (data.url) {
        // Use the checkout session URL directly
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback: construct URL from session ID (if URL not provided)
        console.warn('Session URL not provided, using session ID fallback');
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
      } else {
        alert('No checkout URL received. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const plan = {
    name: 'Pro',
    trial: '7 dana besplatno',
    price: '€19',
    period: 'mesečno',
    afterTrial: 'Nakon probnog perioda 19€ mesečno do otkazivanja.',
    features: [
      'Unlimited tasks',
      'Kanban board view',
      'Calendar view',
      'Competitor tracking',
      'Case studies access',
      'AI-powered insights',
      'Advanced analytics',
    ],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pretplatite se na Viralio"
      description="Otključajte sve funkcije sa pretplatom"
      maxWidth="2xl"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        <div className="p-6 rounded-xl border-2 border-slate-200 bg-slate-50">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {plan.name}
            </h3>
            <p className="text-emerald-600 text-sm font-medium mb-1">
              {plan.trial}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">
                {plan.price}
              </span>
              <span className="text-slate-500">/{plan.period}</span>
            </div>
            <p className="text-slate-500 text-xs mt-1">{plan.afterTrial}</p>
          </div>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-700">
                <Check
                  size={16}
                  className="text-emerald-600 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${modalPrimaryButtonClass}`}
        >
          {loading ? (
            <>
              <Loader size="sm" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard size={20} />
              <span>Plaćanje putem Stripe (0€ tokom probnog perioda)</span>
            </>
          )}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Plaćanje obezbeđuje Stripe. Možete otkazati pretplatu u bilo kom
          trenutku.
        </p>
      </div>
    </Modal>
  );
}
