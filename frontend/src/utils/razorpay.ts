import { RazorpayOptions, RazorpayResponse } from '@/types';

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface CheckoutOptions {
  orderId: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  handler: (response: RazorpayResponse) => void;
  onDismiss?: () => void;
  key?: string;
}

export async function openRazorpayCheckout(options: CheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  const razorpayKey = options.key || (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_placeholder';

  const rzpOptions: RazorpayOptions = {
    key: razorpayKey,
    amount: options.amount * 100, // in paise
    currency: options.currency || 'INR',
    name: options.name || 'NexMart Marketplace',
    description: options.description || 'Order Payment',
    order_id: options.orderId,
    prefill: options.prefill,
    handler: options.handler,
    modal: {
      ondismiss: options.onDismiss,
    },
    theme: {
      color: '#2563eb',
    },
  };

  const paymentObject = new window.Razorpay(rzpOptions);
  paymentObject.open();
}
