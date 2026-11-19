import api from './api';
import { ApiResponse, Order, PaginatedResponse, Address, OrderFilters } from '@/types';

export const orderService = {
  async createOrder(data: { shippingAddress: Address; couponCode?: string }): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data!;
  },

  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(`/orders?${params.toString()}`);
    return response.data.data!;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data!;
  },

  async getTracking(orderId: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderId}/tracking`);
    return response.data.data!;
  },

  async downloadInvoice(orderId: string): Promise<Blob> {
    const response = await api.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
