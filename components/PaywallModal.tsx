import React, { useState } from 'react';
import { CreditIcon, LoadingSpinnerIcon } from './icons';
import { redirectToCheckout } from '../services/stripeService';

interface PaywallModalProps {
  onClose: () => void;
}

// IMPORTANT: Replace these with your actual Price IDs from your Stripe dashboard.
const creditPackages = [
  { amount: 10, price: 4.99, popular: false, priceId: 'price_1PbdAWRJg44qkpHfQ1Lw8IEX' },
  { amount: 25, price: 9.99, popular: true, priceId: 'price_1PbdAWRJg44qkpHfBqH22WkK' },
  { amount: 100, price: 29.99, popular: false, priceId: 'price_1PbdAWRJg44qkpHfqJ7GZ6T1' },
];

const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null); // Store priceId of loading package
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (priceId: string, amount: number) => {
    setIsLoading(priceId);
    setError(null);
    try {
        await redirectToCheckout(priceId, amount);
        // User will be redirected to Stripe, no need to set loading to false here.
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setIsLoading(null);
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
          disabled={!!isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="mx-auto bg-purple-500/10 rounded-full h-16 w-16 flex items-center justify-center border-2 border-purple-500/30 mb-4">
            <CreditIcon />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Out of Credits!</h2>
        <p className="text-gray-400 mb-8">
          Choose a package below to continue creating amazing images.
        </p>

        <div className="space-y-4">
          {creditPackages.map((pkg) => (
            <button
              key={pkg.priceId}
              onClick={() => handlePurchase(pkg.priceId, pkg.amount)}
              disabled={!!isLoading}
              className={`relative w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait ${pkg.popular ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 bg-gray-700/30 hover:border-purple-400'}`}
            >
              {pkg.popular && (
                  <span className="absolute top-0 right-4 -translate-y-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      Popular
                  </span>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg text-white">{pkg.amount} Credits</p>
                  <p className="text-sm text-gray-400">One-time purchase</p>
                </div>
                 <div className="bg-gray-900/50 text-white font-semibold py-2 px-4 rounded-md min-w-[90px] text-center">
                  {isLoading === pkg.priceId ? <LoadingSpinnerIcon /> : `$${pkg.price}`}
                </div>
              </div>
            </button>
          ))}
        </div>
         {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
        <p className="text-xs text-gray-500 mt-8">
            You will be redirected to Stripe for secure payment processing.
        </p>
      </div>
    </div>
  );
};

export default PaywallModal;