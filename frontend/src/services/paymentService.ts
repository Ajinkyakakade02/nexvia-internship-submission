import api from './api';
import { ApiResponse, Payment, RazorpayResponse } from '@/types';

export const paymentService = {
  async createPaymentOrder(orderId: string): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    const response = await api.post<ApiResponse<{
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>>('/payments/create-order', { orderId });
    return response.data.data!;
  },

  async verifyPayment(verificationData: RazorpayResponse & { orderId: string }): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/payments/verify', verificationData);
    return response.data.data!;
  },
};
