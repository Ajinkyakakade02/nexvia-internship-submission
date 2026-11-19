import api from './api';
import { ApiResponse, Coupon } from '@/types';

export const couponService = {
  async validateCoupon(code: string, orderAmount: number): Promise<{
    valid: boolean;
    discountAmount: number;
    coupon: Coupon;
  }> {
    const response = await api.post<ApiResponse<{
      valid: boolean;
      discountAmount: number;
      coupon: Coupon;
    }>>('/coupons/validate', { code, orderAmount, orderTotal: orderAmount });
    return response.data.data!;
  },
};
