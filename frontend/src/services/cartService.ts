import api from './api';
import { ApiResponse, Cart } from '@/types';

export const cartService = {
  async getCart(): Promise<Cart> {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data.data || { _id: '', customer: '', items: [], createdAt: '', updatedAt: '' };
  },

  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return response.data.data!;
  },

  async updateCartItem(productId: string, quantity: number): Promise<Cart> {
    const response = await api.put<ApiResponse<Cart>>(`/cart/items/${productId}`, {
      quantity,
    });
    return response.data.data!;
  },

  async removeCartItem(productId: string): Promise<Cart> {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${productId}`);
    return response.data.data!;
  },

  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },
};
