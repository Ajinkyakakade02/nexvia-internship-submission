import api from './api';
import { ApiResponse, DashboardStats, OrderStatus, PaginatedResponse, VendorOrder, VendorProfile } from '@/types';

export const vendorService = {
  async apply(vendorData: {
    businessName: string;
    businessDescription: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress: string;
    gstNumber?: string;
  }): Promise<VendorProfile> {
    const response = await api.post<ApiResponse<VendorProfile>>('/vendor/apply', vendorData);
    return response.data.data!;
  },

  async getProfile(): Promise<VendorProfile> {
    const response = await api.get<ApiResponse<VendorProfile>>('/vendor/profile');
    return response.data.data!;
  },

  async updateProfile(data: Partial<VendorProfile>): Promise<VendorProfile> {
    const response = await api.put<ApiResponse<VendorProfile>>('/vendor/profile', data);
    return response.data.data!;
  },

  async getStatus(): Promise<{ status: string; adminNotes?: string }> {
    const response = await api.get<ApiResponse<{ status: string; adminNotes?: string }>>('/vendor/status');
    return response.data.data!;
  },

  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/vendor/dashboard');
    return response.data.data!;
  },

  async getOrders(params?: { page?: number; limit?: number; status?: OrderStatus }): Promise<PaginatedResponse<VendorOrder>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    const response = await api.get<ApiResponse<PaginatedResponse<VendorOrder>>>(`/vendor/orders?${searchParams.toString()}`);
    return response.data.data!;
  },

  async updateOrderStatus(vendorOrderId: string, status: OrderStatus, trackingNumber?: string, trackingUrl?: string): Promise<VendorOrder> {
    const response = await api.patch<ApiResponse<VendorOrder>>(`/vendor/orders/${vendorOrderId}/status`, {
      status,
      trackingNumber,
      trackingUrl,
    });
    return response.data.data!;
  },
};
