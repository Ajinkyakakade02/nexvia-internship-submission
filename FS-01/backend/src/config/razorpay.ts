import Razorpay from 'razorpay';
import env from './env.js';

let razorpayInstance: Razorpay | null = null;

if (env.PAYMENT_PROVIDER !== 'simulation' && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
  console.log('[Razorpay] Initialized live/test client');
} else {
  console.log('[Razorpay] Running in simulation mode');
}

export const getRazorpayInstance = (): Razorpay | null => {
  return razorpayInstance;
};

export default razorpayInstance;
