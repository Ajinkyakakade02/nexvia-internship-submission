import api from './api';
import {
  AdminDashboard,
  ApiResponse,
  Commission,
  Coupon,
  CouponFormData,
  Order,
  PaginatedResponse,
  Payment,
  Product,
  User,
  VendorProfile,
} from '@/types';

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    const response = await api.get<ApiResponse<AdminDashboard>>('/admin/dashboard');
    return response.data.data!;
  },

  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);
    const response = await api.get<ApiResponse<PaginatedResponse<User>>>(`/admin/users?${searchParams.toString()}`);
    return response.data.data!;
  },

  async getVendors(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<VendorProfile>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    const response = await api.get<ApiResponse<PaginatedResponse<VendorProfile>>>(`/admin/vendors?${searchParams.toString()}`);
    return response.data.data!;
  },

  async approveVendor(vendorId: string, notes?: string): Promise<VendorProfile> {
    const response = await api.patch<ApiResponse<VendorProfile>>(`/admin/vendors/${vendorId}/approve`, { notes });
    return response.data.data!;
  },

  async rejectVendor(vendorId: string, notes?: string): Promise<VendorProfile> {
    const response = await api.patch<ApiResponse<VendorProfile>>(`/admin/vendors/${vendorId}/reject`, { notes });
    return response.data.data!;
  },

  async getProducts(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    const response = await api.get<ApiResponse<PaginatedResponse<Product>>>(`/admin/products?${searchParams.toString()}`);
    return response.data.data!;
  },

  async getOrders(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    const response = await api.get<ApiResponse<PaginatedResponse<Order>>>(`/admin/orders?${searchParams.toString()}`);
    return response.data.data!;
  },

  async getPayments(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Payment>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const response = await api.get<ApiResponse<PaginatedResponse<Payment>>>(`/admin/payments?${searchParams.toString()}`);
    return response.data.data!;
  },

  async getCommissions(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Commission>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const response = await api.get<ApiResponse<PaginatedResponse<Commission>>>(`/admin/commissions?${searchParams.toString()}`);
    return response.data.data!;
  },

  async updateCommissionRate(rate: number): Promise<{ commissionRate: number }> {
    const response = await api.put<ApiResponse<{ commissionRate: number }>>('/admin/settings/commission', { rate });
    return response.data.data!;
  },

  async getCoupons(): Promise<Coupon[]> {
    const response = await api.get<ApiResponse<Coupon[]>>('/admin/coupons');
    return response.data.data || [];
  },

  async createCoupon(couponData: CouponFormData): Promise<Coupon> {
    const response = await api.post<ApiResponse<Coupon>>('/admin/coupons', couponData);
    return response.data.data!;
  },

  async updateCoupon(id: string, couponData: Partial<CouponFormData>): Promise<Coupon> {
    const response = await api.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, couponData);
    return response.data.data!;
  },

  async deleteCoupon(id: string): Promise<void> {
    await api.delete(`/admin/coupons/${id}`);
  },
};
