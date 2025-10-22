// This is a simplified client-side implementation of Stripe Checkout.

// IMPORTANT: For a production application, you should create Checkout Sessions on your server
// to prevent customers from manipulating the purchase amounts and other details.
// See Stripe's documentation: https://stripe.com/docs/checkout/quickstart

declare const Stripe: any;

// IMPORTANT: Replace this with your actual Stripe publishable key.
// It's recommended to store this in an environment variable.
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51Pbd8RRJg44qkpHfYMXV5xK3zJ5pX8NPU7GZobW44Gu7vslv55Xf6Hhm0n02EU0mll66k1g02jEaA03sRNfM8pYm00a5Rz8Nl8';

let stripePromise: Promise<any>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = new Promise((resolve, reject) => {
        if (typeof Stripe === 'undefined') {
            reject(new Error("Stripe.js has not loaded."));
            return;
        }
        resolve(Stripe(STRIPE_PUBLISHABLE_KEY));
    });
  }
  return stripePromise;
};

export const redirectToCheckout = async (priceId: string, credits: number) => {
  const stripe = await getStripe();
  
  // Construct success URL with query parameters
  const successUrl = `${window.location.origin}?payment_success=true&credits_purchased=${credits}`;
  const cancelUrl = `${window.location.origin}?payment_cancelled=true`;

  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: priceId, quantity: 1 }],
    mode: 'payment',
    successUrl,
    cancelUrl,
  });

  if (error) {
    console.error("Stripe Checkout error:", error);
    // This error will be displayed to the user by Stripe's UI, 
    // but we throw it here to be caught in the UI component for our own logging or state updates.
    throw new Error(error.message || 'Failed to redirect to Stripe Checkout.');
  }
};