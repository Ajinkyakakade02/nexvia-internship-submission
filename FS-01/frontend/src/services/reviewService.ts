import api from './api';
import { ApiResponse, Review } from '@/types';

export const reviewService = {
  async getProductReviews(productId: string): Promise<Review[]> {
    const response = await api.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`);
    return response.data.data || [];
  },

  async createReview(productId: string, data: { rating: number; comment: string }): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>(`/products/${productId}/reviews`, data);
    return response.data.data!;
  },

  async updateReview(reviewId: string, data: { rating: number; comment: string }): Promise<Review> {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${reviewId}`, data);
    return response.data.data!;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },
};
